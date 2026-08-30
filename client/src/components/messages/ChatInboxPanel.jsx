import React from "react";
import { Archive, CheckCheck, Search } from "lucide-react";
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

  return (
    <aside className="messages-inbox flex h-full min-h-0 min-w-0 flex-col border-r border-ink/8 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-3">
        <div>
          <h2 className="font-display text-[1.35rem] font-bold tracking-tight text-ink">
            {t("chat.title")}
          </h2>
          {unreadTotal > 0 ? (
            <p className="mt-0.5 text-xs text-ink-400">
              {t("chat.filter.unread")} · {unreadTotal}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={markingAll || unreadTotal === 0}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink/8 bg-white text-ink-500 transition hover:border-sun/30 hover:bg-sun-50 hover:text-sun-700 disabled:opacity-35"
            title={t("chat.markAllRead")}
          >
            <CheckCheck size={18} />
          </button>
          <button
            type="button"
            onClick={onArchiveSelected}
            disabled={archiving || !selected}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink/8 bg-white text-ink-500 transition hover:border-ink/15 hover:bg-mist hover:text-ink disabled:opacity-35"
            title={t("chat.actionArchive")}
          >
            <Archive size={17} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("chat.searchPlaceholder")}
            className="input w-full h-11 pl-10 rounded-2xl bg-white/90 border-ink/8 shadow-soft focus:border-sun/40 focus:ring-sun/15"
          />
        </div>
      </div>

      <div className="px-4 pb-3 min-w-0">
        <div className="messages-inbox-filters">
          {FILTERS.map((key) => {
            const active = filter === key;
            const count = countByFilter(items, me, key);
            const label =
              key === "all" && count > 0
                ? `${t(`chat.filter.${key}`)} ${count}`
                : t(`chat.filter.${key}`);

            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilterChange(key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-sun text-white shadow-soft"
                    : "bg-white/80 text-ink-500 border border-ink/8 hover:border-sun/25 hover:text-sun-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mx-4 mb-4 rounded-2xl border border-dashed border-ink/10 bg-white/70 p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-mist text-ink-300">
            <Search size={20} />
          </div>
          <p className="text-sm font-medium text-ink-500">{t("chat.empty")}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2.5 pb-4">
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

            return (
              <button
                key={`${item.listingId}-${peerId}-${item.id || item.createdAt}`}
                type="button"
                onClick={() => onSelect(item)}
                className={`messages-inbox-item w-full text-left rounded-2xl px-3 py-3 mb-1 ${
                  active
                    ? "is-active bg-sun-50 border border-sun/20"
                    : "border border-transparent hover:bg-white/90 hover:border-ink/6"
                }`}
              >
                <div className="flex gap-3 items-start">
                  <ChatAvatar name={peerName} support={supportItem} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className={`truncate ${
                            unread
                              ? "font-bold text-ink"
                              : "font-semibold text-ink"
                          }`}
                        >
                          {peerName}
                        </div>
                        {badge ? (
                          <div
                            className={`inline-flex mt-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badge.className}`}
                          >
                            {badge.label}
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`text-[11px] tabular-nums ${
                            unread ? "font-semibold text-sun-600" : "text-ink-400"
                          }`}
                        >
                          {formatInboxTime(item.createdAt, t)}
                        </div>
                        {unread ? (
                          <div className="mt-1.5 ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-sun text-white text-[10px] font-bold inline-flex items-center justify-center shadow-soft">
                            {Number(item.unreadCount) > 99
                              ? "99+"
                              : item.unreadCount}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-1.5 text-xs font-medium text-ink-500 truncate">
                      {listingTitle}
                    </div>

                    <div
                      className={`mt-0.5 text-sm line-clamp-1 ${
                        unread ? "text-ink-600 font-medium" : "text-ink-400"
                      }`}
                    >
                      {getMessagePreview(item, t)}
                    </div>
                  </div>

                  {thumb && !supportItem ? (
                    <img
                      src={thumb}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-mist shrink-0 ring-1 ring-ink/5"
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
