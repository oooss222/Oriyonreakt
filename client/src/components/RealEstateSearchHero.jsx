import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import RealEstateMoreFiltersModal from "./RealEstateMoreFiltersModal";
import {
  DEAL_TYPES,
  ROOM_OPTIONS,
  REAL_ESTATE_CITIES,
  SUBCATEGORY_META,
} from "../data/realEstate";
import { buildRealEstateListingUrl } from "../lib/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";

const FIELD_LABEL =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";
const FIELD_CONTROL =
  "h-11 w-full rounded-xl border border-slate-200/90 bg-white text-sm font-medium text-slate-900 outline-none transition focus:border-sun/50 focus:ring-2 focus:ring-sun/20 appearance-none";

function formatHeroPriceSummary(from, to, currency = "с.") {
  const fromLabel = from ? formatPriceInput(from) : "";
  const toLabel = to ? formatPriceInput(to) : "";

  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel} ${currency}`;
  if (fromLabel) return `от ${fromLabel} ${currency}`;
  if (toLabel) return `до ${toLabel} ${currency}`;
  return "";
}

function pluralAds(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "объявление";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "объявления";
  return "объявлений";
}

function HeroSelect({ label, value, onChange, children, className = "", icon: Icon }) {
  return (
    <label className="block min-w-0">
      <span className={FIELD_LABEL}>{label}</span>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <select
          value={value}
          onChange={onChange}
          className={`${FIELD_CONTROL} pr-9 ${Icon ? "pl-9" : "px-3"} ${className}`}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

function HeroPriceFilter({ priceFrom, priceTo, priceCurrency, onChange }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const summary = formatHeroPriceSummary(priceFrom, priceTo, priceCurrency);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative block min-w-0">
      <span className={FIELD_LABEL}>Цена</span>

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`${FIELD_CONTROL} flex items-center justify-between gap-3 px-3 text-left ${
          summary ? "text-slate-900" : "text-slate-500"
        }`}
      >
        <span className="truncate">{summary || "Любая"}</span>
        {open ? (
          <ChevronUp size={15} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={15} className="shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Диапазон цены"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl text-slate-900"
        >
          <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-slate-200">
            <input
              type="text"
              inputMode="numeric"
              placeholder="от"
              value={priceFrom ? formatPriceInput(priceFrom) : ""}
              onChange={(e) =>
                onChange({
                  priceFrom: getPriceDigits(e.target.value),
                  priceTo,
                  priceCurrency,
                })
              }
              className="w-1/2 min-w-0 border-r border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="до"
              value={priceTo ? formatPriceInput(priceTo) : ""}
              onChange={(e) =>
                onChange({
                  priceFrom,
                  priceTo: getPriceDigits(e.target.value),
                  priceCurrency,
                })
              }
              className="w-1/2 min-w-0 border-r border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <div className="relative shrink-0">
              <select
                value={priceCurrency}
                onChange={(e) =>
                  onChange({ priceFrom, priceTo, priceCurrency: e.target.value })
                }
                className="h-full min-w-[3.5rem] appearance-none bg-white pl-2.5 pr-7 text-sm text-slate-900 outline-none"
              >
                <option value="с.">с.</option>
                <option value="$">$</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RealEstateSearchHero({
  compact = false,
  initialDeal = "Купить",
  initialCity = "Душанбе",
  initialSubcategory = "",
  initialRooms = "",
  initialPriceFrom = "",
  initialPriceTo = "",
  totalCount = 0,
  onCityChange,
  onSearch,
}) {
  const nav = useNavigate();
  const [dealType, setDealType] = React.useState(initialDeal);
  const [city, setCity] = React.useState(initialCity);
  const [subcategory, setSubcategory] = React.useState(initialSubcategory);
  const [rooms, setRooms] = React.useState(initialRooms);
  const [priceFrom, setPriceFrom] = React.useState(initialPriceFrom);
  const [priceTo, setPriceTo] = React.useState(initialPriceTo);
  const [priceCurrency, setPriceCurrency] = React.useState("с.");
  const [moreOpen, setMoreOpen] = React.useState(false);

  React.useEffect(() => setCity(initialCity), [initialCity]);
  React.useEffect(() => setSubcategory(initialSubcategory), [initialSubcategory]);
  React.useEffect(() => setDealType(initialDeal), [initialDeal]);
  React.useEffect(() => setRooms(initialRooms), [initialRooms]);
  React.useEffect(() => setPriceFrom(initialPriceFrom), [initialPriceFrom]);
  React.useEffect(() => setPriceTo(initialPriceTo), [initialPriceTo]);

  const handleCityChange = (nextCity) => {
    setCity(nextCity);
    onCityChange?.(nextCity);
  };

  const submit = (e) => {
    e?.preventDefault?.();

    const url = buildRealEstateListingUrl({
      dealType,
      subcategory,
      city,
      rooms,
      priceFrom: getPriceDigits(priceFrom),
      priceTo: getPriceDigits(priceTo),
    });

    onSearch?.({ dealType, subcategory, city, rooms, priceFrom, priceTo });
    nav(url);
  };

  const dealLabel =
    DEAL_TYPES.find((item) => item.value === dealType)?.label?.toLowerCase() || "купить";
  const submitLabel =
    totalCount > 0
      ? `Показать ${totalCount.toLocaleString("ru-RU")} ${pluralAds(totalCount)}`
      : "Показать объявления";

  const hasActiveFilters = Boolean(
    subcategory || rooms || priceFrom || priceTo || dealType !== "Купить"
  );

  return (
    <>
      <section
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-900 via-ink-800 to-lagoon-900 text-white shadow-lift ${
          compact ? "p-4 md:p-5" : "p-5 md:p-8"
        }`}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sun/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-lagoon/20 blur-3xl"
          aria-hidden="true"
        />

        {!compact && (
          <div className="relative mb-5 md:mb-6 max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sun-300">
              Oriyon · Недвижимость
            </p>
            <h1 className="font-display text-3xl md:text-[2.35rem] font-extrabold leading-tight">
              {dealLabel.charAt(0).toUpperCase() + dealLabel.slice(1)} в {city || "Таджикистане"}
            </h1>
            {totalCount > 0 && (
              <p className="mt-2 text-sm text-white/70">
                {totalCount.toLocaleString("ru-RU")} активных объявлений · квартиры, дома, участки
              </p>
            )}
          </div>
        )}

        <div className="relative rounded-2xl bg-white p-4 md:p-5 text-slate-900 shadow-xl ring-1 ring-slate-900/5">
          <div
            role="tablist"
            aria-label="Тип сделки"
            className="mb-4 inline-flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 sm:w-auto"
          >
            {DEAL_TYPES.map((item) => {
              const active = dealType === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDealType(item.value)}
                  className={`min-h-[42px] flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none sm:min-w-[6.5rem] ${
                    active
                      ? "bg-sun text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroSelect
                label="Город"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                icon={MapPin}
              >
                {REAL_ESTATE_CITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </HeroSelect>

              <HeroSelect
                label="Тип"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
              >
                <option value="">Все типы</option>
                {Object.keys(SUBCATEGORY_META).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </HeroSelect>

              <HeroSelect
                label="Комнаты"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
              >
                <option value="">Любое</option>
                {ROOM_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </HeroSelect>

              <HeroPriceFilter
                priceFrom={priceFrom}
                priceTo={priceTo}
                priceCurrency={priceCurrency}
                onChange={({ priceFrom: nextFrom, priceTo: nextTo, priceCurrency: nextCurrency }) => {
                  setPriceFrom(nextFrom);
                  setPriceTo(nextTo);
                  setPriceCurrency(nextCurrency);
                }}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-stretch">
              <button
                type="submit"
                className="mobile-btn min-h-[46px] flex-1 bg-sun font-bold text-white shadow-sm hover:bg-sun-600"
              >
                <Search size={18} />
                {submitLabel}
              </button>

              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={`mobile-btn min-h-[46px] border bg-white font-semibold text-slate-700 hover:bg-slate-50 sm:min-w-[10.5rem] ${
                  hasActiveFilters
                    ? "border-sun/40 ring-1 ring-sun/15"
                    : "border-slate-200"
                }`}
              >
                <SlidersHorizontal size={18} />
                Ещё фильтры
              </button>
            </div>
          </form>
        </div>
      </section>

      <RealEstateMoreFiltersModal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        dealType={dealType}
        city={city}
        subcategory={subcategory}
        rooms={rooms}
        priceFrom={priceFrom}
        priceTo={priceTo}
        onNavigate={(url) => nav(url)}
      />
    </>
  );
}
