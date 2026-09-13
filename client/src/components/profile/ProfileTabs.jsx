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
import { useI18n } from "../../i18n";

function TabButton({ tabKey, active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      role="tab"
      id={`profile-tab-${tabKey}`}
      aria-selected={active}
      aria-controls={`profile-tabpanel-${tabKey}`}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 transition snap-start ${
        active
          ? "border-sun text-sun"
          : "border-transparent text-ink-500 hover:text-ink-800 hover:border-mist-200"
      }`}
    >
      {Icon && <Icon size={16} className={active ? "text-sun" : "text-ink-400"} />}
      {children}
    </button>
  );
}

function TabLink({ to, children, icon: Icon }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-2 px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-ink-500 hover:text-ink-800 hover:border-mist-200 transition snap-start"
    >
      {Icon && <Icon size={16} className="text-ink-400" />}
      {children}
    </Link>
  );
}

function CountBadge({ count, active }) {
  return (
    <span
      className={`min-w-[1.35rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold text-center tabular-nums ${
        active ? "bg-sun/15 text-sun" : "bg-mist-100 text-ink-600"
      }`}
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

  return (
    <div className="panel px-1 sm:px-2">
      <div
        role="tablist"
        className="flex gap-0.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory border-b border-ink/10"
      >
        <TabButton tabKey="my" active={tab === "my"} onClick={() => setTab("my")} icon={LayoutGrid}>
          {t("profile.myListings")}
          <CountBadge count={myCount} active={tab === "my"} />
        </TabButton>

        <TabButton tabKey="fav" active={tab === "fav"} onClick={() => setTab("fav")} icon={FolderHeart}>
          {t("profile.favorites")}
          <CountBadge count={favCount} active={tab === "fav"} />
        </TabButton>

        <TabButton tabKey="searches" active={tab === "searches"} onClick={() => setTab("searches")} icon={Bookmark}>
          {t("profile.searches")}
        </TabButton>

        <TabButton
          tabKey="analytics"
          active={tab === "analytics"}
          onClick={() => setTab("analytics")}
          icon={BarChart3}
        >
          {t("profile.analytics")}
        </TabButton>

        <TabButton tabKey="profile" active={tab === "profile"} onClick={() => setTab("profile")} icon={UserIcon}>
          {t("profile.profile")}
        </TabButton>

        {canOpenModeration && (
          <TabButton
            tabKey="moderation"
            active={tab === "moderation"}
            onClick={() => setTab("moderation")}
            icon={ClipboardCheck}
          >
            {t("profile.moderation")}
          </TabButton>
        )}

        {canOpenAdmin && (
          <TabLink
            to={canAccessAccountant(role) ? "/admin?section=finance" : "/admin"}
            icon={canAccessAccountant(role) ? Wallet : Shield}
          >
            {canAccessAccountant(role) ? t("profile.finance") : t("profile.admin")}
          </TabLink>
        )}
      </div>
    </div>
  );
}
