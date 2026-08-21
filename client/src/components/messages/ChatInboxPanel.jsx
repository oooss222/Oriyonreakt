import React from "react";
import { CheckCheck, Search, Trash2 } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import {
  getPeerId,
  getPeerName,
  getThreadRole,
  formatInboxTime,
  listingImageUrl,
  roleBadgeMeta,
} from "../../lib/messagesUtils";
import { isBusinessSupportThread } from "../../lib/openBusinessSupportChat";

const FILTERS = ["all", "unread", "buying", "selling"];

function countByFilter(items, me, filter) {
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
  onClearSearch,
  markingAll,
}) {
  const filteredItems = React.useMemo(() => {
    let next = items;

    if (filter === "unread") {
      next = next.filter((item) => Number(item.unreadCount || 0) > 0);
    } else if (filter === "buying") {
      next = next.filter((item) => getThreadRole(item, me) === "buying");
    } else if (filter === "selling") {
      next = next.filter((item) => getThreadRole(item, me) === "selling");
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
    <aside className="messages-inbox flex h-full min-h-0 flex-col border-r border-ink/10 bg-white">
      <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-ink/10">
        <h2 className="font-display text-xl font-bold text-ink">{t("chat.title")}</h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={markingAll || unreadTotal === 0}
            className="btn p-2.5 disabled:opacity-40"
            title={t("chat.markAllRead")}
          >
            <CheckCheck size={18} />
          </button>
          <button
            type="button"
            onClick={onClearSearch}
            className="btn p-2.5"
            title={t("chat.clearSearch")}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("chat.searchPlaceholder")}
            className="input w-full h-11 pl-10 bg-mist/70 border-ink/10"
          />
        </div>
      </div>

      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
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
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-ink text-white shadow-soft"
                  : "bg-mist text-ink-500 hover:bg-mist-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="mx-4 mb-4 rounded-2xl bg-mist p-6 text-center text-sm text-ink-400">
          {t("chat.empty")}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
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

            return (
              <button
                key={`${item.listingId}-${peerId}-${item.id || item.createdAt}`}
                type="button"
                onClick={() => onSelect(item)}
                className={`messages-inbox-item w-full text-left rounded-2xl px-3 py-3 mb-1 transition ${
                  active
                    ? "is-active bg-orange-50/80 border border-orange-100"
                    : "border border-transparent hover:bg-mist/80"
                }`}
              >
                <div className="flex gap-3 items-start">
                  <ChatAvatar name={peerName} support={supportItem} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
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
                        <div className="text-xs text-ink-400">
                          {formatInboxTime(item.createdAt, t)}
                        </div>
                        {Number(item.unreadCount || 0) > 0 ? (
                          <div className="mt-1 ml-auto min-w-[20px] h-5 px-1 rounded-full bg-sun text-white text-[11px] font-bold inline-flex items-center justify-center">
                            {Number(item.unreadCount) > 99
                              ? "99+"
                              : item.unreadCount}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-1 text-xs font-medium text-ink-500 truncate">
                      {listingTitle}
                    </div>

                    <div className="mt-1 text-sm text-ink-400 line-clamp-1">
                      {item.text}
                    </div>
                  </div>

                  {thumb && !supportItem ? (
                    <img
                      src={thumb}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover bg-mist shrink-0"
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
