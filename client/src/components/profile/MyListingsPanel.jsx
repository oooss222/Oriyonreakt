import React from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  SlidersHorizontal,
  MapPin,
  Phone,
} from "lucide-react";
import ListingGridSkeleton from "../ListingGridSkeleton";
import ProfileListingsGrid from "./ProfileListingsGrid";
import { getId, parseListingPrice } from "./profileUtils";
import { CATS } from "../../data/listingCategories";
import { useI18n } from "../../i18n";

const STATUS_DOTS = {
  pending: "bg-amber-400",
  rejected: "bg-red-500",
  sold: "bg-slate-800",
  archived: "bg-slate-400",
  approved: "bg-emerald-500",
};

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
  const [sort, setSort] = React.useState("newest");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [section, setSection] = React.useState("all");
  const [city, setCity] = React.useState("all");
  const [phoneFilter, setPhoneFilter] = React.useState("all");
  const [serviceFilter, setServiceFilter] = React.useState("all");
  const [priceFrom, setPriceFrom] = React.useState("");
  const [priceTo, setPriceTo] = React.useState("");
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const [applied, setApplied] = React.useState({
    sort: "newest",
    statusFilter: "all",
    section: "all",
    city: "all",
    phoneFilter: "all",
    serviceFilter: "all",
    priceFrom: "",
    priceTo: "",
  });

  const stats = React.useMemo(() => {
    return items.reduce(
      (acc, ad) => {
        const status = ad.status || "pending";
        acc.total += 1;
        acc[status] = (acc[status] || 0) + 1;
        if (ad.vip) acc.vip += 1;
        if (ad.top) acc.top += 1;
        if (ad.bumpedAt || ad.bumped_at) acc.bump += 1;
        if (!ad.vip && !ad.top) acc.none += 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        sold: 0,
        archived: 0,
        vip: 0,
        top: 0,
        bump: 0,
        none: 0,
      }
    );
  }, [items]);

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

  const filtered = React.useMemo(() => {
    const from = parseListingPrice(applied.priceFrom);
    const to = parseListingPrice(applied.priceTo);

    let list = items.filter((ad) => {
      const status = ad.status || "pending";
      if (applied.statusFilter !== "all" && status !== applied.statusFilter) return false;
      if (applied.section !== "all" && String(ad.cat) !== applied.section) return false;

      const loc = String(ad.location || ad.city || "");
      if (applied.city !== "all" && loc !== applied.city) return false;

      if (applied.phoneFilter !== "all" && String(ad.phone || "") !== applied.phoneFilter) {
        return false;
      }

      if (applied.serviceFilter === "vip" && !ad.vip) return false;
      if (applied.serviceFilter === "top" && !ad.top) return false;
      if (applied.serviceFilter === "bump" && !(ad.bumpedAt || ad.bumped_at)) return false;
      if (applied.serviceFilter === "none" && (ad.vip || ad.top)) return false;

      const price = parseListingPrice(ad.price);
      if (from != null && (price == null || price < from)) return false;
      if (to != null && (price == null || price > to)) return false;

      return true;
    });

    list = [...list].sort((a, b) => {
      if (applied.sort === "price_asc") {
        return (parseListingPrice(a.price) || 0) - (parseListingPrice(b.price) || 0);
      }
      if (applied.sort === "price_desc") {
        return (parseListingPrice(b.price) || 0) - (parseListingPrice(a.price) || 0);
      }
      if (applied.sort === "views") {
        return Number(b.views || 0) - Number(a.views || 0);
      }
      const da = new Date(a.createdAt || a.created_at || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || 0).getTime();
      return db - da;
    });

    return list;
  }, [items, applied]);

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

  const applyFilters = () => {
    setApplied({
      sort,
      statusFilter,
      section,
      city,
      phoneFilter,
      serviceFilter,
      priceFrom,
      priceTo,
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <ListingGridSkeleton />
      </div>
    );
  }

  const statusRows = [
    ["pending", t("profile.statsPending"), stats.pending],
    ["rejected", t("profile.statsRejected"), stats.rejected],
    ["sold", t("profile.statusSold"), stats.sold],
    ["archived", t("profile.statusArchived"), stats.archived],
  ];

  const serviceChips = [
    ["vip", "VIP", stats.vip],
    ["top", "TOP", stats.top],
    ["bump", t("profile.filterBump"), stats.bump],
    ["none", t("profile.filterNoServices"), stats.none],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t("profile.myListings")}</h2>
        <Link
          to="/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-semibold text-white hover:bg-sun-600 transition shadow-sm"
        >
          <PlusCircle size={18} />
          {t("profile.postListing")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">
        <aside className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <h3 className="font-bold text-slate-900">{t("profile.filters")}</h3>
          </div>

          <label className="block">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              {t("profile.sort")}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mobile-control w-full"
            >
              <option value="newest">{t("profile.sortNewest")}</option>
              <option value="views">{t("profile.sortViews")}</option>
              <option value="price_asc">{t("profile.sortPriceAsc")}</option>
              <option value="price_desc">{t("profile.sortPriceDesc")}</option>
            </select>
          </label>

          <div className="space-y-1.5">
            {statusRows.map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setStatusFilter((prev) => (prev === key ? "all" : key))
                }
                className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition ${
                  statusFilter === key
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${STATUS_DOTS[key]}`} />
                <span className="flex-1 text-left">{label}</span>
                <span className="tabular-nums text-slate-400">{count}</span>
              </button>
            ))}
          </div>

          <label className="block">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              {t("profile.filterSection")}
            </div>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="mobile-control w-full"
            >
              <option value="all">{t("profile.allSections")}</option>
              {Object.entries(CATS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              {t("profile.filterCity")}
            </div>
            <div className="relative">
              <MapPin
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mobile-control w-full pl-8"
              >
                <option value="all">{t("profile.allCities")}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              {t("profile.filterPhone")}
            </div>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="mobile-control w-full pl-8"
              >
                <option value="all">{t("profile.anyPhone")}</option>
                {phones.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
              {t("profile.paidServices")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {serviceChips.map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setServiceFilter((prev) => (prev === key ? "all" : key))
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    serviceFilter === key
                      ? "border-sun bg-sun/10 text-sun"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label} {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
              {t("profile.filterPrice")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                placeholder={t("profile.priceFrom")}
                className="mobile-control"
                inputMode="numeric"
              />
              <input
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                placeholder={t("profile.priceTo")}
                className="mobile-control"
                inputMode="numeric"
              />
            </div>
          </div>

          {canManage && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectMode}
                onChange={(e) => {
                  setSelectMode(e.target.checked);
                  setSelectedIds(new Set());
                }}
                className="h-4 w-4 accent-sun"
              />
              {t("profile.selectionMode")}
            </label>
          )}

          <button
            type="button"
            onClick={applyFilters}
            className="w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-semibold hover:bg-slate-800 transition"
          >
            {t("profile.showAds", { count: filtered.length })}
          </button>
        </aside>

        <div className="min-w-0 space-y-4">
          {selectMode && selectedIds.size > 0 && (
            <div className="sticky top-2 z-20 rounded-2xl border bg-white shadow-lg p-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-700 mr-auto">
                {t("profile.selected", { count: selectedIds.size })}
              </span>
              <button
                type="button"
                className="mobile-btn border hover:bg-slate-50"
                onClick={() => handleBulk("sold")}
              >
                {t("profile.statusSold")}
              </button>
              <button
                type="button"
                className="mobile-btn border hover:bg-slate-50"
                onClick={() => handleBulk("archive")}
              >
                {t("profile.statusArchived")}
              </button>
              <button
                type="button"
                className="mobile-btn border text-red-600 hover:bg-red-50"
                onClick={() => handleBulk("delete")}
              >
                {t("a11y.delete")}
              </button>
              <button type="button" className="mobile-btn border" onClick={clearSelection}>
                {t("common.cancel")}
              </button>
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
    </div>
  );
}
