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
  Megaphone,
  MessageCircle,
} from "lucide-react";
import { useI18n } from "../i18n";
import { api } from "../lib/api";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";
import {
  canAccessAdmin,
  canAccessAdminPanel,
  canAccessAdminSection,
  canAccessAccountant,
  defaultAdminSection,
  roleBadgeClass,
  roleLabel,
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
import AdminAdsSection from "../components/admin/AdminAdsSection";

const SECTIONS = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "analytics", icon: BarChart3 },
  { id: "users", icon: Users },
  { id: "listings", icon: FileText },
  { id: "ads", icon: Megaphone },
  { id: "moderation", icon: ClipboardCheck },
  { id: "reports", icon: Flag },
  { id: "finance", icon: Wallet },
  { id: "settings", icon: Settings },
  { id: "export", icon: Download },
  { id: "audit", icon: ScrollText },
];

const SECTION_LABEL_KEYS = {
  dashboard: "admin.sections.dashboard",
  analytics: "admin.sections.analytics",
  users: "admin.sections.users",
  listings: "admin.sections.listings",
  ads: "admin.sections.ads",
  moderation: "nav.moderation",
  reports: "admin.sections.reports",
  finance: "admin.sections.finance",
  settings: "admin.sections.settings",
  export: "admin.sections.export",
  audit: "admin.sections.audit",
};

function getSectionBadge(sectionId, stats) {
  if (!stats) return 0;

  if (sectionId === "moderation") {
    return Number(stats.listings?.pending || 0);
  }

  if (sectionId === "reports") {
    return Number(stats.reports?.pending || 0);
  }

  if (sectionId === "users") {
    return Number(stats.business?.pendingVerification || 0);
  }

  return 0;
}

export default function Admin() {
  const { t } = useI18n();
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
  const businessFilter = searchParams.get("business") || "all";

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
        if (alive)
          setStatsError(e.message || t("admin.page.statsError"));
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

  const setSection = (id, extra = {}) => {
    const next = { section: id };

    if (extra.business) {
      next.business = extra.business;
    } else if (id !== "users") {
      // keep business filter only on users section navigation intent
    }

    setSearchParams(next);
  };

  const goToSection = (id, extra = {}) => {
    setSection(id, extra);
  };

  return (
    <div className="page-container admin-shell py-6 md:py-8">
      <div className="mb-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 mb-2"
          >
            <ArrowLeft size={16} />
            {t("admin.page.backToProfile")}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink flex items-center gap-2">
              <Shield className="text-sun" />
              {t("admin.page.title")}
            </h1>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadgeClass(role)}`}
            >
              {roleLabel(role)}
            </span>
          </div>
          <p className="text-sm text-ink-500 mt-1 max-w-2xl">
            {isSuperAdmin
              ? t("admin.page.subtitleSuperAdmin")
              : isAdmin
                ? t("admin.page.subtitleAdmin")
                : isAccountant
                  ? t("admin.page.subtitleAccountant")
                  : t("admin.page.subtitleModerator")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/messages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white hover:bg-mist-50 text-sm font-semibold"
          >
            <MessageCircle size={16} />
            {t("nav.messages")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5">
        <aside className="admin-panel p-3 h-fit lg:sticky lg:top-24">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {visibleSections.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              const badge = getSectionBadge(item.id, stats);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`inline-flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition w-full ${
                    active
                      ? "bg-ink text-white"
                      : "hover:bg-mist-50 text-ink-700"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Icon size={16} className="shrink-0" />
                    {t(SECTION_LABEL_KEYS[item.id])}
                  </span>
                  {badge > 0 && (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                        active
                          ? "bg-sun text-white"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
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
                role={role}
                onGoToSection={goToSection}
              />
            </div>
          )}

          {section === "analytics" && isAdmin && (
            <AdminAnalyticsSection token={token} />
          )}

          {section === "users" && isAdmin && (
            <AdminUsersSection
              token={token}
              currentUser={me}
              initialBusinessFilter={businessFilter}
            />
          )}

          {section === "listings" && isAdmin && (
            <AdminListingsSection token={token} />
          )}

          {section === "ads" && isAdmin && (
            <AdminAdsSection token={token} />
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

          {!isSectionAllowed && (
            <Navigate to={`/admin?section=${defaultSection}`} replace />
          )}
        </main>
      </div>
    </div>
  );
}
