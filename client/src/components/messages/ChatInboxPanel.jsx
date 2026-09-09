import React from "react";
import { CheckCheck, MessageCircle, Search, SearchX } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import {
  Badge,
  Chip,
  EmptyState,
  IconButton,
  Input,
  Skeleton,
  cn,
} from "../../ui";
import {
  getPeerId,
  getPeerName,
  getThreadRole,
  formatInboxTime,
  getMessagePreview,
} from "../../lib/messagesUtils";
import { isBusinessSupportThread } from "../../lib/openBusinessSupportChat";

const FILTERS = ["all", "unread", "buying", "selling", "archived"];

const ROLE_BADGES = {
  selling: { tone: "sun", key: "chat.roleSelling" },
  buying: { tone: "neutral", key: "chat.roleBuying" },
  support: { tone: "info", key: "chat.roleSupport" },
};

function countByFilter(items, me, filter) {
  if (filter === "unread") {
    return items.filter((item) => Number(item.unreadCount || 0) > 0).length;
  }

  if (filter === "buying" || filter === "selling") {
    return items.filter((item) => getThreadRole(item, me) === filter).length;
  }

  return items.length;
}

function InboxSkeleton() {
  return (
    <ul className="space-y-1">
      {Array.from({ length: 7 }).map((_, index) => (
        <li key={index} className="flex items-start gap-2.5 p-2.5">
          <Skeleton className="h-11 w-11 shrink-0" rounded="rounded-xl" />
          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function UnreadBadge({ count, t }) {
  return (
    <span className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-sun-500 px-1.5 text-2xs font-bold text-white">
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{t("chat.unreadCount", { count })}</span>
    </span>
  );
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
  markingAll,
  loading,
  className = "",
}) {
  const filteredItems = React.useMemo(() => {
    let next = items;

    if (filter === "unread") {
      next = next.filter((item) => Number(item.unreadCount || 0) > 0);
    } else if (filter === "buying" || filter === "selling") {
      next = next.filter((item) => getThreadRole(item, me) === filter);
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
    <aside className={cn("chat-inbox", className)} aria-label={t("chat.dialogList")}>
      <div className="chat-inbox__head">
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 font-display text-xl font-bold tracking-tight text-ink-900">
            {t("chat.title")}
          </h1>

          <IconButton
            icon={CheckCheck}
            label={t("chat.markAllRead")}
            onClick={onMarkAllRead}
            disabled={markingAll || unreadTotal === 0}
          />
        </div>

        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("chat.searchPlaceholder")}
          aria-label={t("chat.searchPlaceholder")}
          iconLeft={Search}
        />

        <div className="chat-inbox__filters">
          {FILTERS.map((key) => {
            const count = key === "archived" ? 0 : countByFilter(items, me, key);

            return (
              <Chip
                key={key}
                active={filter === key}
                onClick={() => onFilterChange(key)}
                count={count > 0 ? count : undefined}
              >
                {t(`chat.filter.${key}`)}
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="chat-inbox__list">
        {loading ? (
          <InboxSkeleton />
        ) : items.length === 0 && filter === "all" && !query.trim() ? (
          <EmptyState
            bare
            icon={MessageCircle}
            title={t("chat.empty")}
            description={t("chat.emptyHint")}
            actionLabel={t("chat.emptyAction")}
            actionTo="/"
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            bare
            icon={SearchX}
            title={t("chat.noResultsTitle")}
            description={t("chat.noResultsHint")}
            actionLabel={t("chat.filter.all")}
            actionVariant="secondary"
            onAction={() => {
              onQueryChange("");
              onFilterChange("all");
            }}
          />
        ) : (
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const peerId = getPeerId(item, me);
              const supportItem = isBusinessSupportThread(item);
              const role = getThreadRole(item, me);
              const peerName = getPeerName(item, me, t);
              const unreadCount = Number(item.unreadCount || 0);
              const active =
                String(selected?.listingId) === String(item.listingId) &&
                String(getPeerId(selected, me)) === String(peerId);
              const listingTitle = supportItem
                ? t("chat.supportOriyon")
                : item.listingTitle || t("chat.listing");
              const roleBadge = ROLE_BADGES[role];

              return (
                <li key={`${item.listingId}-${peerId}-${item.id || item.createdAt}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "chat-row",
                      active && "chat-row--active",
                      unreadCount > 0 && "chat-row--unread"
                    )}
                  >
                    <ChatAvatar name={peerName} support={supportItem} />

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            unreadCount > 0
                              ? "font-bold text-ink-900"
                              : "font-semibold text-ink-800"
                          )}
                        >
                          {peerName}
                        </span>
                        <span className="shrink-0 text-2xs tabular-nums text-ink-400">
                          {formatInboxTime(item.createdAt, t)}
                        </span>
                      </span>

                      <span className="mt-0.5 flex items-center gap-1.5">
                        {roleBadge ? (
                          <Badge tone={roleBadge.tone} className="shrink-0 py-0">
                            {t(roleBadge.key)}
                          </Badge>
                        ) : null}
                        <span className="min-w-0 truncate text-xs text-ink-400">
                          {listingTitle}
                        </span>
                      </span>

                      <span className="mt-1 flex items-center gap-2">
                        <span className="chat-row__preview min-w-0 flex-1">
                          {getMessagePreview(item, t)}
                        </span>
                        {unreadCount > 0 ? (
                          <UnreadBadge count={unreadCount} t={t} />
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
