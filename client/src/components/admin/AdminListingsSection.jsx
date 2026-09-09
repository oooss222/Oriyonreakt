import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Trash2,
  Archive,
  ExternalLink,
  Search,
  RotateCw,
} from "lucide-react";
import { api } from "../../lib/api";
import { getId } from "../../lib/adminUtils";
import { getListingThumb } from "../../lib/media";
import { formatPrice } from "../../lib/format";
import { listingStatusLabel, listingStatusTone } from "../../lib/messagesUtils";
import { HOME_CATEGORIES } from "../../data/categories";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  SimplePagination,
  StatusBadge,
  useConfirm,
  useToast,
} from "../../ui";
import { useI18n } from "../../i18n";
import {
  CardListSkeleton,
  FilterBar,
  ResultsBar,
  SectionHeader,
} from "./AdminUI";

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Опубликованы" },
  { value: "rejected", label: "Отклонены" },
  { value: "sold", label: "Продано" },
  { value: "archived", label: "Сняты" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Все категории" },
  ...HOME_CATEGORIES.map((cat) => ({ value: cat.slug, label: cat.title })),
];

function adTitle(ad) {
  return ad?.title || "Без названия";
}

export default function AdminListingsSection({ token }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [catFilter, setCatFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminListings(token, {
        status: statusFilter,
        q: query.trim(),
        cat: catFilter === "all" ? "" : catFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Не удалось загрузить объявления");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, statusFilter, query, catFilter, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [query, statusFilter, catFilter]);

  const filtersActive =
    Boolean(query) || statusFilter !== "all" || catFilter !== "all";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setCatFilter("all");
  };

  const removeListing = async (ad) => {
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
      setItems((prev) => prev.filter((item) => String(getId(item)) !== String(id)));
      showToast(t("admin.toastListingDeleted"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось удалить объявление", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const archiveListing = async (ad) => {
    const id = getId(ad);

    const ok = await confirm({
      title: t("admin.unpublishTitle"),
      message: t("admin.unpublishMessage", { title: adTitle(ad) }),
      confirmLabel: t("admin.unpublishConfirm"),
      tone: "danger",
    });

    if (!ok) return;

    try {
      setActionLoadingId(id);
      const updated = await api.adminSetListingStatus(token, id, "archived");
      setItems((prev) =>
        prev.map((item) => (String(getId(item)) === String(id) ? updated : item))
      );
      showToast(t("admin.toastListingArchived"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось снять объявление", "error");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <Card className="space-y-5">
      <SectionHeader
        eyebrow="Каталог объявлений"
        icon={FileText}
        title="Все объявления"
        description="Поиск, фильтры и быстрые действия по любым объявлениям."
        action={
          <Button icon={RotateCw} loading={refreshing} onClick={load}>
            Обновить
          </Button>
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <FilterBar
        gridClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        onReset={resetFilters}
        resetDisabled={!filtersActive}
      >
        <Field
          label={t("admin.searchLabel")}
          labelClassName="sr-only"
          className="xl:col-span-2"
        >
          {(props) => (
            <Input
              {...props}
              type="search"
              iconLeft={Search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: название, город, продавец"
            />
          )}
        </Field>

        <Field label={t("admin.statusLabel")} labelClassName="sr-only">
          {(props) => (
            <Select
              {...props}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          )}
        </Field>

        <Field label={t("admin.categoryLabel")} labelClassName="sr-only">
          {(props) => (
            <Select
              {...props}
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              options={CATEGORY_OPTIONS}
            />
          )}
        </Field>
      </FilterBar>

      <ResultsBar
        pager={
          <SimplePagination
            page={page}
            totalPages={items.length < PAGE_SIZE ? page : page + 1}
            onPageChange={setPage}
            disabled={refreshing}
          />
        }
      >
        Показано: {items.length}
      </ResultsBar>

      {loading ? (
        <CardListSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          bare
          icon={FileText}
          title="Объявления не найдены"
          description={t("admin.emptyFiltersHint")}
          secondaryAction={
            filtersActive ? (
              <Button onClick={resetFilters}>{t("admin.reset")}</Button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((ad) => {
            const id = getId(ad);
            const busy = actionLoadingId === id;

            return (
              <li key={id}>
                <article className="surface-panel p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <img
                      src={getListingThumb(ad)}
                      alt=""
                      loading="lazy"
                      className="h-36 w-full shrink-0 rounded-xl bg-mist-200 object-cover sm:h-20 sm:w-28"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={listingStatusTone(ad.status)}
                          label={listingStatusLabel(ad.status, t)}
                        />
                        <span className="text-xs text-ink-400">
                          {ad.cat}
                          {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold leading-snug">
                        <Link
                          to={`/ad/${id}`}
                          className="text-ink-900 line-clamp-2 hover:text-sun-700"
                        >
                          {adTitle(ad)}
                        </Link>
                      </h3>

                      <p className="mt-1 text-price text-base">
                        {formatPrice(ad.price, { emptyLabel: "—" })}
                      </p>

                      <p className="mt-1 text-xs text-ink-400 break-anywhere">
                        {ad.location || "—"} · продавец:{" "}
                        <span className="font-medium text-ink-600">
                          {ad.ownerName || ad.ownerEmail || "—"}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:w-40 sm:shrink-0 sm:flex-col">
                      <Button
                        to={`/ad/${id}`}
                        size="sm"
                        icon={ExternalLink}
                        className="flex-1 sm:flex-none"
                      >
                        Открыть
                      </Button>

                      {ad.status === "approved" && (
                        <Button
                          size="sm"
                          icon={Archive}
                          disabled={busy}
                          onClick={() => archiveListing(ad)}
                          className="flex-1 sm:flex-none"
                        >
                          Снять
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        disabled={busy}
                        onClick={() => removeListing(ad)}
                        className="flex-1 sm:flex-none"
                      >
                        Удалить
                      </Button>
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
