import React from "react";
import { LayoutGrid, MapPin, Phone, PlusCircle, SlidersHorizontal } from "lucide-react";
import {
  Button,
  Checkbox,
  Chip,
  Field,
  Input,
  SectionCard,
  Select,
  StatusBadge,
  cn,
} from "../../ui";
import ListingGridSkeleton from "../ListingGridSkeleton";
import ProfileListingsGrid from "./ProfileListingsGrid";
import {
  LISTING_STATUSES,
  getId,
  getListingStatusMeta,
  parseListingPrice,
  summarizeListings,
} from "./profileUtils";
import { CATS } from "../../data/listingCategories";
import { useI18n } from "../../i18n";

const DEFAULT_FILTERS = {
  sort: "newest",
  statusFilter: "all",
  section: "all",
  city: "all",
  phoneFilter: "all",
  serviceFilter: "all",
  priceFrom: "",
  priceTo: "",
};

function applyFilters(items, state) {
  const from = parseListingPrice(state.priceFrom);
  const to = parseListingPrice(state.priceTo);

  const list = items.filter((ad) => {
    const status = ad.status || "pending";
    if (state.statusFilter !== "all" && status !== state.statusFilter) return false;
    if (state.section !== "all" && String(ad.cat) !== state.section) return false;

    const loc = String(ad.location || ad.city || "");
    if (state.city !== "all" && loc !== state.city) return false;

    if (state.phoneFilter !== "all" && String(ad.phone || "") !== state.phoneFilter) {
      return false;
    }

    if (state.serviceFilter === "vip" && !ad.vip) return false;
    if (state.serviceFilter === "top" && !ad.top) return false;
    if (state.serviceFilter === "bump" && !(ad.bumpedAt || ad.bumped_at)) return false;
    if (state.serviceFilter === "none" && (ad.vip || ad.top)) return false;

    const price = parseListingPrice(ad.price);
    if (from != null && (price == null || price < from)) return false;
    if (to != null && (price == null || price > to)) return false;

    return true;
  });

  return list.sort((a, b) => {
    if (state.sort === "price_asc") {
      return (parseListingPrice(a.price) || 0) - (parseListingPrice(b.price) || 0);
    }
    if (state.sort === "price_desc") {
      return (parseListingPrice(b.price) || 0) - (parseListingPrice(a.price) || 0);
    }
    if (state.sort === "views") {
      return Number(b.views || 0) - Number(a.views || 0);
    }
    const da = new Date(a.createdAt || a.created_at || 0).getTime();
    const db = new Date(b.createdAt || b.created_at || 0).getTime();
    return db - da;
  });
}

