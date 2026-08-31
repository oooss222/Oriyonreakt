import React from "react";
import { MapPin, Crosshair, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { getCityCoordinates } from "../../data/realEstate";
import { useI18n } from "../../i18n";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildOsmEmbed(lat, lng, zoom = 14) {
  const delta = 0.02 / Math.max(1, zoom / 12);
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta * 0.7;
  const bottom = lat - delta * 0.7;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function RealEstateMapPin({ city, geo, setGeo }) {
  const { t } = useI18n();
  const cityCenter = getCityCoordinates(city);
  const lat = Number(geo?.lat ?? cityCenter.lat);
  const lng = Number(geo?.lng ?? cityCenter.lng);
  const hasPin = geo?.lat != null && geo?.lng != null;

  const apply = (nextLat, nextLng) => {
    setGeo?.({
      lat: clamp(Number(nextLat), -90, 90),
      lng: clamp(Number(nextLng), -180, 180),
    });
  };

  React.useEffect(() => {
    if (geo?.lat != null && geo?.lng != null) return;
    // Seed pin when city is known so submit always has coordinates for RE.
    setGeo?.({ lat: cityCenter.lat, lng: cityCenter.lng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const nudge = (dLat, dLng) => apply(lat + dLat, lng + dLng);

  return (
    <div className="rounded-2xl border border-ink/8 bg-mist/30 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <MapPin size={16} className="text-sun" />
            {t("listing.mapPinTitle")}
          </div>
          <p className="text-xs text-ink-400 mt-1">{t("listing.mapPinHint")}</p>
        </div>
        <button
          type="button"
          onClick={() => apply(cityCenter.lat, cityCenter.lng)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-mist"
        >
          <Crosshair size={14} />
          {t("listing.mapPinCityCenter")}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/8 bg-white aspect-[16/10]">
        <iframe
          title={t("listing.mapPinTitle")}
          src={buildOsmEmbed(lat, lng, cityCenter.zoom || 14)}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs font-medium text-ink-400">Lat</span>
          <input
            type="number"
            step="0.0001"
            value={Number.isFinite(lat) ? lat : ""}
            onChange={(e) => apply(e.target.value, lng)}
            className="listing-form-input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink-400">Lng</span>
          <input
            type="number"
            step="0.0001"
            value={Number.isFinite(lng) ? lng : ""}
            onChange={(e) => apply(lat, e.target.value)}
            className="listing-form-input mt-1"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-400 mr-1">{t("listing.mapPinNudge")}</span>
        <button type="button" className="btn p-2" onClick={() => nudge(0.002, 0)} aria-label="N">
          <ArrowUp size={14} />
        </button>
        <button type="button" className="btn p-2" onClick={() => nudge(-0.002, 0)} aria-label="S">
          <ArrowDown size={14} />
        </button>
        <button type="button" className="btn p-2" onClick={() => nudge(0, -0.002)} aria-label="W">
          <ArrowLeft size={14} />
        </button>
        <button type="button" className="btn p-2" onClick={() => nudge(0, 0.002)} aria-label="E">
          <ArrowRight size={14} />
        </button>
        {hasPin ? (
          <span className="ml-auto text-[11px] font-medium text-lagoon-700">
            {t("listing.mapPinSet")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
