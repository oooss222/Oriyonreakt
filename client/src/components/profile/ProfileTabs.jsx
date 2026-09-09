import React from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  Wallet,
  Shield,
  ClipboardCheck,
  FolderHeart,
  Bookmark,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import { cn } from "../../ui";
import { useI18n } from "../../i18n";

const TAB_CLASS =
  "inline-flex min-h-[2.75rem] shrink-0 snap-start items-center gap-2 border-b-2 px-3 py-2 " +
  "text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-sun/50 focus-visible:ring-offset-1";

function CountBadge({ count, active }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-2xs font-bold tabular-nums",
        active ? "bg-sun-100 text-sun-800" : "bg-mist-200 text-ink-500"
      )}
    >
      {count}
    </span>
  );
}

export default function ProfileTabs({
  tab,
  setTab,
  myCount,
  favCount,
  canOpenAdmin,
  canOpenModeration,
  canAccessAccountant,
  role,
}) {
  const { t } = useI18n();
  const listRef = React.useRef(null);

  const items = [
    { value: "my", label: t("profile.myListings"), icon: LayoutGrid, count: myCount },
    { value: "fav", label: t("profile.favorites"), icon: FolderHeart, count: favCount },
    { value: "searches", label: t("profile.searches"), icon: Bookmark },
    { value: "analytics", label: t("profile.analytics"), icon: BarChart3 },
    { value: "profile", label: t("profile.profile"), icon: UserIcon },
  ];

  if (canOpenModeration) {
    items.push({
      value: "moderation",
      label: t("profile.moderation"),
      icon: ClipboardCheck,
    });
  }

  if (canOpenAdmin) {
    const accountant = canAccessAccountant(role);
    items.push({
      value: "admin",
      label: accountant ? t("profile.finance") : t("profile.admin"),
      icon: accountant ? Wallet : Shield,
      to: accountant ? "/admin?section=finance" : "/admin",
    });
  }

  // The wallet and promotion panels are opened from the profile header and have
  // no tab of their own, so the strip keeps one reachable stop regardless.
  const selectedIndex = items.findIndex((item) => item.value === tab);
  const stopIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const onKeyDown = (event) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;

    const tabs = Array.from(listRef.current?.querySelectorAll("[role='tab']") || []);
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;

    event.preventDefault();

    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;

    tabs[next]?.focus();
  };

  return (
    <div className="card overflow-hidden">
      <div
        ref={listRef}
        role="tablist"
        aria-label={t("profile.tabsLabel")}
        onKeyDown={onKeyDown}
        className="flex gap-1 snap-x overflow-x-auto px-3 scroll-px-3 scrollbar-none"
      >
        {items.map((item, index) => {
          const active = item.value === tab;
          const Icon = item.icon;

          const content = (
            <>
              <Icon
                size={16}
                strokeWidth={2.1}
                aria-hidden="true"
                className={active ? "text-sun-600" : "text-ink-400"}
              />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.count != null && <CountBadge count={item.count} active={active} />}
            </>
          );

          const classes = cn(
            TAB_CLASS,
            active
              ? "border-sun-500 text-ink-900"
              : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-900"
          );

          if (item.to) {
            return (
              <Link
                key={item.value}
                to={item.to}
                role="tab"
                aria-selected={false}
                tabIndex={index === stopIndex ? 0 : -1}
                className={classes}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={index === stopIndex ? 0 : -1}
              onClick={() => setTab(item.value)}
              className={classes}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
