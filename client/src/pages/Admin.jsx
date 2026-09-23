import React from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  Flag,
  Wallet,
  ScrollText,
  BarChart3,
  Settings,
  Download,
  Megaphone,
  Menu,
  Search,
  LogOut,
  Bell,
  Shield,
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
import AdminCommandPalette from "../components/admin/AdminCommandPalette";
import AdminRolesSection from "../components/admin/AdminRolesSection";
import AdminSystemSection from "../components/admin/AdminSystemSection";

const SECTIONS = [
  { id: "dashboard", icon: LayoutDashboard, group: "overview" },
  { id: "analytics", icon: BarChart3, group: "overview" },
  { id: "listings", icon: FileText, group: "market" },
  { id: "moderation", icon: ClipboardCheck, group: "market" },
  { id: "reports", icon: Flag, group: "market" },
  { id: "users", icon: Users, group: "people" },
  { id: "roles", icon: Shield, group: "people" },
  { id: "ads", icon: Megaphone, group: "money" },
  { id: "finance", icon: Wallet, group: "money" },
  { id: "export", icon: Download, group: "money" },
  { id: "audit", icon: ScrollText, group: "system" },
  { id: "settings", icon: Settings, group: "system" },
  { id: "system", icon: Shield, group: "system" },
];

const GROUPS = ["overview", "market", "people", "money", "system"];

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
  roles: "admin.sections.roles",
  system: "admin.sections.system",
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
  const [adStats, setAdStats] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [statsError, setStatsError] = React.useState("");
  const [navOpen, setNavOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [queueOpen, setQueueOpen] = React.useState(false);

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
      .then(async (data) => {
        if (!alive) return;
        setStats(data);
        try {
          const ads = await api.adminAdStats(token);
          if (alive) setAdStats(ads);
        } catch {
          if (alive) setAdStats(null);
        }
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
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

    if (extra.business) next.business = extra.business;
    if (extra.q) next.q = extra.q;

    setSearchParams(next);
    setNavOpen(false);
    setPaletteOpen(false);
    setQueueOpen(false);
  };

  const goToSection = (id, extra = {}) => {
    setSection(id, extra);
  };

  const logout = () => {
    if (!window.confirm(t("listing.confirmLogout"))) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    navigate("/auth");
  };

  const searchQuery = searchParams.get("q") || "";
  const displayName = me?.name || me?.phone || me?.email || t("admin.shell.account");
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";
  const queue = [
    { id: "moderation", count: Number(stats?.listings?.pending || 0) },
    { id: "reports", count: Number(stats?.reports?.pending || 0) },
  ].filter((item) => item.count > 0 && canAccessAdminSection(role, item.id));

  const nav = (
    <nav className="admin-nav" aria-label={t("admin.page.title")}>
      {GROUPS.map((group) => {
        const items = visibleSections.filter((item) => item.group === group);
        if (!items.length) return null;

        return (
          <div key={group} className="admin-nav__group">
            <p>{t(`admin.nav.${group}`)}</p>
            {items.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              const badge = getSectionBadge(item.id, stats);

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSection(item.id)}
                  className={active ? "is-active" : ""}
                >
                  <span>
                    <Icon size={16} aria-hidden="true" />
                    {t(SECTION_LABEL_KEYS[item.id])}
                  </span>
                  {badge > 0 && <em>{badge > 99 ? "99+" : badge}</em>}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-app">
      {navOpen && (
        <button
          type="button"
          className="admin-drawer-backdrop lg:hidden"
          aria-label={t("admin.shell.closeMenu")}
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${navOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          <strong>Diyor</strong>
          <span>{t("admin.page.title")}</span>
        </div>
        {nav}
        <div className="admin-account">
          <span className="admin-avatar" aria-hidden="true">{initial}</span>
          <div className="min-w-0">
            <strong>{displayName}</strong>
            <span className={roleBadgeClass(role)}>{roleLabel(role)}</span>
          </div>
          <Link to="/profile" className="admin-icon-button" aria-label={t("nav.profile")}>
            <Users size={16} />
          </Link>
          <button type="button" className="admin-icon-button" onClick={logout} aria-label={t("profile.logout")}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-header">
          <button
            type="button"
            className="admin-icon-button lg:hidden"
            aria-label={t("admin.shell.openMenu")}
            onClick={() => setNavOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="admin-crumbs">{t("admin.page.title")}</p>
            <h1>{t(SECTION_LABEL_KEYS[section] || "admin.page.title")}</h1>
          </div>
          <div className="admin-header__tools">
            <button type="button" className="admin-search" onClick={() => setPaletteOpen(true)}>
              <Search size={15} aria-hidden="true" />
              <span>{t("admin.shell.searchLabel")}</span>
              <kbd>Ctrl K</kbd>
            </button>
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label={t("admin.shell.queue")}
                  aria-expanded={queueOpen}
                  onClick={() => setQueueOpen((open) => !open)}
                >
                  <Bell size={16} />
                  {queue.length > 0 && <i />}
                </button>
                {queueOpen && (
                  <div className="admin-queue" role="menu">
                    {queue.length === 0 ? (
                      <p>{t("admin.dashboard.queueEmpty")}</p>
                    ) : (
                      queue.map((item) => (
                        <button key={item.id} type="button" onClick={() => setSection(item.id)}>
                          {t(SECTION_LABEL_KEYS[item.id])}
                          <strong>{item.count}</strong>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="admin-main">
          {section === "dashboard" && isAdmin && (
            <AdminDashboard
              stats={stats}
              adStats={adStats}
              loading={statsLoading}
              error={statsError}
              role={role}
              onGoToSection={goToSection}
            />
          )}

          {section === "analytics" && isAdmin && (
            <AdminAnalyticsSection token={token} />
          )}

          {section === "users" && isAdmin && (
            <AdminUsersSection
              key={`users-${businessFilter}-${searchQuery}`}
              token={token}
              currentUser={me}
              initialBusinessFilter={businessFilter}
              initialQuery={searchQuery}
            />
          )}

          {section === "listings" && isAdmin && (
            <AdminListingsSection key={`listings-${searchQuery}`} token={token} initialQuery={searchQuery} />
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

          {section === "roles" && isAdmin && <AdminRolesSection stats={stats} />}

          {section === "audit" && isAdmin && (
            <AdminAuditSection token={token} />
          )}

          {section === "settings" && isSuperAdmin && (
            <AdminSettingsSection token={token} />
          )}

          {section === "system" && isAdmin && <AdminSystemSection />}

          {section === "export" && canAccessAdminSection(role, "export") && (
            <AdminExportSection token={token} role={role} />
          )}

          {!isSectionAllowed && (
            <Navigate to={`/admin?section=${defaultSection}`} replace />
          )}
        </main>
      </div>

      <AdminCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sections={visibleSections.map((item) => ({
          id: item.id,
          labelKey: SECTION_LABEL_KEYS[item.id],
        }))}
        token={token}
        role={role}
        t={t}
        onOpen={setSection}
      />
    </div>
  );
}
