import React from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  ClipboardList,
  Check,
  X,
  Trash2,
  ExternalLink,
  Clock3,
  Search,
  RotateCw,
  ShieldCheck,
  Flag,
  Gavel,
  Image as ImageIcon,
  ImageOff,
} from "lucide-react";
import { api } from "../../lib/api";
import { getId } from "../../lib/adminUtils";
import { getListingThumb } from "../../lib/media";
import { formatPrice } from "../../lib/format";
import { listingStatusLabel, listingStatusTone } from "../../lib/messagesUtils";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SegmentedControl,
  StatusBadge,
  useConfirm,
  useToast,
} from "../../ui";
import { useI18n } from "../../i18n";
import ModerationReports from "../ModerationReports";
import ModerationStatsPanel from "./ModerationStatsPanel";
import { CardListSkeleton, FilterBar, SectionHeader, StatTile } from "./AdminUI";
import { subscribeModerationQueue } from "../../lib/moderationSocket";

const STATUS_FILTERS = [
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Принятые" },
  { value: "rejected", label: "Отклонённые" },
];

const MIN_REJECT_REASON = 5;

function adTitle(ad) {
  return ad?.title || "Без названия";
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ru-RU");
}

export default function ModerationListingsPanel({ token, embedded = false }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [panelMode, setPanelMode] = React.useState("listings");
  const [items, setItems] = React.useState([]);
  const [status, setStatus] = React.useState("pending");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.moderationListings(token, status);

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Ошибка загрузки модерации");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, status]);

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api
      .moderationListings(token, status)
      .then((data) => {
        if (alive) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message || "Ошибка загрузки модерации");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [token, status]);

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return items;

    return items.filter((ad) => {
      const title = String(ad.title || "").toLowerCase();
      const description = String(ad.description || "").toLowerCase();
      const location = String(ad.location || "").toLowerCase();
      const cat = String(ad.cat || "").toLowerCase();
      const subcategory = String(ad.subcategory || "").toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        location.includes(q) ||
        cat.includes(q) ||
        subcategory.includes(q)
      );
    });
  }, [items, query]);

  const stats = React.useMemo(() => {
    return {
      loaded: items.length,
      filtered: filteredItems.length,
      withImages: items.filter((ad) => ad?.images?.length).length,
      withoutImages: items.filter((ad) => !ad?.images?.length).length,
    };
  }, [items, filteredItems]);

  React.useEffect(() => {
    return subscribeModerationQueue(() => {
      load();
    });
  }, [load]);

  const dropItem = React.useCallback((id) => {
    setItems((arr) => arr.filter((item) => String(getId(item)) !== String(id)));
  }, []);

  const approveAppeal = React.useCallback(
    async (ad) => {
      const id = getId(ad);

      const ok = await confirm({
        title: t("admin.appealApproveTitle"),
        message: t("admin.appealApproveMessage", { title: adTitle(ad) }),
        confirmLabel: t("admin.appealApproveConfirm"),
      });

      if (!ok) return;

      try {
        setActionLoadingId(id);
        await api.moderationApproveAppeal(token, id);
        dropItem(id);
        showToast(t("admin.toastAppealApproved"), "success");
      } catch (e) {
        showToast(e.message || "Ошибка одобрения апелляции", "error");
      } finally {
        setActionLoadingId("");
      }
    },
    [token, confirm, showToast, t, dropItem]
  );

  const rejectAppeal = React.useCallback(
    async (ad) => {
      const id = getId(ad);

      const note = await confirm({
        title: t("admin.appealRejectTitle"),
        message: t("admin.appealRejectMessage", { title: adTitle(ad) }),
        placeholder: t("admin.appealRejectPlaceholder"),
        confirmLabel: t("admin.appealRejectConfirm"),
        prompt: true,
        multiline: true,
        tone: "danger",
      });

      if (note === null) return;

      try {
        setActionLoadingId(id);
        await api.moderationRejectAppeal(token, id, note);
        dropItem(id);
        showToast(t("admin.toastAppealRejected"), "success");
      } catch (e) {
        showToast(e.message || "Ошибка отклонения апелляции", "error");
      } finally {
        setActionLoadingId("");
      }
    },
    [token, confirm, showToast, t, dropItem]
  );

  const approve = React.useCallback(
    async (ad) => {
      const id = getId(ad);

      const ok = await confirm({
        title: t("admin.approveTitle"),
        message: t("admin.approveMessage", { title: adTitle(ad) }),
        confirmLabel: t("admin.approveConfirm"),
      });

      if (!ok) return;

      try {
        setActionLoadingId(id);
        await api.moderationApproveListing(token, id);
        dropItem(id);
        showToast(t("admin.toastApproved"), "success");
      } catch (e) {
        showToast(e.message || "Ошибка принятия объявления", "error");
      } finally {
        setActionLoadingId("");
      }
    },
    [token, confirm, showToast, t, dropItem]
  );

  const reject = React.useCallback(
    async (ad) => {
      const id = getId(ad);

      const reason = await confirm({
        title: t("admin.rejectTitle"),
        message: t("admin.rejectMessage", { title: adTitle(ad) }),
        placeholder: t("admin.rejectPlaceholder"),
        confirmLabel: t("admin.rejectConfirm"),
        prompt: true,
        multiline: true,
        requireValue: true,
        tone: "danger",
      });

      if (reason === null) return;

      if (String(reason).trim().length < MIN_REJECT_REASON) {
        showToast(t("admin.rejectTooShort", { min: MIN_REJECT_REASON }), "error");
        return;
      }

      try {
        setActionLoadingId(id);
        await api.moderationRejectListing(token, id, String(reason).trim());
        dropItem(id);
        showToast(t("admin.toastRejected"), "success");
      } catch (e) {
        showToast(e.message || "Ошибка отклонения объявления", "error");
      } finally {
        setActionLoadingId("");
      }
    },
    [token, confirm, showToast, t, dropItem]
  );

  const removeListing = React.useCallback(
    async (ad) => {
      const id = getId(ad);

      const ok = await confirm({
        title: t("admin.deleteListingTitle"),
        message: t("admin.deleteListingMessage", { title: adTitle(ad) }),
        confirmLabel: t("admin.deleteConfirm"),
        tone: "danger",
      });

      if (!ok) return;

      try {
        setActionLoadingId(id);
        await api.adminDeleteListing(token, id);
        dropItem(id);
        showToast(t("admin.toastListingDeleted"), "success");
      } catch (e) {
        showToast(e.message || "Ошибка удаления", "error");
      } finally {
        setActionLoadingId("");
      }
    },
    [token, confirm, showToast, t, dropItem]
  );

  const openPreview = (ad) => {
    sessionStorage.setItem("ad_preview", JSON.stringify(ad));
  };

  const modeSwitch = (
    <SegmentedControl
      label={t("admin.moderationModeLabel")}
      value={panelMode}
      onChange={setPanelMode}
      items={[
        { value: "listings", label: "Объявления", icon: ClipboardList },
        { value: "reports", label: "Жалобы", icon: Flag },
      ]}
      className="w-full sm:w-auto"
    />
  );

  if (panelMode === "reports") {
    return (
      <div className="space-y-4">
        {!embedded && modeSwitch}
        <ModerationReports token={token} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!embedded && modeSwitch}

      <ModerationStatsPanel token={token} />

      <Card className="space-y-5">
        <SectionHeader
          eyebrow="Панель модератора"
          icon={ClipboardCheck}
          title="Модерация объявлений"
          description="Проверка, публикация и отклонение объявлений пользователей."
          action={
            <Button icon={RotateCw} loading={refreshing} onClick={load}>
              Обновить
            </Button>
          }
        />

        {error && <Alert tone="danger">{error}</Alert>}

        <p className="sr-only" aria-live="polite">
          {t("admin.queueAnnounce", { count: stats.loaded })}
        </p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            tone={status === "pending" ? "sun" : "neutral"}
            icon={ClipboardList}
            label={
              STATUS_FILTERS.find((item) => item.value === status)?.label ||
              t("admin.statusLabel")
            }
            value={stats.loaded}
            hint={t("admin.queueHint")}
          />
          <StatTile
            label={t("admin.shownLabel")}
            value={stats.filtered}
            hint={t("admin.ofTotal", { total: stats.loaded })}
          />
          <StatTile icon={ImageIcon} label="С фото" value={stats.withImages} />
          <StatTile
            icon={ImageOff}
            label="Без фото"
            value={stats.withoutImages}
            tone={stats.withoutImages > 0 ? "warning" : "neutral"}
          />
        </div>

        <FilterBar
          gridClassName="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]"
          onReset={() => {
            setQuery("");
            setStatus("pending");
          }}
          resetDisabled={!query && status === "pending"}
        >
          <Field label={t("admin.searchLabel")} labelClassName="sr-only">
            {(props) => (
              <Input
                {...props}
                type="search"
                iconLeft={Search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: название, описание, город, категория"
              />
            )}
          </Field>

          <SegmentedControl
            label={t("admin.statusLabel")}
            value={status}
            onChange={setStatus}
            items={STATUS_FILTERS}
            className="w-full lg:w-auto"
          />
        </FilterBar>

        {loading ? (
          <CardListSkeleton count={4} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            bare
            icon={ClipboardCheck}
            title={t("admin.moderationEmptyTitle")}
            description={
              query
                ? t("admin.moderationEmptyQuery")
                : t("admin.moderationEmptyDescription")
            }
            secondaryAction={
              query ? (
                <Button onClick={() => setQuery("")}>{t("admin.reset")}</Button>
              ) : null
            }
          />
        ) : (
          <ul className="grid gap-3">
            {filteredItems.map((ad) => {
              const id = getId(ad);
              const img = getListingThumb(ad);
              const isBusy = actionLoadingId === id;
              const adStatus = ad.status || status;
              const isAppeal = ad.appealStatus === "pending";

              return (
                <li key={id}>
                  <article className="card p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                      <Link
                        to={`/ad/${id}`}
                        onClick={() => openPreview(ad)}
                        className="block shrink-0 overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-sun/50"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-40 w-full bg-mist-200 object-cover sm:h-24 sm:w-36"
                          loading="lazy"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge
                            tone={listingStatusTone(adStatus)}
                            label={listingStatusLabel(adStatus, t)}
                          />

                          {ad.ownerTrustLevel === "trusted" && (
                            <Badge tone="success" icon={ShieldCheck}>
                              Доверенный
                            </Badge>
                          )}

                          {Number(ad.reportCount || 0) > 0 && (
                            <Badge tone="danger" icon={Flag}>
                              Жалоб: {ad.reportCount}
                            </Badge>
                          )}

                          {isAppeal && (
                            <Badge tone="info" icon={Gavel}>
                              Апелляция
                            </Badge>
                          )}

                          <span className="text-2xs font-medium text-ink-400">
                            ID: {String(id).slice(0, 8)}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold leading-snug">
                          <Link
                            to={`/ad/${id}`}
                            onClick={() => openPreview(ad)}
                            className="text-ink-900 line-clamp-2 hover:text-sun-700"
                          >
                            {adTitle(ad)}
                          </Link>
                        </h3>

                        <p className="mt-1 text-price text-lg">
                          {formatPrice(ad.price, { emptyLabel: "—" })}
                        </p>

                        <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                          <div className="flex gap-1">
                            <dt className="text-ink-400">
                              {t("admin.sellerLabel")}:
                            </dt>
                            <dd className="font-medium text-ink-600">
                              {ad.ownerName || ad.ownerEmail || "—"}
                            </dd>
                          </div>

                          <div className="flex gap-1">
                            <dt className="sr-only">
                              {t("admin.submittedLabel")}
                            </dt>
                            <dd className="flex items-center gap-1">
                              <Clock3 size={13} aria-hidden="true" />
                              {formatDateTime(ad.createdAt)}
                            </dd>
                          </div>

                          <div className="flex gap-1">
                            <dt className="sr-only">
                              {t("admin.categoryLabel")}
                            </dt>
                            <dd>
                              {ad.location || "Локация не указана"} ·{" "}
                              {ad.cat || "—"}
                              {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                            </dd>
                          </div>
                        </dl>

                        {ad.description && (
                          <p className="mt-2 text-sm text-ink-500 line-clamp-2">
                            {ad.description}
                          </p>
                        )}

                        {Array.isArray(ad.moderationFlags) &&
                          ad.moderationFlags.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-1">
                              {ad.moderationFlags.map((flag) => (
                                <li key={`${id}-${flag.code}`}>
                                  <Badge tone="warning">{flag.message}</Badge>
                                </li>
                              ))}
                            </ul>
                          )}

                        {Array.isArray(ad.contentDiff) &&
                          ad.contentDiff.length > 0 && (
                            <div className="surface-muted mt-3 space-y-1 p-3 text-xs">
                              <p className="font-semibold text-ink-700">
                                Изменения
                              </p>
                              {ad.contentDiff.map((change) => (
                                <p
                                  key={`${id}-${change.field}`}
                                  className="text-ink-500"
                                >
                                  <b className="text-ink-700">
                                    {change.label}:
                                  </b>{" "}
                                  {change.before} → {change.after}
                                </p>
                              ))}
                            </div>
                          )}

                        {ad.appealText && (
                          <Alert tone="info" title="Апелляция" className="mt-3">
                            {ad.appealText}
                          </Alert>
                        )}

                        {ad.autoModerationReason && (
                          <p className="mt-2 text-xs text-ink-400">
                            Авто-проверка: {ad.autoModerationReason}
                          </p>
                        )}

                        {ad.rejectionReason && (
                          <Alert
                            tone="danger"
                            title="Причина отклонения"
                            className="mt-3"
                          >
                            {ad.rejectionReason}
                          </Alert>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-200 pt-3">
                      <Button
                        to={`/ad/${id}`}
                        onClick={() => openPreview(ad)}
                        icon={ExternalLink}
                        className="flex-1 sm:flex-none"
                      >
                        Открыть
                      </Button>

                      {status === "pending" &&
                        (isAppeal ? (
                          <>
                            <Button
                              variant="lagoon"
                              icon={Check}
                              disabled={isBusy}
                              onClick={() => approveAppeal(ad)}
                              className="flex-1 sm:flex-none"
                            >
                              Одобрить апелляцию
                            </Button>

                            <Button
                              icon={X}
                              disabled={isBusy}
                              onClick={() => rejectAppeal(ad)}
                              className="flex-1 sm:flex-none"
                            >
                              Отклонить апелляцию
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="lagoon"
                              icon={Check}
                              loading={isBusy}
                              onClick={() => approve(ad)}
                              className="flex-1 sm:flex-none"
                            >
                              Принять
                            </Button>

                            <Button
                              variant="danger"
                              icon={X}
                              disabled={isBusy}
                              onClick={() => reject(ad)}
                              className="flex-1 sm:flex-none"
                            >
                              Отклонить
                            </Button>
                          </>
                        ))}

                      <Button
                        variant="ghost"
                        icon={Trash2}
                        disabled={isBusy}
                        onClick={() => removeListing(ad)}
                        className="text-danger-700 hover:bg-danger-50 hover:text-danger-800 sm:ml-auto"
                      >
                        Удалить
                      </Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
