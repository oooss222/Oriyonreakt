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

const FIELD_LABEL = "text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block";
const FIELD_CONTROL =
  "w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-sun/25 focus:border-sun/40 appearance-none";

function formatHeroPriceSummary(from, to, currency = "с.") {
  const fromLabel = from ? formatPriceInput(from) : "";
  const toLabel = to ? formatPriceInput(to) : "";

  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel} ${currency}`;
  if (fromLabel) return `от ${fromLabel} ${currency}`;
  if (toLabel) return `до ${toLabel} ${currency}`;
  return "";
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

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative block min-w-0">
      <span className={FIELD_LABEL}>Цена</span>

      <button
        type="button"
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
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl text-slate-900">
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
              className="w-1/2 min-w-0 px-3 text-sm text-slate-900 outline-none border-r border-slate-200 placeholder:text-slate-400 bg-white"
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
              className="w-1/2 min-w-0 px-3 text-sm text-slate-900 outline-none border-r border-slate-200 placeholder:text-slate-400 bg-white"
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
          <div className="relative mb-6 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sun-300 mb-2">
              Oriyon · Недвижимость
            </p>
            <h1 className="font-display text-3xl md:text-[2.35rem] font-extrabold leading-tight">
              Недвижимость в {city || "Таджикистане"}
            </h1>
            {totalCount > 0 && (
              <p className="mt-2 text-sm text-white/70">
                {totalCount.toLocaleString("ru-RU")} активных объявлений · квартиры, дома, участки
              </p>
            )}
          </div>
        )}

        <div className="relative rounded-2xl bg-white/95 backdrop-blur-sm p-4 md:p-5 text-slate-900 shadow-xl">
          <div className="inline-flex w-full sm:w-auto rounded-xl border bg-slate-50 p-1 gap-1 mb-4">
            {DEAL_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setDealType(item.value)}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  dealType === item.value
                    ? "bg-sun text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
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

              <HeroSelect label="Комнат" value={rooms} onChange={(e) => setRooms(e.target.value)}>
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

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <button
                type="submit"
                className="mobile-btn bg-sun text-white hover:bg-sun-600 font-bold shadow-sm"
              >
                <Search size={18} />
                Показать объявления
              </button>

              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="mobile-btn border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
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
