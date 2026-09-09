import React from "react";
import {
  BedDouble,
  Maximize2,
  Building2,
  MapPin,
  Layers,
  Hammer,
  Home,
} from "lucide-react";
import { enrichRealEstateListing, getSpecValue, isRealEstateListing } from "../lib/realEstate";
import RealEstateDailyFeatures from "./realestate/RealEstateDailyFeatures";
import RealEstateRentFeatures from "./realestate/RealEstateRentFeatures";
import { useI18n } from "../i18n";

function HighlightTile({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <div className="flex min-h-[88px] flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        <Icon size={14} className="shrink-0 text-sun-500" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-lg font-bold leading-tight text-ink-900">{value}</dd>
    </div>
  );
}

export default function RealEstateHighlights({ ad }) {
  const { t } = useI18n();

  if (!isRealEstateListing(ad)) return null;

  const listing = enrichRealEstateListing(ad);
  const summary = listing.realEstateSummary || {};
  const specs = Array.isArray(ad.specs) ? ad.specs : [];

  const repair = getSpecValue(specs, "Ремонт");
  const houseType = getSpecValue(specs, "Тип дома");
  const year = getSpecValue(specs, "Год постройки");
  const deal = summary.deal;
  const isDaily = deal === "Посуточно";
  const isRent = deal === "Снять";

  const areaLabel = summary.area
    ? summary.area.includes("м") || summary.area.includes("сот")
      ? summary.area
      : `${summary.area} м²`
    : "";

  const floorLabel =
    summary.floor && summary.floorsTotal
      ? t("realestate.floorOfTotal", { floor: summary.floor, total: summary.floorsTotal })
      : summary.floor
      ? t("realestate.floorSingle", { floor: summary.floor })
      : "";

  return (
    <section className="card space-y-4 rounded-3xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-900">{t("realestate.aboutObject")}</h2>
          {deal && (
            <span className="chip chip-active mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold">
              {deal}
            </span>
          )}
        </div>

        {summary.pricePerSqm && (
          <div className="rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3 text-right">
            <div className="text-xs font-semibold text-sun-700">{t("filter.pricePerSqm")}</div>
            <div className="font-display text-xl font-extrabold text-sun-900">
              {summary.pricePerSqm}
            </div>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HighlightTile icon={BedDouble} label={t("realestate.rooms")} value={summary.rooms} />
        <HighlightTile icon={Maximize2} label={t("filter.area")} value={areaLabel} />
        <HighlightTile icon={Layers} label={t("filter.floor")} value={floorLabel} />
        <HighlightTile
          icon={MapPin}
          label={t("realestate.district")}
          value={summary.district || listing.location}
        />
        <HighlightTile icon={Building2} label={t("realestate.houseType")} value={houseType} />
        <HighlightTile icon={Hammer} label={t("realestate.repair")} value={repair} />
        <HighlightTile icon={Home} label={t("realestate.buildYear")} value={year} />
        <HighlightTile
          icon={Building2}
          label={t("filter.category")}
          value={listing.subcategory}
        />
      </dl>

      {isDaily ? (
        <RealEstateDailyFeatures specs={specs} />
      ) : null}

      {isRent ? (
        <RealEstateRentFeatures specs={specs} />
      ) : null}
    </section>
  );
}
