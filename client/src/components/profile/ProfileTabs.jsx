import React from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  Wallet,
  Shield,
  ClipboardCheck,
  Sparkles,
  FolderHeart,
  Bookmark,
} from "lucide-react";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
        active
          ? "bg-sun text-white border-sun shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function TabLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
    >
      {children}
    </Link>
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
  return (
    <div className="rounded-2xl border bg-white p-2">
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
        <TabButton active={tab === "my"} onClick={() => setTab("my")}>
          Мои
          <span className="rounded-full border px-2 py-0.5 text-xs bg-white/20 border-white/30">
            {myCount}
          </span>
        </TabButton>

        <TabButton active={tab === "fav"} onClick={() => setTab("fav")}>
          <FolderHeart size={16} />
          Избранное
          <span className="rounded-full border px-2 py-0.5 text-xs">{favCount}</span>
        </TabButton>

        <TabButton active={tab === "searches"} onClick={() => setTab("searches")}>
          <Bookmark size={16} />
          Поиски
        </TabButton>

        <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")}>
          <Wallet size={16} />
          Кошелёк
        </TabButton>

        <TabButton active={tab === "promote"} onClick={() => setTab("promote")}>
          <Sparkles size={16} />
          Продвижение
        </TabButton>

        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          <UserIcon size={16} />
          Профиль
        </TabButton>

        {canOpenModeration && (
          <TabButton active={tab === "moderation"} onClick={() => setTab("moderation")}>
            <ClipboardCheck size={16} />
            Модерация
          </TabButton>
        )}

        {canOpenAdmin && (
          <TabLink to={canAccessAccountant(role) ? "/admin?section=finance" : "/admin"}>
            {canAccessAccountant(role) ? <Wallet size={16} /> : <Shield size={16} />}
            {canAccessAccountant(role) ? "Финансы" : "Админка"}
          </TabLink>
        )}
      </div>
    </div>
  );
}
