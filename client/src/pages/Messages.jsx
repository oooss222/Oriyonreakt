import React from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Shield,
  Search,
  RefreshCw,
} from "lucide-react";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const getId = (item) => item?.id || item?._id;

const getPeerId = (item, me) => {
  const myId = me?.id || me?._id;

  if (!item || !myId) return null;

  return String(item.senderId) === String(myId)
    ? item.receiverId
    : item.senderId;
};

const isOnline = (lastSeen) => {
  if (!lastSeen) return false;

  const diff = Date.now() - new Date(lastSeen).getTime();

  return diff < 2 * 60 * 1000;
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "не в сети";

  if (isOnline(lastSeen)) return "онлайн";

  return (
    "был(а) " +
    new Date(lastSeen).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

const formatDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Messages() {
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const me = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [thread, setThread] = React.useState([]);
  const [text, setText] = React.useState("");
  const [query, setQuery] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const chatEndRef = React.useRef(null);

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

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
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, me]
  );

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/auth";
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
    }, 15000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token, loadInbox]);

  const loadThread = React.useCallback(
    async (item, { silent = false } = {}) => {
      if (!item || !token) return;

      try {
        if (!silent) setThreadLoading(true);

        const peerId = getPeerId(item, me);

        const data = await api.messageThread(
          token,
          item.listingId,
          peerId
        );

        const next = Array.isArray(data) ? data : [];

        setThread((current) => {
          const currentIds = current.map((msg) => String(getId(msg))).join(",");
          const nextIds = next.map((msg) => String(getId(msg))).join(",");

          if (currentIds === nextIds && current.length === next.length) {
            return current;
          }

          return next;
        });
      } catch {
        if (!silent) setThread([]);
      } finally {
        setThreadLoading(false);
      }
    },
    [token, me]
  );

  const openThread = async (item) => {
    setSelected(item);
    await loadThread(item);
  };

  React.useEffect(() => {
    if (!selected || !token) return;

    let active = true;

    const timer = setInterval(() => {
      if (active) loadThread(selected, { silent: true });
    }, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selected, token, loadThread]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [thread.length, selected]);

  const send = async () => {
    const value = text.trim();

    if (!value || !selected || sending) return;

    try {
      setSending(true);

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

      setText("");

      await loadInbox({ silent: true });
    } catch (e) {
      alert(e.message || "Не удалось отправить сообщение");
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

  const selectedPeerLastSeen =
    String(selected?.senderId) === String(me?.id || me?._id)
      ? selected?.receiverLastSeen
      : selected?.senderLastSeen;

  if (loading) {
    return (
      <div className="container-x py-8">
        <div className="rounded-2xl border bg-white p-6">
          Загрузка сообщений...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1700px] mx-auto px-3 md:px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
            <MessageCircle size={16} />
            Сообщения
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold">
            Центр сообщений
          </h1>

          {isAdmin && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
              <Shield size={14} />
              Администратор видит все диалоги
            </div>
          )}
        </div>

        <Link to="/profile" className="btn">
          <ArrowLeft size={18} />
          Профиль
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <aside className="lg:col-span-4 xl:col-span-4 rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-3 h-fit shadow-sm">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <div className="font-bold">Диалоги</div>

            <button
              type="button"
              onClick={() => loadInbox()}
              disabled={refreshing}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border hover:bg-slate-50 disabled:opacity-60"
              title="Обновить"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="relative mb-3">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по сообщениям..."
              className="w-full h-11 rounded-2xl border bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
              Диалогов пока нет.
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const peerId = getPeerId(item, me);

                const active =
                  String(selected?.listingId) === String(item.listingId) &&
                  String(getPeerId(selected, me)) === String(peerId);

                return (
                  <button
                    key={`${item.listingId}-${peerId}-${getId(item)}`}
                    type="button"
                    onClick={() => openThread(item)}
                    className={`w-full text-left rounded-3xl border p-4 transition-all shadow-sm ${
                      active
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-100"
                        : "border-slate-200 hover:bg-white hover:shadow-md hover:-translate-y-[1px]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold line-clamp-1">
                        {item.listingTitle || "Объявление"}
                      </div>

                      {Number(item.unreadCount || 0) > 0 && (
                        <div className="min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                          {Number(item.unreadCount || 0) > 99
                            ? "99+"
                            : item.unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {item.senderName || item.senderEmail || "Пользователь"} →{" "}
                      {item.receiverName ||
                        item.receiverEmail ||
                        "Пользователь"}
                    </div>

                    <div className="text-sm mt-2 line-clamp-2 text-slate-700">
                      {item.text}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2">
                      {formatDate(item.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className="lg:col-span-8 xl:col-span-8 rounded-3xl border border-slate-200 bg-white/80 backdrop-blur min-h-[620px] flex flex-col shadow-sm overflow-hidden">
          {!selected ? (
            <div className="flex-1 grid place-items-center p-8 text-center">
              <div>
                <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 grid place-items-center mb-3">
                  <MessageCircle className="text-blue-600" />
                </div>

                <div className="font-bold text-lg">Выберите диалог</div>

                <div className="text-sm text-slate-500 mt-1">
                  Откройте диалог из списка слева.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b bg-white/90 backdrop-blur px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-bold">
                    {selected.listingTitle || "Объявление"}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{selected.senderName || selected.senderEmail}</span>
                    <span>→</span>
                    <span>
                      {selected.receiverName || selected.receiverEmail}
                    </span>

                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isOnline(selectedPeerLastSeen)
                          ? "bg-green-500"
                          : "bg-slate-300"
                      }`}
                    />

                    <span>{formatLastSeen(selectedPeerLastSeen)}</span>
                  </div>
                </div>

                <Link to={`/ad/${selected.listingId}`} className="btn">
                  Открыть объявление
                </Link>
              </div>

              <div
                className="flex-1 overflow-y-auto px-3 md:px-5 py-5 space-y-3 bg-[#eef2f7]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                {threadLoading ? (
                  <div className="text-slate-500">Загружаем диалог...</div>
                ) : thread.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    Сообщений пока нет.
                  </div>
                ) : (
                  thread.map((msg) => {
                    const myId = me?.id || me?._id;
                    const mine = String(msg.senderId) === String(myId);

                    return (
                      <div
                        key={getId(msg)}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[92%] md:max-w-[60%] rounded-[24px] px-4 py-3 shadow-sm border ${
                            mine
                              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500"
                              : "bg-white text-slate-900 border-slate-200"
                          }`}
                        >
                          <div
                            className={`text-xs mb-1 ${
                              mine ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>
                                {msg.senderName ||
                                  msg.senderEmail ||
                                  "Пользователь"}
                              </span>

                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isOnline(msg.senderLastSeen)
                                    ? "bg-green-400"
                                    : "bg-slate-300"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="whitespace-pre-wrap text-sm leading-6">
                            {msg.text}
                          </div>

                          <div
                            className={`text-[11px] mt-1 ${
                              mine ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={chatEndRef} />
              </div>

              {!isAdmin && (
                <div className="border-t bg-white/95 backdrop-blur p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      rows={1}
                      placeholder="Введите сообщение..."
                      className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm"
                    />

                    <button
                      type="button"
                      onClick={send}
                      disabled={sending || !text.trim()}
                      className="inline-flex justify-center items-center gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-blue-200"
                    >
                      <Send size={18} />
                      {sending ? "..." : "Отправить"}
                    </button>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="border-t p-4 text-sm text-slate-500 bg-slate-50">
                  Администратор может просматривать диалог, но не отвечает от
                  имени пользователей.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}