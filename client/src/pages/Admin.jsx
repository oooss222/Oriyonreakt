import React from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  Flag,
  Wallet,
  Shield,
  ArrowLeft,
  ScrollText,
  BarChart3,
  Settings,
  Download,
} from "lucide-react";
import { api } from "../lib/api";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";
import {
  canAccessAdmin,
  canAccessAdminPanel,
  canAccessAdminSection,
  canAccessAccountant,
  defaultAdminSection,
} from "../lib/adminUtils";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminUsersSection from "../components/admin/AdminUsersSection";
import AdminListingsSection from "../components/admin/AdminListingsSection";
import AdminAuditSection from "../components/admin/AdminAuditSection";
import AdminAnalyticsSection from "../components/admin/AdminAnalyticsSection";
import AdminSettingsSection from "../components/admin/AdminSettingsSection";
import AdminExportSection from "../components/admin/AdminExportSection";
import AdminFinancePanel from "../components/admin/AdminFinancePanel";
import ModerationListingsPanel from "../components/admin/ModerationListingsPanel";
import ModerationReports from "../components/ModerationReports";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "users", label: "Пользователи", icon: Users },
  { id: "listings", label: "Объявления", icon: FileText },
  { id: "moderation", label: "Модерация", icon: ClipboardCheck },
  { id: "reports", label: "Жалобы", icon: Flag },
  { id: "finance", label: "Финансы", icon: Wallet },
  { id: "settings", label: "Настройки", icon: Settings },
  { id: "export", label: "Экспорт", icon: Download },
  { id: "audit", label: "Журнал", icon: ScrollText },
];

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
  const isAccountant = canAccessAccountant(role);
  const isSuperAdmin = role === "super_admin";
  const canOpenPanel = canAccessAdminPanel(role);

  const sectionParam = searchParams.get("section") || "";
  const defaultSection = defaultAdminSection(role);
  const section = sectionParam || defaultSection;

  const visibleSections = SECTIONS.filter((item) =>
    canAccessAdminSection(role, item.id)
  );

  const isSectionAllowed = visibleSections.some((item) => item.id === section);

  React.useEffect(() => {
    if (!token) {
      goToAuth(navigate, "/admin");
      return;
    }

    if (!canOpenPanel) {
      navigate("/profile");
      return;
    }

    if (!isSectionAllowed) {
      setSearchParams({ section: defaultSection }, { replace: true });
    }
  }, [
    token,
    canOpenPanel,
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

  if (!token || !canOpenPanel) {
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
                : isAccountant
                  ? "Финансы и экспорт данных."
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

          {section === "analytics" && isAdmin && (
            <AdminAnalyticsSection token={token} />
          )}

          {section === "users" && isAdmin && (
            <AdminUsersSection token={token} currentUser={me} />
          )}

          {section === "listings" && isAdmin && (
            <AdminListingsSection token={token} />
          )}

          {section === "moderation" && (
            <ModerationListingsPanel token={token} embedded />
          )}

          {section === "reports" && <ModerationReports token={token} />}

          {section === "finance" && (isSuperAdmin || isAccountant) && (
            <AdminFinancePanel
              token={token}
              currentUser={me}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {section === "audit" && isAdmin && (
            <AdminAuditSection token={token} />
          )}

          {section === "settings" && isSuperAdmin && (
            <AdminSettingsSection token={token} />
          )}

          {section === "export" && canAccessAdminSection(role, "export") && (
            <AdminExportSection token={token} role={role} />
          )}

          {!isSectionAllowed && <Navigate to={`/admin?section=${defaultSection}`} replace />}
        </main>
      </div>
    </div>
  );
}
