import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { api } from "../lib/api";
import { REAL_ESTATE_CAT, REAL_ESTATE_PRICE_PRESETS, REAL_ESTATE_RENT_PRESETS } from "../data/realEstate";
import { getRealEstateFilterGrid } from "../data/realEstateFilters";
import { getDistrictsForCity } from "../data/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { buildRealEstateListingUrl } from "../lib/realEstate";

const AREA_PRESETS = ["20", "30", "40", "50", "60", "70", "80", "100", "120", "150"];

const CEILING_HEIGHTS = ["от 2.5 м", "от 2.7 м", "от 3 м", "от 3.5 м", "от 4 м"];

function buildDraft({
  dealType = "",
  city = "",
  subcategory = "",
  rooms = "",
  priceFrom = "",
  priceTo = "",
  extra = {},
}) {
  const specs = { ...(extra.specs || {}) };

  if (dealType) specs["Тип сделки"] = dealType;
  if (rooms) specs["Комнат"] = rooms;

  return {
    location: city,
    subcategory,
    priceFrom: getPriceDigits(priceFrom),
    priceTo: getPriceDigits(priceTo),
    priceCurrency: extra.priceCurrency || "с.",
    areaFrom: extra.areaFrom || "",
    areaTo: extra.areaTo || "",
    floorFrom: extra.floorFrom || "",
    floorTo: extra.floorTo || "",
    floorNotFirst: Boolean(extra.floorNotFirst),
    floorNotLast: Boolean(extra.floorNotLast),
    sellerType: extra.sellerType || "",
    specs,
  };
}

function buildCountQuery(draft) {
  const params = {
    cat: REAL_ESTATE_CAT,
    sort: "new",
  };

  if (draft.location) params.location = draft.location;
  if (draft.subcategory) params.subcategory = draft.subcategory;
  if (draft.priceFrom) params.priceFrom = draft.priceFrom;
  if (draft.priceTo) params.priceTo = draft.priceTo;
  if (draft.areaFrom) params.areaFrom = draft.areaFrom;
  if (draft.areaTo) params.areaTo = draft.areaTo;
  if (draft.floorFrom) params.floorFrom = draft.floorFrom;
  if (draft.floorTo) params.floorTo = draft.floorTo;
  if (draft.floorNotFirst) params.floorNotFirst = "1";
  if (draft.floorNotLast) params.floorNotLast = "1";
  if (draft.sellerType) params.sellerType = draft.sellerType;

  const specEntries = Object.entries(draft.specs || {}).filter(
    ([name, value]) => String(name).trim() && String(value).trim()
  );

  if (specEntries.length) {
    params.specs = JSON.stringify(Object.fromEntries(specEntries));
  }

  return params;
}

