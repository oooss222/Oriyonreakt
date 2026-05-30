import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, ArrowLeft, Shield } from "lucide-react";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const getId = (item) => item?.id || item?._id;

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
  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    let alive = true;

    api
      .messageInbox(token)
      .then((data) => {
        if (alive) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (alive) {
          setItems([]);
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [token]);

  const openThread = async (item) => {
    try {
      setSelected(item);
      setThreadLoading(true);

      const data = await api.messageThread(token, item.listingId);

      setThread(Array.isArray(data) ? data : []);
    } catch {
      setThread([]);
    } finally {
      setThreadLoading(false);
    }
  };

  React.useEffect(() => {
  if (!selected || !token) return;

  let active = true;

  async function refreshThread() {
    try {
      const data = await api.messageThread(
        token,
        selected.listingId
      );

      if (!active) return;

      setThread(Array.isArray(data) ? data : []);
    } catch {}
  }

  const timer = setInterval(refreshThread, 5000);

  return () => {
    active = false;
    clearInterval(timer);
  };
}, [selected, token]);

  const getReceiverId = () => {
    const myId = me?.id || me?._id;

    if (!selected || !myId) return null;

    return String(selected.senderId) === String(myId)
      ? selected.receiverId
      : selected.senderId;
  };

  const send = async () => {
    const value = text.trim();

    if (!value || !selected || sending) return;

    try {
      setSending(true);

      const msg = await api.sendMessage(
        token,
        selected.listingId,
        value,
        getReceiverId()
      );

      setThread((arr) => [...arr, msg]);
      setText("");
    } catch (e) {
      alert(e.message || "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

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
    <div className="container-x py-6">
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
        <aside className="lg:col-span-4 xl:col-span-3 rounded-3xl border bg-white p-3 h-fit">
          <div className="font-bold px-2 py-2">
            Диалоги
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
              Диалогов пока нет.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const active = selected?.listingId === item.listingId;

                return (
                  <button
                    key={getId(item)}
                    type="button"
                    onClick={() => openThread(item)}
                    className={`w-full text-left rounded-2xl border p-3 transition ${
                      active
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                   <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold line-clamp-1">
                        {item.listingTitle || "Объявление"}
                    </div>

                    {Number(item.unreadCount || 0) > 0 && (
                        <div className="min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                        {Number(item.unreadCount || 0) > 99 ? "99+" : item.unreadCount}
                        </div>
                    )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {item.senderName || item.senderEmail || "Пользователь"} →{" "}
                      {item.receiverName || item.receiverEmail || "Пользователь"}
                    </div>

                    <div className="text-sm mt-2 line-clamp-2 text-slate-700">
                      {item.text}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className="lg:col-span-8 xl:col-span-9 rounded-3xl border bg-white min-h-[520px] flex flex-col">
          {!selected ? (
            <div className="flex-1 grid place-items-center p-8 text-center">
              <div>
                <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 grid place-items-center mb-3">
                  <MessageCircle className="text-blue-600" />
                </div>

                <div className="font-bold text-lg">
                  Выберите диалог
                </div>

                <div className="text-sm text-slate-500 mt-1">
                  Откройте диалог из списка слева.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold">
                    {selected.listingTitle || "Объявление"}
                  </div>

                  <div className="text-xs text-slate-500">
                    {selected.senderName || selected.senderEmail} →{" "}
                    {selected.receiverName || selected.receiverEmail}
                  </div>
                </div>

                <Link
                  to={`/ad/${selected.listingId}`}
                  className="btn"
                >
                  Открыть объявление
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {threadLoading ? (
                  <div className="text-slate-500">
                    Загружаем диалог...
                  </div>
                ) : (
                  thread.map((msg) => {
                    const myId = me?.id || me?._id;
                    const mine = String(msg.senderId) === String(myId);

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 border ${
                            mine
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-900"
                          }`}
                        >
                          <div
                            className={`text-xs mb-1 ${
                              mine ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {msg.senderName ||
                              msg.senderEmail ||
                              "Пользователь"}
                          </div>

                          <div className="whitespace-pre-wrap text-sm leading-6">
                            {msg.text}
                          </div>

                          <div
                            className={`text-[11px] mt-1 ${
                              mine ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleString("ru-RU")
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!isAdmin && (
                <div className="border-t p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={2}
                      placeholder="Введите сообщение..."
                      className="flex-1 rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />

                    <button
                      type="button"
                      onClick={send}
                      disabled={sending || !text.trim()}
                      className="inline-flex justify-center items-center gap-2 rounded-2xl bg-blue-600 text-white px-5 py-3 hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Send size={18} />
                      {sending ? "..." : "Отправить"}
                    </button>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="border-t p-4 text-sm text-slate-500 bg-slate-50 rounded-b-3xl">
                  Администратор может просматривать диалог, но не отвечает от имени пользователей.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}