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
      <div className="min-h-screen bg-[#f5f7fb] px-4 py-8">
        <div className="max-w-[1800px] mx-auto rounded-[34px] border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          Загрузка сообщений...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="max-w-[1800px] mx-auto px-2 md:px-5 py-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-200 flex items-center justify-center">
              <MessageCircle size={28} />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Центр сообщений
              </h1>

              <p className="text-slate-500 mt-1 text-sm md:text-base">
                Общайтесь с покупателями и продавцами
              </p>

              {isAdmin && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
                  <Shield size={14} />
                  Администратор видит все диалоги
                </div>
              )}
            </div>
          </div>

          <Link
            to="/profile"
            className="h-12 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center gap-2 font-medium shadow-sm"
          >
            <ArrowLeft size={18} />
            Профиль
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-5">
          <aside className="rounded-[34px] border border-white/60 bg-white/80 backdrop-blur-xl p-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)] h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <div>
                <div className="font-black text-lg text-slate-900">
                  Диалоги
                </div>
                <div className="text-xs text-slate-400">
                  {filteredItems.length} чатов
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadInbox()}
                disabled={refreshing}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 shadow-sm"
                title="Обновить"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="relative my-3">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по сообщениям..."
                className="w-full h-14 rounded-3xl border-0 bg-[#f4f7fb] pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Диалогов пока нет.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 pb-2">
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
                      className={`w-full text-left rounded-[28px] p-4 transition-all duration-300 border ${
                        active
                          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg shadow-blue-100 scale-[1.01]"
                          : "bg-white/70 border-white hover:bg-white hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-[2px]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {item.listingTitle || "Объявление"}
                        </div>

                        {Number(item.unreadCount || 0) > 0 && (
                          <div className="min-w-[24px] h-[24px] px-1 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-blue-200">
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

          <main className="rounded-[36px] border border-white/60 bg-white/70 backdrop-blur-xl h-[88vh] flex flex-col overflow-hidden shadow-[0_10px_50px_rgba(15,23,42,0.08)]">
            {!selected ? (
              <div className="flex-1 grid place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-500 text-white grid place-items-center mb-4 shadow-xl shadow-blue-200">
                    <MessageCircle size={34} />
                  </div>

                  <div className="font-black text-2xl text-slate-900">
                    Выберите диалог
                  </div>

                  <div className="text-sm text-slate-500 mt-2">
                    Откройте диалог из списка слева.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-white/50 bg-white/80 backdrop-blur-xl px-5 md:px-7 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-black text-lg text-slate-900">
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

                  <Link
                    to={`/ad/${selected.listingId}`}
                    className="h-12 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition flex items-center justify-center font-semibold shadow-sm"
                  >
                    Открыть объявление
                  </Link>
                </div>

                <div
                  className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 bg-[#f7f9fc]"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(148,163,184,0.12) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
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
                            className={`max-w-[92%] md:max-w-[72%] xl:max-w-[58%] rounded-[26px] px-5 py-3 ${
                              mine
                                ? "bg-gradient-to-br from-[#4f6df5] via-[#4d63ff] to-[#6d5dfc] text-white border-0 shadow-[0_10px_30px_rgba(79,109,245,0.35)]"
                                : "bg-white text-slate-900 border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
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

                            <div className="whitespace-pre-wrap text-[15px] leading-7 font-medium">
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
                  <div className="border-t border-white/40 bg-white/70 backdrop-blur-xl p-4">
                    <div className="flex items-end gap-3">
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
                        className="flex-1 min-h-[58px] max-h-[180px] rounded-[28px] border-0 bg-[#f4f7fb] px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner text-[15px]"
                      />

                      <button
                        type="button"
                        onClick={send}
                        disabled={sending || !text.trim()}
                        className="h-[58px] px-7 rounded-[24px] bg-gradient-to-r from-[#4f6df5] to-[#6d5dfc] text-white font-semibold inline-flex items-center gap-2 shadow-[0_10px_30px_rgba(79,109,245,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        <Send size={18} />
                        {sending ? "..." : "Отправить"}
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-slate-400 px-2">
                      Enter — отправить, Shift + Enter — новая строка
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="border-t border-white/40 bg-white/70 backdrop-blur-xl p-4 text-sm text-slate-500">
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