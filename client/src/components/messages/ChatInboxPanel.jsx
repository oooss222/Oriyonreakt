import React from "react";
import { Archive, CheckCheck, MessageCircle, Search } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import {
  getPeerId,
  getPeerName,
  getThreadRole,
  formatInboxTime,
  listingImageUrl,
  roleBadgeMeta,
  getMessagePreview,
} from "../../lib/messagesUtils";
import { isBusinessSupportThread } from "../../lib/openBusinessSupportChat";

const FILTERS = ["all", "unread", "buying", "selling", "archived"];

function countByFilter(items, me, filter) {
  if (filter === "archived") {
    return items.length;
  }

  if (filter === "unread") {
    return items.filter((item) => Number(item.unreadCount || 0) > 0).length;
  }

  if (filter === "buying") {
    return items.filter((item) => getThreadRole(item, me) === "buying").length;
  }

  if (filter === "selling") {
    return items.filter((item) => getThreadRole(item, me) === "selling").length;
  }

  return items.length;
}

export default function ChatInboxPanel({
  t,
  items,
  selected,
  me,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onSelect,
  onMarkAllRead,
  onArchiveSelected,
  markingAll,
  archiving,
}) {
  const filteredItems = React.useMemo(() => {
    let next = items;

    if (filter !== "archived") {
      if (filter === "unread") {
        next = next.filter((item) => Number(item.unreadCount || 0) > 0);
      } else if (filter === "buying") {
        next = next.filter((item) => getThreadRole(item, me) === "buying");
      } else if (filter === "selling") {
        next = next.filter((item) => getThreadRole(item, me) === "selling");
      }
    }

    const value = query.trim().toLowerCase();

    if (!value) return next;

    return next.filter((item) => {
      const peerName = getPeerName(item, me, t).toLowerCase();

      return (
        String(item.listingTitle || "").toLowerCase().includes(value) ||
        peerName.includes(value) ||
        String(item.text || "").toLowerCase().includes(value)
      );
    });
  }, [items, filter, query, me, t]);

  const unreadTotal = countByFilter(items, me, "unread");
  const myId = me?.id || me?._id;

  return (
    <aside className="messages-inbox flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-[1.4rem] font-bold tracking-tight text-ink">
              {t("chat.title")}
            </h1>
            {unreadTotal > 0 ? (
              <p className="mt-0.5 text-xs font-medium text-sun-600">
                {unreadTotal} · {t("chat.filter.unread").toLowerCase()}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={markingAll || unreadTotal === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-mist hover:text-ink disabled:opacity-30"
              title={t("chat.markAllRead")}
            >
              <CheckCheck size={18} />
            </button>
            <button
              type="button"
              onClick={onArchiveSelected}
              disabled={archiving || !selected}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-mist hover:text-ink disabled:opacity-30"
              title={t("chat.actionArchive")}
            >
              <Archive size={16} />
            </button>
          </div>
        </div>

        <div className="relative mt-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("chat.searchPlaceholder")}
            className="input h-10 w-full rounded-full border-ink/8 bg-mist/80 pl-10 text-sm shadow-none focus:border-sun/35 focus:bg-white focus:ring-sun/10"
          />
        </div>
      </div>

      <div className="messages-inbox-filters shrink-0 px-4 pb-2">
        {FILTERS.map((key) => {
          const active = filter === key;
          const count = countByFilter(items, me, key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={`messages-filter-chip ${active ? "is-active" : ""}`}
            >
              {t(`chat.filter.${key}`)}
              {count > 0 && (key === "unread" || (active && key === "all")) ? (
                <span className="messages-filter-count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-mist text-ink-300">
            <MessageCircle size={24} />
          </div>
          <p className="text-sm font-semibold text-ink">
            {query ? t("chat.empty") : t("chat.emptyInbox")}
          </p>
          {!query ? (
            <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-400">
              {t("chat.emptyInboxHint")}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {filteredItems.map((item) => {
            const peerId = getPeerId(item, me);
            const supportItem = isBusinessSupportThread(item);
            const role = getThreadRole(item, me);
            const badge = roleBadgeMeta(role, t);
            const peerName = getPeerName(item, me, t);
            const active =
              String(selected?.listingId) === String(item.listingId) &&
              String(getPeerId(selected, me)) === String(peerId);
            const thumb = listingImageUrl(item.listingImage);
            const listingTitle = supportItem
              ? t("chat.supportOriyon")
              : item.listingTitle || t("chat.listing");
            const unread = Number(item.unreadCount || 0) > 0;
            const preview = getMessagePreview(item, t);
            const mineLast = String(item.senderId) === String(myId);

            return (
              <button
                key={`${item.listingId}-${peerId}-${item.id || item.createdAt}`}
                type="button"
                onClick={() => onSelect(item)}
                className={`messages-inbox-item ${active ? "is-active" : ""} ${
                  unread ? "is-unread" : ""
                }`}
              >
                <ChatAvatar name={peerName} support={supportItem} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-[15px] ${
                        unread ? "font-bold text-ink" : "font-semibold text-ink"
                      }`}
                    >
                      {peerName}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] tabular-nums ${
                        unread ? "font-semibold text-sun-600" : "text-ink-400"
                      }`}
                    >
                      {formatInboxTime(item.createdAt, t)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2">
                    <p
                      className={`min-w-0 flex-1 truncate text-[13px] ${
                        unread ? "font-medium text-ink-600" : "text-ink-400"
                      }`}
                    >
                      {mineLast && preview ? `${t("chat.you")}: ${preview}` : preview}
                    </p>
                    {unread ? (
                      <span className="messages-unread-badge">
                        {Number(item.unreadCount) > 99 ? "99+" : item.unreadCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex min-w-0 items-center gap-1.5">
                    {badge ? (
                      <span className={`messages-role-badge ${badge.className}`}>
                        {badge.label}
                      </span>
                    ) : null}
                    <span className="truncate text-[11px] text-ink-400">
                      {listingTitle}
                    </span>
                  </div>
                </div>

                {thumb && !supportItem ? (
                  <img
                    src={thumb}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-xl object-cover bg-mist ring-1 ring-ink/5"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