export default function MyListingsPanel({
  items,
  loading,
  canManage,
  onRemove,
  onStatusAction,
  onAppeal,
  onBulkAction,
}) {
  const { t } = useI18n();
  const [draft, setDraft] = React.useState(DEFAULT_FILTERS);
  const [applied, setApplied] = React.useState(DEFAULT_FILTERS);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());

  const setField = React.useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  React.useEffect(() => {
    const onStatus = (event) => {
      const next = event.detail || "all";
      setDraft((current) => ({ ...current, statusFilter: next }));
      setApplied((current) => ({ ...current, statusFilter: next }));
    };

    window.addEventListener("oriyon:profile-status-filter", onStatus);
    return () => window.removeEventListener("oriyon:profile-status-filter", onStatus);
  }, []);

  const stats = React.useMemo(() => summarizeListings(items), [items]);

  const cities = React.useMemo(() => {
    const set = new Set();
    items.forEach((ad) => {
      const loc = String(ad.location || ad.city || "").trim();
      if (loc) set.add(loc);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [items]);

  const phones = React.useMemo(() => {
    const set = new Set();
    items.forEach((ad) => {
      const phone = String(ad.phone || "").trim();
      if (phone) set.add(phone);
    });
    return Array.from(set);
  }, [items]);

  const filtered = React.useMemo(() => applyFilters(items, applied), [items, applied]);
  const draftCount = React.useMemo(() => applyFilters(items, draft).length, [items, draft]);

  const toggleSelect = React.useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const handleBulk = React.useCallback(
    async (action) => {
      const ids = Array.from(selectedIds);
      if (!ids.length) return;
      await onBulkAction?.(action, ids);
      clearSelection();
    },
    [selectedIds, onBulkAction, clearSelection]
  );

  const statusRows = [
    { key: "all", label: t("profile.allStatuses"), count: stats.total },
    ...LISTING_STATUSES.map((status) => ({
      key: status,
      ...getListingStatusMeta(status, t),
      count: stats[status],
    })),
  ];

  const serviceChips = [
    { key: "vip", label: "VIP", count: stats.vip },
    { key: "top", label: "TOP", count: stats.top },
    { key: "bump", label: t("profile.filterBump"), count: stats.bump },
    { key: "none", label: t("profile.filterNoServices"), count: stats.none },
  ];

  const selectedCount = selectedIds.size;
  const visibleIds = filtered.map((ad) => String(getId(ad)));
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  return (
    <SectionCard
      title={t("profile.myListings")}
      description={t("profile.totalCount", { count: items.length })}
      icon={LayoutGrid}
      action={
        <Button variant="primary" to="/add" icon={PlusCircle}>
          <span className="hidden sm:inline">{t("profile.postListing")}</span>
          <span className="sm:hidden">{t("profile.postListingShort")}</span>
        </Button>
      }
    >
      {loading ? (
        <ListingGridSkeleton
          count={6}
          columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[264px_minmax(0,1fr)]">
          <aside className="surface-muted space-y-4 p-4 lg:sticky lg:top-20">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <SlidersHorizontal size={16} className="text-ink-400" aria-hidden="true" />
              {t("profile.filters")}
            </h3>

            <Field label={t("profile.sort")}>
              {(field) => (
                <Select
                  {...field}
                  value={draft.sort}
                  onChange={(e) => setField("sort", e.target.value)}
                  className="bg-white"
                >
                  <option value="newest">{t("profile.sortNewest")}</option>
                  <option value="views">{t("profile.sortViews")}</option>
                  <option value="price_asc">{t("profile.sortPriceAsc")}</option>
                  <option value="price_desc">{t("profile.sortPriceDesc")}</option>
                </Select>
              )}
            </Field>

            <div role="group" aria-label={t("profile.filterStatus")}>
              <p className="field-label">{t("profile.filterStatus")}</p>
              <div className="space-y-1">
                {statusRows.map((row) => {
                  const active = draft.statusFilter === row.key;

                  return (
                    <button
                      key={row.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setField("statusFilter", active ? "all" : row.key)
                      }
                      className={cn(
                        "flex min-h-[2.75rem] w-full items-center gap-2 rounded-xl px-2.5 text-sm transition-colors",
                        active
                          ? "bg-white font-semibold text-ink-900 shadow-xs"
                          : "text-ink-600 hover:bg-white"
                      )}
                    >
                      <span className="flex-1 text-left">
                        {row.tone ? (
                          <StatusBadge tone={row.tone} label={row.label} />
                        ) : (
                          row.label
                        )}
                      </span>
                      <span className="tabular-nums text-ink-400">{row.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label={t("profile.filterSection")}>
              {(field) => (
                <Select
                  {...field}
                  value={draft.section}
                  onChange={(e) => setField("section", e.target.value)}
                  className="bg-white"
                >
                  <option value="all">{t("profile.allSections")}</option>
                  {Object.entries(CATS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.title}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label={t("profile.filterCity")}>
              {(field) => (
                <div className="relative">
                  <MapPin
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <Select
                    {...field}
                    value={draft.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className="bg-white pl-9"
                  >
                    <option value="all">{t("profile.allCities")}</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </Field>

            <Field label={t("profile.filterPhone")}>
              {(field) => (
                <div className="relative">
                  <Phone
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <Select
                    {...field}
                    value={draft.phoneFilter}
                    onChange={(e) => setField("phoneFilter", e.target.value)}
                    className="bg-white pl-9"
                  >
                    <option value="all">{t("profile.anyPhone")}</option>
                    {phones.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </Field>

            <div role="group" aria-label={t("profile.paidServices")}>
              <p className="field-label">{t("profile.paidServices")}</p>
              <div className="flex flex-wrap gap-1.5">
                {serviceChips.map((chip) => {
                  const active = draft.serviceFilter === chip.key;

                  return (
                    <Chip
                      key={chip.key}
                      tone="sun"
                      active={active}
                      count={chip.count}
                      onClick={() =>
                        setField("serviceFilter", active ? "all" : chip.key)
                      }
                    >
                      {chip.label}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <fieldset>
              <legend className="field-label">{t("profile.filterPrice")}</legend>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={draft.priceFrom}
                  onChange={(e) => setField("priceFrom", e.target.value)}
                  placeholder={t("profile.priceFrom")}
                  aria-label={t("profile.priceFromLabel")}
                  inputMode="numeric"
                />
                <Input
                  value={draft.priceTo}
                  onChange={(e) => setField("priceTo", e.target.value)}
                  placeholder={t("profile.priceTo")}
                  aria-label={t("profile.priceToLabel")}
                  inputMode="numeric"
                />
              </div>
            </fieldset>

            {canManage && (
              <Checkbox
                label={t("profile.selectionMode")}
                checked={selectMode}
                onChange={(e) => {
                  setSelectMode(e.target.checked);
                  setSelectedIds(new Set());
                }}
              />
            )}

            <Button variant="accent" block size="lg" onClick={() => setApplied(draft)}>
              {t("profile.showAds", { count: draftCount })}
            </Button>
          </aside>

          <div className="min-w-0 space-y-4">
            {selectMode && (
              <div className="sticky top-2 z-20 rounded-2xl border border-ink-200 bg-white p-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="mr-auto text-sm font-semibold text-ink-800"
                    aria-live="polite"
                  >
                    {t("profile.selected", { count: selectedCount })}
                  </p>

                  <Button
                    size="sm"
                    onClick={() =>
                      setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleIds))
                    }
                  >
                    {allVisibleSelected ? t("profile.deselectAll") : t("profile.selectAll")}
                  </Button>
                </div>

                {selectedCount > 0 && (
                  <div
                    className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
                    role="group"
                    aria-label={t("profile.bulkActions")}
                  >
                    <Button
                      className="min-h-[2.75rem]"
                      onClick={() => handleBulk("sold")}
                    >
                      {t("profile.bulkMarkSold")}
                    </Button>
                    <Button
                      className="min-h-[2.75rem]"
                      onClick={() => handleBulk("archive")}
                    >
                      {t("profile.bulkArchive")}
                    </Button>
                    <Button
                      variant="danger"
                      className="min-h-[2.75rem]"
                      onClick={() => handleBulk("delete")}
                    >
                      {t("profile.bulkDelete")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-[2.75rem]"
                      onClick={clearSelection}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <ProfileListingsGrid
              items={filtered}
              tab="my"
              canManage={canManage}
              onRemove={onRemove}
              onStatusAction={onStatusAction}
              onAppeal={onAppeal}
              selectable={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
