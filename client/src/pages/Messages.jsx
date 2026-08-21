import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, X } from "lucide-react";
import { api } from "../lib/api";
import { connectChatSocket, getChatSocket } from "../lib/chatSocket";
import {
  getUnreadTotal,
  publishUnreadCount,
  requestUnreadRefresh,
} from "../lib/unread";
import { isBusinessSupportThread } from "../lib/openBusinessSupportChat";
import { useI18n } from "../i18n";
import { getQuickReplies } from "../i18n/helpers";
import { getUserFacingErrorMessage } from "../lib/apiError";
import {
  getMessageId,
  getPeerId,
  getPeerName,
  groupMessagesByDay,
} from "../lib/messagesUtils";
import ChatInboxPanel from "../components/messages/ChatInboxPanel";
import ChatThreadPanel from "../components/messages/ChatThreadPanel";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function Toast({ message, type = "info", onClose, closeLabel }) {
  React.useEffect(() => {
    if (!message) return undefined;

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
          aria-label={closeLabel}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Messages() {
  const nav = useNavigate();
  const { t } = useI18n();
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
  const deepDraft = searchParams.get("draft");
  const deepPeerName = searchParams.get("peerName");
  const deepSupport = searchParams.get("support") === "1";

  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [thread, setThread] = React.useState([]);
  const [previouslyUnreadIds, setPreviouslyUnreadIds] = React.useState([]);
  const [text, setText] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [mobileView, setMobileView] = React.useState("list");
  const [typingPeer, setTypingPeer] = React.useState(false);
  const [toast, setToast] = React.useState({ message: "", type: "info" });
  const [socketReady, setSocketReady] = React.useState(false);
  const [socketError, setSocketError] = React.useState("");
  const [peerPresence, setPeerPresence] = React.useState({});
  const [listing, setListing] = React.useState(null);
  const [phoneVisible, setPhoneVisible] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);

  const chatEndRef = React.useRef(null);
  const deepHandledRef = React.useRef(false);
  const typingEmitRef = React.useRef(null);
  const markThreadAsReadRef = React.useRef(null);

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
            lastSeen,
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
        const data = await api.messageInbox(token);
        const next = Array.isArray(data) ? data : [];

        setItems(next);
        publishUnreadCount(getUnreadTotal(next));

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
        publishUnreadCount(0);
      } finally {
        setLoading(false);
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
        const next = Array.isArray(data)
          ? data
          : Array.isArray(data?.messages)
          ? data.messages
          : [];
        const unreadBeforeRead = Array.isArray(data?.previouslyUnreadIds)
          ? data.previouslyUnreadIds
          : [];

        setThread(next);
        setPreviouslyUnreadIds(unreadBeforeRead);
      } catch (e) {
        if (!silent) {
          setThread([]);
          setPreviouslyUnreadIds([]);
          showToast(getUserFacingErrorMessage(e, t) || t("chat.loadFailed"), "error");
        }
      } finally {
        setThreadLoading(false);
      }
    },
    [token, me, showToast, t]
  );

  const loadListingContext = React.useCallback(async (item) => {
    if (!item?.listingId || isBusinessSupportThread(item)) {
      setListing(null);
      return;
    }

    try {
      const data = await api.listingById(item.listingId);
      setListing(data || null);
    } catch {
      setListing(null);
    }
  }, []);

  const openThread = React.useCallback(
    async (item) => {
      setSelected(item);
      setMobileView("chat");
      setTypingPeer(false);
      setPhoneVisible(false);
      setListing(null);
      await Promise.all([loadThread(item), loadListingContext(item)]);
    },
    [loadThread, loadListingContext]
  );

  const markThreadAsRead = React.useCallback(
    async (listingId, peerId) => {
      if (!token || isAdmin || !listingId || !peerId) return;

      try {
        await api.markMessagesRead(token, listingId, peerId);

        setItems((prev) => {
          const next = prev.map((item) => {
            const itemPeerId = getPeerId(item, me);

            if (
              String(item.listingId) === String(listingId) &&
              String(itemPeerId) === String(peerId)
            ) {
              return { ...item, unreadCount: 0 };
            }

            return item;
          });

          publishUnreadCount(getUnreadTotal(next));
          return next;
        });
      } catch {
        /* ignore */
      }
    },
    [token, isAdmin, me]
  );

  React.useEffect(() => {
    markThreadAsReadRef.current = markThreadAsRead;
  }, [markThreadAsRead]);

  React.useEffect(() => {
    if (!selected || threadLoading || isAdmin) return;

    const peerId = getPeerId(selected, me);
    if (!peerId) return;

    markThreadAsRead(selected.listingId, peerId);
  }, [selected, thread.length, threadLoading, me, isAdmin, markThreadAsRead]);

  React.useEffect(() => {
    if (!token) {
      nav("/auth");
      return undefined;
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
    publishUnreadCount(0);

    return () => {
      requestUnreadRefresh();
    };
  }, []);

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
      setSocketError(err?.message || t("errors.socket"));
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
          unreadCount: String(message.receiverId) === String(myId) ? 1 : 0,
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
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
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
            (item) => String(getMessageId(item)) === String(getMessageId(message))
          );

          return exists ? arr : [...arr, message];
        });

        if (String(message.receiverId) === String(myId)) {
          markThreadAsReadRef.current?.(current.listingId, peerId);
        }

        return current;
      });

      if (String(message.receiverId) === String(myId)) {
        showToast(t("chat.newMessage"), "info");
      }
    };

    const onMessagesRead = ({ listingId, readerId, messageIds }) => {
      setThread((arr) =>
        arr.map((msg) => {
          if (String(msg.listingId) !== String(listingId)) return msg;
          if (String(msg.senderId) !== String(myId)) return msg;
          if (String(readerId) === String(myId)) return msg;

          if (Array.isArray(messageIds) && messageIds.length > 0) {
            return messageIds.includes(String(getMessageId(msg)))
              ? { ...msg, isRead: true }
              : msg;
          }

          return { ...msg, isRead: true };
        })
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
  }, [token, myId, me, showToast, applyPresenceUpdate, t]);

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
        listingTitle: deepTitle || t("chat.listing"),
        senderId: myId,
        receiverId: deepPeerId,
        receiverName: deepPeerName || "",
        isBusinessSupport: deepSupport,
      };

    openThread(target);

    if (deepDraft) {
      setText(deepDraft);
    }

    setSearchParams({}, { replace: true });
  }, [
    token,
    deepListingId,
    deepPeerId,
    deepTitle,
    deepDraft,
    deepPeerName,
    deepSupport,
    loading,
    items,
    me,
    myId,
    openThread,
    setSearchParams,
    t,
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

      socket.emit(active ? "typing:start" : "typing:stop", payload);
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
          (item) => String(getMessageId(item)) === String(getMessageId(msg))
        );

        return exists ? arr : [...arr, msg];
      });

      if (!presetText) {
        setText("");
      }

      await loadInbox({ silent: true });
    } catch (e) {
      showToast(getUserFacingErrorMessage(e, t) || t("chat.loadFailed"), "error");
    } finally {
      setSending(false);
    }
  };

  const markAllRead = async () => {
    if (!token || isAdmin) return;

    const unreadItems = items.filter((item) => Number(item.unreadCount || 0) > 0);
    if (!unreadItems.length) return;

    try {
      setMarkingAll(true);

      await Promise.all(
        unreadItems.map((item) => {
          const peerId = getPeerId(item, me);
          if (!peerId) return Promise.resolve();
          return api.markMessagesRead(token, item.listingId, peerId);
        })
      );

      await loadInbox({ silent: true });
      showToast(t("chat.allMarkedRead"), "success");
    } catch {
      showToast(t("chat.loadFailed"), "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleThreadAction = async (action) => {
    if (action === "report" && selected?.listingId && token) {
      try {
        await api.reportListing(token, selected.listingId, {
          reason: "other",
          details: t("chat.actionReport"),
        });
        showToast(t("report.sent"), "success");
      } catch (e) {
        showToast(getUserFacingErrorMessage(e, t) || t("chat.actionSoon"), "error");
      }
      return;
    }

    showToast(t("chat.actionSoon"), "info");
  };

  const revealPhone = () => {
    const phone = listing?.phone || listing?.sellerPhone;

    if (!phone) {
      showToast(t("chat.phoneUnavailable"), "error");
      return;
    }

    setPhoneVisible(true);
  };

  const groupedThread = React.useMemo(
    () => groupMessagesByDay(thread, t, { previouslyUnreadIds }),
    [thread, t, previouslyUnreadIds]
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

  const peerOnline = socketReady && peerPresenceInfo?.online === true;
  const supportThread = isBusinessSupportThread(selected);

  const peerName = supportThread
    ? selected?.receiverName || selected?.senderName || deepPeerName || t("chat.admin")
    : getPeerName(selected, me, t);

  const quickReplies = supportThread
    ? getQuickReplies(t, true)
    : getQuickReplies(t);

  const phoneNumber = listing?.phone || listing?.sellerPhone || "";

  if (loading) {
    return (
      <div className="page-shell min-h-screen px-4 py-6">
        <div className="max-w-[1800px] mx-auto messages-workspace p-6 animate-pulse space-y-3">
          <div className="h-8 bg-mist-200 rounded-xl w-48" />
          <div className="h-[70vh] bg-mist-200 rounded-2xl" />
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
        closeLabel={t("common.close")}
      />

      <div className="max-w-[1800px] mx-auto px-2 md:px-5 py-4">
        {isAdmin ? (
          <div className="mb-3 inline-flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">
            <Shield size={14} />
            {t("chat.adminSeeAll")}
          </div>
        ) : null}

        {socketError ? (
          <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {t("chat.offlinePolling")}
          </div>
        ) : null}

        <div className="messages-workspace">
          <div className="messages-layout">
            <div
              className={`h-full min-h-0 ${
                mobileView === "chat" ? "hidden xl:block" : "block"
              }`}
            >
              <ChatInboxPanel
                t={t}
                items={items}
                selected={selected}
                me={me}
                query={query}
                onQueryChange={setQuery}
                filter={filter}
                onFilterChange={setFilter}
                onSelect={openThread}
                onMarkAllRead={markAllRead}
                onClearSearch={() => {
                  setQuery("");
                  setFilter("all");
                }}
                markingAll={markingAll}
              />
            </div>

            <div
              className={`h-full min-h-0 ${
                mobileView === "list" ? "hidden xl:block" : "block"
              }`}
            >
              <ChatThreadPanel
              t={t}
              selected={selected}
              me={me}
              thread={thread}
              groupedThread={groupedThread}
              threadLoading={threadLoading}
              typingPeer={typingPeer}
              peerOnline={peerOnline}
              selectedPeerLastSeen={selectedPeerLastSeen}
              peerName={peerName}
              supportThread={supportThread}
              listing={listing}
              phoneVisible={phoneVisible}
              onRevealPhone={revealPhone}
              phoneNumber={phoneNumber}
              text={text}
              onTextChange={handleTextChange}
              onSend={send}
              sending={sending}
              quickReplies={quickReplies}
              isAdmin={isAdmin}
              mobileView={mobileView}
              onBack={() => setMobileView("list")}
              onAction={handleThreadAction}
              chatEndRef={chatEndRef}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