function FilterRow({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-2 sm:gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="text-sm font-medium text-slate-700 sm:pt-2.5">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PillGroup({ value, options, onChange, anyLabel = "Любой" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`h-10 px-3 rounded-full border text-sm font-medium transition ${
          !value
            ? "border-lagoon bg-lagoon-50 text-lagoon-800"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {anyLabel}
      </button>

      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-10 px-3 rounded-full border text-sm font-medium transition ${
            value === option
              ? "border-lagoon bg-lagoon-50 text-lagoon-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function AreaRangeSelects({ from, to, onFromChange, onToChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="mobile-control"
      >
        <option value="">Любая</option>
        {AREA_PRESETS.map((item) => (
          <option key={`from-${item}`} value={item}>
            от {item} м²
          </option>
        ))}
      </select>

      <select
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="mobile-control"
      >
        <option value="">Любая</option>
        {AREA_PRESETS.map((item) => (
          <option key={`to-${item}`} value={item}>
            до {item} м²
          </option>
        ))}
      </select>
    </div>
  );
}

export default function RealEstateMoreFiltersModal({
  open,
  onClose,
  dealType = "",
  city = "",
  subcategory = "",
  rooms = "",
  priceFrom = "",
  priceTo = "",
  onNavigate,
}) {
  const [draft, setDraft] = React.useState(() =>
    buildDraft({ dealType, city, subcategory, rooms, priceFrom, priceTo })
  );
  const [previewTotal, setPreviewTotal] = React.useState(0);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const grid = React.useMemo(
    () => getRealEstateFilterGrid(subcategory),
    [subcategory]
  );

  const pricePresets =
    dealType === "Снять" || dealType === "Посуточно"
      ? REAL_ESTATE_RENT_PRESETS
      : REAL_ESTATE_PRICE_PRESETS;

  const specField = (key) =>
    grid.more?.find((field) => field.type === "spec" && field.specKey === key) ||
    grid.rows?.flat().find((field) => field?.type === "spec" && field?.specKey === key);

  const balconyOptions = specField("Балкон")?.options || [
    "Есть",
    "Нет",
    "Лоджия",
    "2 балкона",
  ];
  const bathroomOptions = specField("Санузел")?.options || [
    "Раздельный",
    "Совмещённый",
    "2 санузла",
  ];
  const repairOptions = specField("Ремонт")?.options || [];
  const conditionOptions = specField("Состояние")?.options || [];
  const furnitureOptions = specField("Мебель")?.options || [];
  const parkingOptions = specField("Парковка")?.options || [];
  const houseTypeOptions = specField("Тип дома")?.options || [];

  const districts = getDistrictsForCity(draft.location || city || "Душанбе");

  React.useEffect(() => {
    if (!open) return;

    setDraft(buildDraft({ dealType, city, subcategory, rooms, priceFrom, priceTo }));
  }, [open, dealType, city, subcategory, rooms, priceFrom, priceTo]);

  React.useEffect(() => {
    if (!open) return undefined;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const countData = await api.listingCount(buildCountQuery(draft));

        if (active) {
          setPreviewTotal(Number(countData?.total || 0));
        }
      } catch {
        if (active) {
          setPreviewTotal(0);
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft, open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const setSpec = (key, value) => {
    setDraft((current) => {
      const nextSpecs = { ...current.specs };

      if (value) {
        nextSpecs[key] = value;
      } else {
        delete nextSpecs[key];
      }

      return { ...current, specs: nextSpecs };
    });
  };

  const reset = () => {
    setDraft(
      buildDraft({
        dealType,
        city,
        subcategory,
        rooms,
        priceFrom: "",
        priceTo: "",
      })
    );
  };

  const submit = () => {
    const url = buildRealEstateListingUrl({
      dealType,
      subcategory: draft.subcategory || subcategory,
      city: draft.location || city,
      rooms,
      priceFrom: draft.priceFrom,
      priceTo: draft.priceTo,
      specs: draft.specs,
      areaFrom: draft.areaFrom,
      areaTo: draft.areaTo,
      floorFrom: draft.floorFrom,
      floorTo: draft.floorTo,
      floorNotFirst: draft.floorNotFirst,
      floorNotLast: draft.floorNotLast,
      sellerType: draft.sellerType,
    });

    if (onNavigate) {
      onNavigate(url, draft);
    }

    onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-lg font-bold text-slate-900">Ещё фильтры</h2>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
          <FilterRow label="Цена до">
            <input
              value={draft.priceTo ? formatPriceInput(draft.priceTo) : ""}
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  priceTo: getPriceDigits(e.target.value),
                }))
              }
              placeholder="до"
              className="mobile-control"
            />
          </FilterRow>

          <FilterRow label="Быстрый выбор цены">
            <select
              defaultValue=""
              onChange={(e) => {
                const preset = pricePresets[Number(e.target.value)];
                if (!preset) return;

                setDraft((current) => ({
                  ...current,
                  priceFrom: preset.from ? String(preset.from) : current.priceFrom,
                  priceTo: preset.to ? String(preset.to) : "",
                }));
              }}
              className="mobile-control"
            >
              <option value="" disabled>
                Выберите диапазон
              </option>
              {pricePresets.map((preset, idx) => (
                <option key={preset.label} value={idx}>
                  {preset.label}
                </option>
              ))}
            </select>
          </FilterRow>

          <FilterRow label="Продавец">
            <PillGroup
              anyLabel="Любой"
              value={
                draft.sellerType === "company" ? "Агент/Застройщик" : ""
              }
              options={["Агент/Застройщик"]}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  sellerType: value ? "company" : "",
                }))
              }
            />
          </FilterRow>

          <FilterRow label="Общая площадь">
            <AreaRangeSelects
              from={draft.areaFrom}
              to={draft.areaTo}
              onFromChange={(value) =>
                setDraft((current) => ({ ...current, areaFrom: value }))
              }
              onToChange={(value) =>
                setDraft((current) => ({ ...current, areaTo: value }))
              }
            />
          </FilterRow>

          <FilterRow label="Этаж">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={draft.floorFrom}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    floorFrom: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                placeholder="от"
                className="mobile-control"
              />
              <input
                value={draft.floorTo}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    floorTo: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                placeholder="до"
                className="mobile-control"
              />
            </div>
          </FilterRow>

          <FilterRow label="Этажность">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    floorNotFirst: !current.floorNotFirst,
                  }))
                }
                className={`mobile-btn border ${
                  draft.floorNotFirst
                    ? "border-lagoon bg-lagoon-50 text-lagoon-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Не первый
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    floorNotLast: !current.floorNotLast,
                  }))
                }
                className={`mobile-btn border ${
                  draft.floorNotLast
                    ? "border-lagoon bg-lagoon-50 text-lagoon-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Не последний
              </button>
            </div>
          </FilterRow>

          {districts.length > 0 && (
            <FilterRow label="Район">
              <select
                value={draft.specs?.["Район"] || ""}
                onChange={(e) => setSpec("Район", e.target.value)}
                className="mobile-control"
              >
                <option value="">Любой</option>
                {districts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterRow>
          )}

          {houseTypeOptions.length > 0 && (
            <FilterRow label="Тип дома">
              <PillGroup
                value={draft.specs?.["Тип дома"] || ""}
                options={houseTypeOptions}
                onChange={(value) => setSpec("Тип дома", value)}
              />
            </FilterRow>
          )}

          {repairOptions.length > 0 && (
            <FilterRow label="Ремонт">
              <PillGroup
                value={draft.specs?.["Ремонт"] || ""}
                options={repairOptions}
                onChange={(value) => setSpec("Ремонт", value)}
              />
            </FilterRow>
          )}

          {conditionOptions.length > 0 && (
            <FilterRow label="Состояние">
              <PillGroup
                value={draft.specs?.["Состояние"] || ""}
                options={conditionOptions}
                onChange={(value) => setSpec("Состояние", value)}
              />
            </FilterRow>
          )}

          {furnitureOptions.length > 0 && (
            <FilterRow label="Мебель">
              <PillGroup
                value={draft.specs?.["Мебель"] || ""}
                options={furnitureOptions}
                onChange={(value) => setSpec("Мебель", value)}
              />
            </FilterRow>
          )}

          <FilterRow label="Санузел">
            <PillGroup
              value={draft.specs?.["Санузел"] || ""}
              options={bathroomOptions}
              onChange={(value) => setSpec("Санузел", value)}
            />
          </FilterRow>

          <FilterRow label="Балкон">
            <PillGroup
              value={draft.specs?.["Балкон"] || ""}
              options={balconyOptions}
              onChange={(value) => setSpec("Балкон", value)}
            />
          </FilterRow>

          {parkingOptions.length > 0 && (
            <FilterRow label="Парковка">
              <PillGroup
                value={draft.specs?.["Парковка"] || ""}
                options={parkingOptions}
                onChange={(value) => setSpec("Парковка", value)}
              />
            </FilterRow>
          )}

          <FilterRow label="Высота потолков">
            <PillGroup
              value={draft.specs?.["Высота потолков"] || ""}
              options={CEILING_HEIGHTS}
              onChange={(value) => setSpec("Высота потолков", value)}
            />
          </FilterRow>
        </div>

        <div className="shrink-0 border-t bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition"
          >
            <X size={15} />
            Сбросить значения
          </button>

          <button
            type="button"
            onClick={submit}
            className="mobile-btn bg-lagoon text-white hover:bg-lagoon-700 font-semibold sm:min-w-[14rem]"
          >
            {previewLoading
              ? "Показать объявления…"
              : `Показать объявления (${previewTotal.toLocaleString("ru-RU")})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
