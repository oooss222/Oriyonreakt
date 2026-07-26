import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Shield,
  Search,
  RefreshCw,
  Check,
  CheckCheck,
  X,
} from "lucide-react";
import { api, API_BASE } from "../lib/api";
import {
  connectChatSocket,
  getChatSocket,
} from "../lib/chatSocket";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const QUICK_REPLIES = [
  "Здравствуйте! Актуально?",
  "Можно посмотреть сегодня?",
  "Торг возможен?",
];

const getId = (item) => item?.id || item?._id;

const getPeerId = (item, me) => {
  const myId = me?.id || me?._id;

  if (!item || !myId) return null;

  return String(item.senderId) === String(myId)
    ? item.receiverId
    : item.senderId;
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "не в сети";

  return (
    "был(а) " +
    new Date(lastSeen).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

const formatTime = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDayLabel = (value) => {
  if (!value) return "";

  const d = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfToday - startOfDay) / 86400000
  );

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";

  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function groupMessagesByDay(messages) {
  const groups = [];
  let currentDay = null;

  for (const msg of messages) {
    const day = formatDayLabel(msg.createdAt);

    if (day !== currentDay) {
      groups.push({ type: "day", id: `day-${day}`, label: day });
      currentDay = day;
    }

    groups.push({ type: "message", id: getId(msg), data: msg });
  }

  return groups;
}

function listingImageUrl(src) {
  if (!src) return "";

  if (src.startsWith("http") || src.startsWith("/img/")) {
    return src;
  }

  return API_BASE.replace("/api", "") + src;
}

function Toast({ message, type = "info", onClose }) {
  React.useEffect(() => {
    if (!message) return;

    const timer = setTimeout(onClose, 3200);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const styles =
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-emerald-600"
      : "bg-ink-800";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] animate-fade-in-up">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm shadow-lift ${styles}`}
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded hover:bg-white/15"
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Messages() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const me = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const deepListingId = searchParams.get("listingId");
  const deepPeerId = searchParams.get("peerId");
  const deepTitle = searchParams.get("title");

  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [thread, setThread] = React.useState([]);
  const [text, setText] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [mobileView, setMobileView] = React.useState("list");
  const [typingPeer, setTypingPeer] = React.useState(false);
  const [toast, setToast] = React.useState({ message: "", type: "info" });
  const [socketReady, setSocketReady] = React.useState(false);
  const [socketError, setSocketError] = React.useState("");
  const [peerPresence, setPeerPresence] = React.useState({});

  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const chatEndRef = React.useRef(null);
  const deepHandledRef = React.useRef(false);
  const typingTimerRef = React.useRef(null);
  const typingEmitRef = React.useRef(null);

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";
  const myId = me?.id || me?._id;

  const showToast = React.useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  const applyPresenceUpdate = React.useCallback(
    ({ userId, online, lastSeen }) => {
      if (!userId) return;

      setPeerPresence((prev) => ({
        ...prev,
        [String(userId)]: {
          online: Boolean(online),
          lastSeen: lastSeen || prev[String(userId)]?.lastSeen || null,
        },
      }));
    },
    []
  );

  React.useEffect(() => {
    setPeerPresence((prev) => {
      const next = { ...prev };

      for (const item of items) {
        const pairs = [
          [item.senderId, item.senderLastSeen],
          [item.receiverId, item.receiverLastSeen],
        ];

        for (const [userId, lastSeen] of pairs) {
          if (!userId || !lastSeen) continue;

          const key = String(userId);
          const existing = next[key];

          next[key] = {
            online: existing?.online ?? false,
            lastSeen: lastSeen,
          };
        }
      }

      return next;
    });
  }, [items]);

  const loadInbox = React.useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return;

      try {
        if (!silent) setRefreshing(true);

        const data = await api.messageInbox(token);
        const next = Array.isArray(data) ? data : [];

        setItems(next);

        setSelected((current) => {
          if (!current) return current;

          const currentPeerId = getPeerId(current, me);

          const updated = next.find((item) => {
            return (
              String(item.listingId) === String(current.listingId) &&
              String(getPeerId(item, me)) === String(currentPeerId)
            );
          });

          return updated || current;
        });
      } catch {
        if (!silent) setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, me]
  );

  const loadThread = React.useCallback(
    async (item, { silent = false } = {}) => {
      if (!item || !token) return;

      const peerId = getPeerId(item, me);

      if (!peerId) return;

      try {
        if (!silent) setThreadLoading(true);

        const data = await api.messageThread(token, item.listingId, peerId);
        const next = Array.isArray(data) ? data : [];

        setThread(next);
      } catch (e) {
        if (!silent) {
          setThread([]);
          showToast(e.message || "Не удалось загрузить диалог", "error");
        }
      } finally {
        setThreadLoading(false);
      }
    },
    [token, me, showToast]
  );

  const openThread = React.useCallback(
    async (item) => {
      setSelected(item);
      setMobileView("chat");
      setTypingPeer(false);
      await loadThread(item);
    },
    [loadThread]
  );

  React.useEffect(() => {
    if (!token) {
      nav("/auth");
      return;
    }

    let alive = true;

    async function start() {
      if (!alive) return;
      await loadInbox({ silent: true });
    }

    start();

    const timer = setInterval(() => {
      if (alive) loadInbox({ silent: true });
    }, socketReady ? 60000 : 15000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token, loadInbox, nav, socketReady]);

  React.useEffect(() => {
    if (!token) return undefined;

    const socket = connectChatSocket(token);

    if (!socket) return undefined;

    const onConnect = () => {
      setSocketReady(true);
      setSocketError("");
    };
    const onDisconnect = () => setSocketReady(false);
    const onConnectError = (err) => {
      setSocketReady(false);
      setSocketError(err?.message || "Ошибка подключения");
    };

    const onMessageNew = ({ message }) => {
      if (!message) return;

      setItems((prev) => {
        const peerId =
          String(message.senderId) === String(myId)
            ? message.receiverId
            : message.senderId;

        const idx = prev.findIndex(
          (item) =>
            String(item.listingId) === String(message.listingId) &&
            String(getPeerId(item, me)) === String(peerId)
        );

        const preview = {
          ...message,
          text: message.text,
          createdAt: message.createdAt,
          unreadCount:
            String(message.receiverId) === String(myId) ? 1 : 0,
        };

        if (idx === -1) {
          return [preview, ...prev];
        }

        const copy = [...prev];
        const existing = copy[idx];

        copy[idx] = {
          ...existing,
          ...preview,
          unreadCount:
            String(message.receiverId) === String(myId)
              ? Number(existing.unreadCount || 0) + 1
              : 0,
        };

        copy.sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        return copy;
      });

      setSelected((current) => {
        if (!current) return current;

        const peerId = getPeerId(current, me);
        const sameThread =
          String(current.listingId) === String(message.listingId) &&
          (String(message.senderId) === String(peerId) ||
            String(message.receiverId) === String(peerId));

        if (!sameThread) return current;

        setThread((arr) => {
          const exists = arr.some(
            (item) => String(getId(item)) === String(getId(message))
          );

          return exists ? arr : [...arr, message];
        });

        if (String(message.receiverId) === String(myId)) {
          loadThread(current, { silent: true });
        }

        return current;
      });

      if (String(message.receiverId) === String(myId)) {
        showToast("Новое сообщение", "info");
      }
    };

    const onMessagesRead = ({ listingId, readerId }) => {
      setThread((arr) =>
        arr.map((msg) =>
          String(msg.listingId) === String(listingId) &&
          String(msg.senderId) === String(myId) &&
          String(readerId) !== String(myId)
            ? { ...msg, isRead: true }
            : msg
        )
      );
    };

    const onTypingStart = ({ listingId, peerId }) => {
      setSelected((current) => {
        if (
          current &&
          String(current.listingId) === String(listingId) &&
          String(peerId) === String(getPeerId(current, me))
        ) {
          setTypingPeer(true);
        }

        return current;
      });
    };

    const onTypingStop = ({ listingId, peerId }) => {
      setSelected((current) => {
        if (
          current &&
          String(current.listingId) === String(listingId) &&
          String(peerId) === String(getPeerId(current, me))
        ) {
          setTypingPeer(false);
        }

        return current;
      });
    };

    const onPresenceUpdate = ({ userId, online, lastSeen }) => {
      applyPresenceUpdate({ userId, online, lastSeen });
    };

    const onPresenceSnapshot = ({ onlineUserIds }) => {
      const now = new Date().toISOString();

      setPeerPresence((prev) => {
        const next = { ...prev };

        for (const id of onlineUserIds || []) {
          const key = String(id);
          next[key] = {
            online: true,
            lastSeen: next[key]?.lastSeen || now,
          };
        }

        return next;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("message:new", onMessageNew);
    socket.on("messages:read", onMessagesRead);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("presence:update", onPresenceUpdate);
    socket.on("presence:snapshot", onPresenceSnapshot);

    if (socket.connected) {
      setSocketReady(true);
      socket.emit("presence:heartbeat");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("message:new", onMessageNew);
      socket.off("messages:read", onMessagesRead);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("presence:update", onPresenceUpdate);
      socket.off("presence:snapshot", onPresenceSnapshot);
      setSocketReady(false);
    };
  }, [token, myId, me, loadThread, showToast, applyPresenceUpdate]);

  React.useEffect(() => {
    if (!selected || !token || socketReady) return undefined;

    let active = true;

    const timer = setInterval(() => {
      if (active) loadThread(selected, { silent: true });
    }, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selected, token, loadThread, socketReady]);

  React.useEffect(() => {
    if (!token || !deepListingId || !deepPeerId || deepHandledRef.current) {
      return;
    }

    if (loading) return;

    deepHandledRef.current = true;

    const match = items.find(
      (item) =>
        String(item.listingId) === String(deepListingId) &&
        String(getPeerId(item, me)) === String(deepPeerId)
    );

    const target =
      match ||
      {
        listingId: deepListingId,
        listingTitle: deepTitle || "Объявление",
        senderId: myId,
        receiverId: deepPeerId,
      };

    openThread(target);
    setSearchParams({}, { replace: true });
  }, [
    token,
    deepListingId,
    deepPeerId,
    deepTitle,
    loading,
    items,
    me,
    myId,
    openThread,
    setSearchParams,
  ]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [thread.length, selected, typingPeer]);

  const emitTyping = React.useCallback(
    (active) => {
      if (!selected || isAdmin) return;

      const socket = getChatSocket();
      const peerId = getPeerId(selected, me);

      if (!socket || !peerId) return;

      const payload = {
        listingId: selected.listingId,
        peerId,
      };

      if (active) {
        socket.emit("typing:start", payload);
      } else {
        socket.emit("typing:stop", payload);
      }
    },
    [selected, me, isAdmin]
  );

  const handleTextChange = (value) => {
    setText(value);

    if (!value.trim()) {
      emitTyping(false);
      return;
    }

    emitTyping(true);

    clearTimeout(typingEmitRef.current);
    typingEmitRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const send = async (presetText) => {
    const value = (presetText ?? text).trim();

    if (!value || !selected || sending) return;

    try {
      setSending(true);
      emitTyping(false);

      const receiverId = getPeerId(selected, me);

      const msg = await api.sendMessage(
        token,
        selected.listingId,
        value,
        receiverId
      );

      setThread((arr) => {
        const exists = arr.some(
          (item) => String(getId(item)) === String(getId(msg))
        );

        return exists ? arr : [...arr, msg];
      });

      if (!presetText) {
        setText("");
      }

      await loadInbox({ silent: true });
    } catch (e) {
      showToast(e.message || "Не удалось отправить сообщение", "error");
    } finally {
      setSending(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return items;

    return items.filter((item) => {
      return (
        String(item.listingTitle || "").toLowerCase().includes(value) ||
        String(item.senderName || "").toLowerCase().includes(value) ||
        String(item.receiverName || "").toLowerCase().includes(value) ||
        String(item.senderEmail || "").toLowerCase().includes(value) ||
        String(item.receiverEmail || "").toLowerCase().includes(value) ||
        String(item.text || "").toLowerCase().includes(value)
      );
    });
  }, [items, query]);

  const groupedThread = React.useMemo(
    () => groupMessagesByDay(thread),
    [thread]
  );

  const selectedPeerId = selected ? getPeerId(selected, me) : null;
  const peerPresenceInfo = selectedPeerId
    ? peerPresence[String(selectedPeerId)]
    : null;

  const selectedPeerLastSeen =
    peerPresenceInfo?.lastSeen ??
    (String(selected?.senderId) === String(myId)
      ? selected?.receiverLastSeen
      : selected?.senderLastSeen);

  const peerOnline =
    socketReady && peerPresenceInfo?.online === true;

  const peerName =
    String(selected?.senderId) === String(myId)
      ? selected?.receiverName || selected?.receiverEmail
      : selected?.senderName || selected?.senderEmail;

  if (loading) {
    return (
      <div className="page-shell min-h-screen px-4 py-8">
        <div className="max-w-[1800px] mx-auto surface-panel p-6 animate-pulse space-y-3">
          <div className="h-8 bg-mist-200 rounded-xl w-48" />
          <div className="h-64 bg-mist-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      <div className="max-w-[1800px] mx-auto px-2 md:px-5 py-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sun to-lagoon-600 text-white shadow-soft flex items-center justify-center">
              <MessageCircle size={26} />
            </div>

            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
                Сообщения
              </h1>
              <p className="text-ink-400 mt-0.5 text-sm">
                {socketReady
                  ? "Онлайн · мгновенные обновления"
                  : socketError
                  ? "Нет real-time · сообщения обновляются автоматически"
                  : "Подключение к чату…"}
              </p>
              {isAdmin && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
                  <Shield size={14} />
                  Администратор видит все диалоги
                </div>
              )}
            </div>
          </div>

          <Link to="/profile" className="btn hidden sm:inline-flex">
            <ArrowLeft size={18} />
            Профиль
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-5">
          <aside
            className={`surface-panel h-[calc(100vh-140px)] min-h-[480px] flex-col overflow-hidden ${
              mobileView === "chat" ? "hidden xl:flex" : "flex"
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-ink/10">
              <div>
                <div className="font-display font-bold text-lg text-ink">
                  Диалоги
                </div>
                <div className="text-xs text-ink-400">
                  {filteredItems.length} чатов
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadInbox()}
                disabled={refreshing}
                className="btn p-2.5 disabled:opacity-60"
                title="Обновить"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="relative px-4 py-3">
              <Search
                size={18}
                className="absolute left-7 top-1/2 -translate-y-1/2 text-ink-300"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по сообщениям..."
                className="input w-full h-11 pl-10"
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="mx-4 mb-4 rounded-2xl bg-mist p-6 text-center text-sm text-ink-400">
                Диалогов пока нет.
              </div>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
                {filteredItems.map((item) => {
                  const peerId = getPeerId(item, me);

                  const active =
                    String(selected?.listingId) === String(item.listingId) &&
                    String(getPeerId(selected, me)) === String(peerId);

                  const thumb = listingImageUrl(item.listingImage);

                  return (
                    <button
                      key={`${item.listingId}-${peerId}-${getId(item)}`}
                      type="button"
                      onClick={() => openThread(item)}
                      className={`w-full text-left rounded-2xl p-3 transition border ${
                        active
                          ? "bg-sun-50 border-sun-200 shadow-soft"
                          : "bg-white border-ink/10 hover:border-sun/30 hover:shadow-soft"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-mist overflow-hidden shrink-0">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-ink-300">
                              <MessageCircle size={18} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-ink line-clamp-1">
                              {item.listingTitle || "Объявление"}
                            </div>

                            {Number(item.unreadCount || 0) > 0 && (
                              <div className="min-w-[22px] h-[22px] px-1 rounded-full bg-sun text-white text-[11px] font-bold flex items-center justify-center">
                                {Number(item.unreadCount || 0) > 99
                                  ? "99+"
                                  : item.unreadCount}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-ink-400 mt-0.5 line-clamp-1">
                            {item.senderName || item.senderEmail || "Пользователь"}
                          </div>

                          <div className="text-sm mt-1 line-clamp-2 text-ink-500">
                            {item.text}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main
            className={`surface-panel h-[calc(100vh-140px)] min-h-[480px] flex-col overflow-hidden ${
              mobileView === "list" ? "hidden xl:flex" : "flex"
            }`}
          >
            {!selected ? (
              <div className="flex-1 grid place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sun to-lagoon-600 text-white grid place-items-center mb-4 shadow-soft">
                    <MessageCircle size={30} />
                  </div>
                  <div className="font-display font-bold text-xl text-ink">
                    Выберите диалог
                  </div>
                  <div className="text-sm text-ink-400 mt-2">
                    Откройте чат из списка слева.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-ink/10 px-4 py-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="btn p-2.5 xl:hidden shrink-0"
                    aria-label="Назад к диалогам"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {listingImageUrl(selected.listingImage) ? (
                    <img
                      src={listingImageUrl(selected.listingImage)}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover bg-mist shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-mist grid place-items-center shrink-0">
                      <MessageCircle size={18} className="text-ink-300" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-ink line-clamp-1">
                      {selected.listingTitle || "Объявление"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                      <span>{peerName || "Пользователь"}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          peerOnline ? "bg-emerald-500" : "bg-ink-200"
                        }`}
                      />
                      <span>
                        {peerOnline ? "онлайн" : formatLastSeen(selectedPeerLastSeen)}
                      </span>
                      {typingPeer && (
                        <span className="text-sun font-medium">печатает…</span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/ad/${selected.listingId}`}
                    className="btn btn-primary shrink-0 text-sm hidden sm:inline-flex"
                  >
                    Объявление
                  </Link>
                </div>

                <div
                  className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-3 bg-mist"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(28,27,26,0.05) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                >
                  {threadLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-12 bg-white rounded-2xl w-2/3" />
                      <div className="h-12 bg-white rounded-2xl w-1/2 ml-auto" />
                    </div>
                  ) : thread.length === 0 ? (
                    <div className="text-center text-ink-400 py-10">
                      Сообщений пока нет. Напишите первым!
                    </div>
                  ) : (
                    groupedThread.map((entry) => {
                      if (entry.type === "day") {
                        return (
                          <div
                            key={entry.id}
                            className="flex justify-center py-2"
                          >
                            <span className="text-xs font-medium text-ink-400 bg-white/80 border border-ink/10 rounded-full px-3 py-1">
                              {entry.label}
                            </span>
                          </div>
                        );
                      }

                      const msg = entry.data;
                      const mine = String(msg.senderId) === String(myId);

                      return (
                        <div
                          key={entry.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[88%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              mine
                                ? "bg-ink-700 text-white shadow-soft"
                                : "bg-white text-ink border border-ink/10 shadow-soft"
                            }`}
                          >
                            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                              {msg.text}
                            </div>

                            <div
                              className={`flex items-center justify-end gap-1 text-[11px] mt-1 ${
                                mine ? "text-white/55" : "text-ink-300"
                              }`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {mine && (
                                <span
                                  className="inline-flex"
                                  title={msg.isRead ? "Прочитано" : "Доставлено"}
                                >
                                  {msg.isRead ? (
                                    <CheckCheck size={14} className="text-sun-300" />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={chatEndRef} />
                </div>

                {!isAdmin && (
                  <div className="border-t border-ink/10 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => send(reply)}
                          disabled={sending}
                          className="text-xs px-3 py-1.5 rounded-full border border-ink/10 bg-mist hover:bg-sun-50 hover:border-sun/30 transition disabled:opacity-60"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-end gap-3">
                      <textarea
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        rows={1}
                        placeholder="Введите сообщение..."
                        className="input flex-1 min-h-[52px] max-h-[160px] resize-none py-3"
                      />

                      <button
                        type="button"
                        onClick={() => send()}
                        disabled={sending || !text.trim()}
                        className="btn btn-primary h-[52px] px-5 disabled:opacity-60"
                      >
                        <Send size={18} />
                        {sending ? "..." : "Отправить"}
                      </button>
                    </div>

                    <div className="text-xs text-ink-400">
                      Enter — отправить · Shift+Enter — новая строка
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="border-t border-ink/10 bg-white p-4 text-sm text-ink-400">
                    Администратор может просматривать диалог, но не отвечает от
                    имени пользователей.
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
