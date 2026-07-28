import React from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Flag,
  Wallet,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { api } from "../lib/api";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";
import {
  canAccessAdmin,
  canAccessModeration,
} from "../lib/adminUtils";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminUsersSection from "../components/admin/AdminUsersSection";
import ModerationListingsPanel from "../components/admin/ModerationListingsPanel";
import ModerationReports from "../components/ModerationReports";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { id: "users", label: "Пользователи", icon: Users, adminOnly: true },
  { id: "moderation", label: "Модерация", icon: ClipboardCheck, adminOnly: false },
  { id: "reports", label: "Жалобы", icon: Flag, adminOnly: false },
  { id: "finance", label: "Финансы", icon: Wallet, superAdminOnly: true },
];

function AdminFinanceSection({ stats, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 animate-pulse h-40" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
          <Wallet className="w-4 h-4" />
          Финансы
        </div>
        <h2 className="text-xl font-bold">Кошельки системы</h2>
        <p className="text-sm text-slate-500 mt-1">
          Сводная информация по балансам. Корректировка — в карточке пользователя.
        </p>
      </div>

      <div className="rounded-2xl border bg-gradient-to-br from-ink-700 to-ink-900 p-6 text-white">
        <div className="text-sm text-white/70">Суммарный баланс</div>
        <div className="text-3xl font-bold mt-2">
          {Number(stats?.wallet?.totalBalance || 0).toLocaleString("ru-RU")} TJS
        </div>
        <div className="text-sm text-white/70 mt-2">
          Пользователей на платформе: {stats?.users?.total || 0}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [token] = React.useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [me, setMe] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });

  const [stats, setStats] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [statsError, setStatsError] = React.useState("");

  const role = me?.role || "user";
  const isAdmin = canAccessAdmin(role);
  const isModerator = canAccessModeration(role);
  const isSuperAdmin = role === "super_admin";

  const sectionParam = searchParams.get("section") || "";
  const defaultSection = isAdmin ? "dashboard" : "moderation";
  const section = sectionParam || defaultSection;

  const visibleSections = SECTIONS.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const isSectionAllowed = visibleSections.some((item) => item.id === section);

  React.useEffect(() => {
    if (!token) {
      goToAuth(navigate, "/admin");
      return;
    }

    if (!isModerator) {
      navigate("/profile");
      return;
    }

    if (!isSectionAllowed) {
      setSearchParams({ section: defaultSection }, { replace: true });
    }
  }, [
    token,
    isModerator,
    isSectionAllowed,
    defaultSection,
    navigate,
    setSearchParams,
  ]);

  React.useEffect(() => {
    if (!token || !isAdmin) return;

    let alive = true;

    setStatsLoading(true);
    setStatsError("");

    api
      .adminStats(token)
      .then((data) => {
        if (alive) setStats(data);
      })
      .catch((e) => {
        if (alive) setStatsError(e.message || "Не удалось загрузить статистику");
      })
      .finally(() => {
        if (alive) setStatsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, isAdmin]);

  React.useEffect(() => {
    if (!token) return;

    api
      .me(token)
      .then((user) => {
        setMe(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      })
      .catch(() => {});
  }, [token]);

  if (!token || !isModerator) {
    return null;
  }

  const setSection = (id) => {
    setSearchParams({ section: id });
  };

  return (
    <div className="page-container py-6 md:py-8">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} />
            Назад в профиль
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink flex items-center gap-2">
            <Shield className="text-sun" />
            Админ-панель
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin
              ? "Полный доступ: пользователи, модерация, финансы."
              : isAdmin
                ? "Управление пользователями и модерация."
                : "Модерация объявлений и жалоб."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        <aside className="rounded-2xl border bg-white p-3 h-fit lg:sticky lg:top-24">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {visibleSections.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main>
          {section === "dashboard" && isAdmin && (
            <div className="rounded-2xl border bg-white p-4 md:p-5">
              <AdminDashboard
                stats={stats}
                loading={statsLoading}
                error={statsError}
              />
            </div>
          )}

          {section === "users" && isAdmin && (
            <AdminUsersSection token={token} currentUser={me} />
          )}

          {section === "moderation" && (
            <ModerationListingsPanel token={token} embedded />
          )}

          {section === "reports" && <ModerationReports token={token} />}

          {section === "finance" && isSuperAdmin && (
            <AdminFinanceSection
              stats={stats}
              loading={statsLoading}
              error={statsError}
            />
          )}

          {!isSectionAllowed && <Navigate to={`/admin?section=${defaultSection}`} replace />}
        </main>
      </div>
    </div>
  );
}
