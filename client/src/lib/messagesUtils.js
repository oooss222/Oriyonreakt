import { formatDayLabel } from "../i18n/helpers";
import { resolveMediaUrl } from "./media";
import { isBusinessSupportThread } from "./openBusinessSupportChat";

export const getMessageId = (item) => item?.id || item?._id;

export function getPeerId(item, me) {
  const myId = me?.id || me?._id;

  if (!item || !myId) return null;

  return String(item.senderId) === String(myId)
    ? item.receiverId
    : item.senderId;
}

export function getListingOwnerId(item) {
  return item?.listingOwner || item?.sellerId || null;
}

export function getThreadRole(item, me) {
  if (isBusinessSupportThread(item)) return "support";

  const myId = me?.id || me?._id;
  const ownerId = getListingOwnerId(item);

  if (!myId || !ownerId) return "unknown";

  return String(myId) === String(ownerId) ? "selling" : "buying";
}

export function getPeerName(item, me, t) {
  if (isBusinessSupportThread(item)) {
    return t("chat.supportOriyon");
  }

  const peerId = getPeerId(item, me);
  const myId = me?.id || me?._id;

  if (String(item?.senderId) === String(myId)) {
    return item?.receiverName || item?.receiverEmail || t("chat.user");
  }

  return item?.senderName || item?.senderEmail || t("chat.user");
}

export function getPeerInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function avatarColorFromName(name) {
  const palette = [
    "from-sun to-sun-600",
    "from-lagoon to-lagoon-700",
    "from-sun-500 to-amber-600",
    "from-lagoon-500 to-slate-700",
    "from-ink-600 to-ink",
    "from-sun-600 to-rose-600",
  ];

  let hash = 0;

  for (const char of String(name || "?")) {
    hash = (hash + char.charCodeAt(0)) % palette.length;
  }

  return palette[hash];
}

export function listingImageUrl(src) {
  return resolveMediaUrl(src, { placeholder: "" });
}

export function formatMessageTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatInboxTime(value, t) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return formatMessageTime(value);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return t("date.yesterday");
  }

  const diffDays = Math.floor((now - date) / 86400000);

  if (diffDays < 7) {
    return date.toLocaleDateString("ru-RU", { weekday: "short" });
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

export function formatLastSeen(lastSeen, t) {
  if (!lastSeen) return t("chat.offline");

  const time = new Date(lastSeen).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return t("chat.lastSeen", { time });
}

export function groupMessagesByDay(messages, t, { previouslyUnreadIds = [] } = {}) {
  const groups = [];
  let currentDay = null;
  let unreadSeparatorShown = false;
  const unreadSet = new Set(previouslyUnreadIds.map(String));

  for (const msg of messages) {
    const day = formatDayLabel(msg.createdAt, t);

    if (day !== currentDay) {
      groups.push({ type: "day", id: `day-${day}-${msg.createdAt}`, label: day });
      currentDay = day;
    }

    if (
      !unreadSeparatorShown &&
      unreadSet.has(String(getMessageId(msg)))
    ) {
      groups.push({ type: "new", id: "new-messages-separator" });
      unreadSeparatorShown = true;
    }

    groups.push({ type: "message", id: getMessageId(msg), data: msg });
  }

  return groups;
}

export function getMessagePreview(message, t) {
  const text = String(message?.text || "").trim();

  if (text) return text;
  if (message?.attachmentUrl) return t("chat.imageMessage");

  return "";
}

export function listingStatusLabel(status, t) {
  const key = String(status || "").toLowerCase();

  if (key === "approved") return t("chat.listingActive");
  if (key === "pending") return t("chat.listingPending");
  if (key === "sold") return t("chat.listingSold");
  if (key === "archived") return t("chat.listingArchived");
  if (key === "rejected") return t("chat.listingRejected");

  return t("chat.listingActive");
}

export function listingStatusClass(status) {
  const key = String(status || "").toLowerCase();

  if (key === "approved") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (key === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  if (key === "sold") {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  return "bg-mist text-ink-500 border-ink/10";
}

export function roleBadgeMeta(role, t) {
  if (role === "support") {
    return {
      label: t("chat.roleSupport"),
      className: "bg-lagoon/10 text-lagoon-700",
    };
  }

  if (role === "selling") {
    return {
      label: t("chat.roleSelling"),
      className: "bg-sun/10 text-sun-700",
    };
  }

  if (role === "buying") {
    return {
      label: t("chat.roleBuying"),
      className: "bg-mist-100 text-ink-600",
    };
  }

  return null;
}
