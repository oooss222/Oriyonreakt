import React from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
import { api } from "../lib/api";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";
import {
  canAccessAdmin,
  canAccessAdminPanel,
  canAccessAdminSection,
  canAccessAccountant,
  defaultAdminSection,
  roleLabel,
} from "../lib/adminUtils";
import { Badge, Button, Card, Tabs } from "../ui";
import { roleTone } from "../components/admin/AdminUI";
import { useI18n } from "../i18n";
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

const PANEL_ID = "admin-section-panel";

const SECTIONS = [
  { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "users", label: "Пользователи", icon: Users },
  { id: "listings", label: "Объявления", icon: FileText },
  { id: "ads", label: "Реклама", icon: Megaphone },
  { id: "moderation", label: "Модерация", icon: ClipboardCheck },
  { id: "reports", label: "Жалобы", icon: Flag },
  { id: "finance", label: "Финансы", icon: Wallet },
  { id: "settings", label: "Настройки", icon: Settings },
  { id: "export", label: "Экспорт", icon: Download },
  { id: "audit", label: "Журнал", icon: ScrollText },
];

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();

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

  const tabItems = visibleSections.map((item) => ({
    value: item.id,
    label: item.label,
    icon: item.icon,
    count: getSectionBadge(item.id, stats),
    panelId: PANEL_ID,
  }));

  const activeSection = visibleSections.find((item) => item.id === section);

  return (
    <div className="page-container stack-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            to="/profile"
            className="-ml-3 mb-1"
          >
            Назад в профиль
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              <Shield className="text-sun-500" aria-hidden="true" />
              Админ-панель
            </h1>

            <Badge tone={roleTone(role)}>{roleLabel(role)}</Badge>
          </div>

          <p className="mt-1 max-w-2xl text-sm text-ink-400">
            {isSuperAdmin
              ? "Полный доступ: пользователи, модерация, финансы и настройки."
              : isAdmin
                ? "Модерация, пользователи, объявления, верификация премиум и жалобы."
                : isAccountant
                  ? "Финансы и экспорт данных."
                  : "Модерация объявлений и жалоб."}
          </p>
        </div>

        <Button to="/messages" icon={MessageCircle} className="shrink-0">
          Сообщения
        </Button>
      </div>

      <Tabs
        items={tabItems}
        value={section}
        onChange={(id) => setSection(id)}
        label={t("admin.panelNav")}
      />

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-label={activeSection?.label}
        tabIndex={-1}
        className="outline-none"
      >
        {section === "dashboard" && isAdmin && (
          <Card padding="md">
            <AdminDashboard
              stats={stats}
              loading={statsLoading}
              error={statsError}
              role={role}
              onGoToSection={goToSection}
            />
          </Card>
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

        {section === "ads" && isAdmin && <AdminAdsSection token={token} />}

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

        {section === "audit" && isAdmin && <AdminAuditSection token={token} />}

        {section === "settings" && isSuperAdmin && (
          <AdminSettingsSection token={token} />
        )}

        {section === "export" && canAccessAdminSection(role, "export") && (
          <AdminExportSection token={token} role={role} />
        )}

        {!isSectionAllowed && (
          <Navigate to={`/admin?section=${defaultSection}`} replace />
        )}
      </div>
    </div>
  );
}
