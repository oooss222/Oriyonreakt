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

function HighlightTile({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border bg-white p-4 flex flex-col gap-2 min-h-[88px]">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
        <Icon size={14} className="text-sun shrink-0" />
        {label}
      </div>
      <div className="text-lg font-bold text-slate-900 leading-tight">{value}</div>
    </div>
  );
}

export default function RealEstateHighlights({ ad }) {
  if (!isRealEstateListing(ad)) return null;

  const listing = enrichRealEstateListing(ad);
  const summary = listing.realEstateSummary || {};
  const specs = Array.isArray(ad.specs) ? ad.specs : [];

  const repair = getSpecValue(specs, "Ремонт");
  const houseType = getSpecValue(specs, "Тип дома");
  const year = getSpecValue(specs, "Год постройки");
  const deal = summary.deal;

  const areaLabel = summary.area
    ? summary.area.includes("м") || summary.area.includes("сот")
      ? summary.area
      : `${summary.area} м²`
    : "";

  const floorLabel =
    summary.floor && summary.floorsTotal
      ? `${summary.floor} / ${summary.floorsTotal} этаж`
      : summary.floor
      ? `${summary.floor} этаж`
      : "";

  return (
    <section className="card p-5 md:p-6 rounded-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Об объекте</h2>
          {deal && (
            <span className="inline-flex mt-2 px-3 py-1 rounded-full chip chip-active text-xs font-bold">
              {deal}
            </span>
          )}
        </div>

        {summary.pricePerSqm && (
          <div className="rounded-2xl bg-sun-50 border border-sun/20 px-4 py-3 text-right">
            <div className="text-xs text-sun-700 font-semibold">Цена за м²</div>
            <div className="text-xl font-extrabold text-sun-800">{summary.pricePerSqm}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HighlightTile icon={BedDouble} label="Комнат" value={summary.rooms} />
        <HighlightTile icon={Maximize2} label="Площадь" value={areaLabel} />
        <HighlightTile icon={Layers} label="Этаж" value={floorLabel} />
        <HighlightTile
          icon={MapPin}
          label="Район"
          value={summary.district || listing.location}
        />
        <HighlightTile icon={Building2} label="Тип дома" value={houseType} />
        <HighlightTile icon={Hammer} label="Ремонт" value={repair} />
        <HighlightTile icon={Home} label="Год постройки" value={year} />
        <HighlightTile
          icon={Building2}
          label="Категория"
          value={listing.subcategory}
        />
      </div>
    </section>
  );
}
