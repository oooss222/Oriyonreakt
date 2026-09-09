import React from "react";
import { Link } from "react-router-dom";
import {
  Flag,
  ExternalLink,
  Trash2,
  Ban,
  Check,
  X,
  RotateCw,
  AlertTriangle,
} from "lucide-react";
import { api } from "../lib/api";
import { REPORT_REASON_LABELS } from "../data/reportReasons";
import { subscribeModerationQueue } from "../lib/moderationSocket";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  SegmentedControl,
  useConfirm,
  useToast,
} from "../ui";
import { useI18n } from "../i18n";
import { CardListSkeleton, SectionHeader } from "./admin/AdminUI";

const STATUS_FILTERS = [
  { value: "pending", label: "Новые" },
  { value: "reviewed", label: "Рассмотренные" },
  { value: "dismissed", label: "Отклонённые" },
];

function listingTitle(item) {
  return item?.listingTitle || "Без названия";
}

function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("ru-RU");
}

export default function ModerationReports({ token }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [items, setItems] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [status, setStatus] = React.useState("pending");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data =
        status === "pending"
          ? await api.moderationReportsGrouped(token, status)
          : await api.moderationReports(token, status);

      if (status === "pending") {
        setGroups(Array.isArray(data) ? data : []);
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : []);
        setGroups([]);
      }
    } catch (e) {
      setError(e.message || "Не удалось загрузить жалобы");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, status]);

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  React.useEffect(() => {
    return subscribeModerationQueue(() => {
      load();
    });
  }, [load]);

  const removeGroup = (listingId) => {
    setGroups((prev) =>
      prev.filter((group) => String(group.listingId) !== String(listingId))
    );
  };

  const handleReview = async (id, listingId) => {
    try {
      setActionLoadingId(id);
      await api.moderationReviewReport(token, id);
      if (listingId) removeGroup(listingId);
      else setItems((prev) => prev.filter((item) => item.id !== id));
      showToast(t("admin.toastReportReviewed"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось обновить жалобу", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDismiss = async (id, listingId) => {
    try {
      setActionLoadingId(id);
      await api.moderationDismissReport(token, id);
      if (listingId) removeGroup(listingId);
      else setItems((prev) => prev.filter((item) => item.id !== id));
      showToast(t("admin.toastReportDismissed"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось отклонить жалобу", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteListing = async (item) => {
    const ok = await confirm({
      title: t("admin.deleteListingTitle"),
      message: t("admin.deleteListingMessage", { title: listingTitle(item) }),
      confirmLabel: t("admin.deleteConfirm"),
      tone: "danger",
    });

    if (!ok) return;

    try {
      setActionLoadingId(item.id);
      await api.moderationReportDeleteListing(token, item.id);
      if (item.listingId) removeGroup(item.listingId);
      else setItems((prev) => prev.filter((row) => row.id !== item.id));
      showToast(t("admin.toastListingDeleted"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось удалить объявление", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBlockOwner = async (item) => {
    const ownerLabel = item.listingOwnerName || t("admin.ownerFallback");

    const ok = await confirm({
      title: t("admin.blockOwnerTitle"),
      message: t("admin.blockOwnerMessage", { name: ownerLabel }),
      confirmLabel: t("admin.blockConfirm"),
      tone: "danger",
    });

    if (!ok) return;

    try {
      setActionLoadingId(item.id);
      await api.moderationReportBlockOwner(token, item.id);
      if (item.listingId) removeGroup(item.listingId);
      else setItems((prev) => prev.filter((row) => row.id !== item.id));
      showToast(t("admin.toastOwnerBlocked"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось заблокировать продавца", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const pendingCount = groups.length;
  const isEmpty = status === "pending" ? pendingCount === 0 : items.length === 0;

  return (
    <Card className="space-y-5">
      <SectionHeader
        eyebrow="Жалобы пользователей"
        icon={Flag}
        title="Жалобы на объявления"
        description="Проверяйте жалобы и принимайте решение по объявлениям."
        action={
          <Button icon={RotateCw} loading={refreshing} onClick={load}>
            Обновить
          </Button>
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label={t("admin.statusLabel")}
          value={status}
          onChange={setStatus}
          items={STATUS_FILTERS}
          className="w-full sm:w-auto"
        />

        {status === "pending" && (
          <p
            aria-live="polite"
            className="text-sm font-semibold text-ink-600"
          >
            {t("admin.reportsAnnounce", { count: pendingCount })}
          </p>
        )}
      </div>

      {loading ? (
        <CardListSkeleton count={3} />
      ) : isEmpty ? (
        <EmptyState
          bare
          icon={Flag}
          title={t("admin.reportsEmptyTitle")}
          description={t("admin.reportsEmptyDescription")}
        />
      ) : status === "pending" ? (
        <ul className="space-y-3">
          {groups.map((group) => {
            const primary = group.reports?.[0];
            if (!primary) return null;

            const busy = actionLoadingId === primary.id;

            return (
              <li key={group.listingId}>
                <article
                  className={
                    group.highPriority
                      ? "rounded-2xl border border-danger-300 bg-danger-50/40 p-4"
                      : "surface-panel p-4"
                  }
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-ink-900">
                          {listingTitle(group)}
                        </h3>

                        <Badge tone="danger" icon={Flag}>
                          {t("admin.reportCount", {
                            count: group.reportCount,
                          })}
                        </Badge>

                        {group.highPriority && (
                          <Badge tone="danger" icon={AlertTriangle}>
                            Приоритет
                          </Badge>
                        )}
                      </div>

                      {group.listingOwnerName && (
                        <p className="text-sm text-ink-400">
                          Продавец:{" "}
                          <span className="font-medium text-ink-600">
                            {group.listingOwnerName}
                          </span>
                        </p>
                      )}

                      <ul className="flex flex-wrap gap-1 pt-1">
                        {(group.reasons || []).map((reason, idx) => (
                          <li key={`${group.listingId}-${reason}-${idx}`}>
                            <Badge tone="neutral">
                              {REPORT_REASON_LABELS[reason] || reason}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:shrink-0">
                      <Button
                        to={`/ad/${group.listingId}`}
                        icon={ExternalLink}
                        size="sm"
                      >
                        Открыть
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        icon={Check}
                        disabled={busy}
                        onClick={() => handleReview(primary.id, group.listingId)}
                      >
                        Рассмотрено
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        disabled={busy}
                        onClick={() => handleDeleteListing(primary)}
                      >
                        Удалить объявление
                      </Button>

                      {group.listingOwnerId && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Ban}
                          disabled={busy}
                          onClick={() => handleBlockOwner(primary)}
                        >
                          Заблокировать
                        </Button>
                      )}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-2 border-t border-ink-200 pt-3">
                    {group.reports.map((item) => (
                      <li
                        key={item.id}
                        className="surface-muted p-3 text-sm"
                      >
                        <p className="font-medium text-ink-800">
                          {REPORT_REASON_LABELS[item.reason] || item.reason}
                        </p>
                        <p className="text-xs text-ink-400">
                          {item.reporterName || "Пользователь"}
                          {item.createdAt ? ` · ${formatDateTime(item.createdAt)}` : ""}
                        </p>
                        {item.details && (
                          <p className="mt-1 text-ink-600 break-anywhere">
                            {item.details}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const busy = actionLoadingId === item.id;

            return (
              <li key={item.id}>
                <article className="surface-panel p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base font-semibold text-ink-900">
                        {REPORT_REASON_LABELS[item.reason] || item.reason}
                      </h3>

                      <p className="text-sm text-ink-500">
                        Объявление:{" "}
                        <Link
                          to={`/ad/${item.listingId}`}
                          className="font-medium text-sun-700 hover:text-sun-800"
                        >
                          {listingTitle(item)}
                        </Link>
                      </p>

                      <p className="text-sm text-ink-400">
                        От: {item.reporterName || "Пользователь"}
                        {item.createdAt ? ` · ${formatDateTime(item.createdAt)}` : ""}
                      </p>

                      {item.listingOwnerName && (
                        <p className="text-sm text-ink-400">
                          Продавец: {item.listingOwnerName}
                        </p>
                      )}

                      {item.details && (
                        <p className="surface-muted mt-2 p-3 text-sm text-ink-600 break-anywhere">
                          {item.details}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:shrink-0">
                      <Button
                        to={`/ad/${item.listingId}`}
                        icon={ExternalLink}
                        size="sm"
                      >
                        Открыть
                      </Button>

                      {status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Check}
                            disabled={busy}
                            onClick={() => handleReview(item.id)}
                          >
                            Рассмотрено
                          </Button>

                          <Button
                            size="sm"
                            icon={X}
                            disabled={busy}
                            onClick={() => handleDismiss(item.id)}
                          >
                            Отклонить
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            disabled={busy}
                            onClick={() => handleDeleteListing(item)}
                          >
                            Удалить объявление
                          </Button>

                          {item.listingOwnerId && (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={Ban}
                              disabled={busy}
                              onClick={() => handleBlockOwner(item)}
                            >
                              Заблокировать продавца
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
