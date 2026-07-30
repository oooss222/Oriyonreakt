import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import RealEstateMoreFiltersModal from "./RealEstateMoreFiltersModal";
import {
  DEAL_TYPES,
  ROOM_OPTIONS,
  REAL_ESTATE_CITIES,
  SUBCATEGORY_META,
} from "../data/realEstate";
import { buildRealEstateListingUrl } from "../lib/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";

function formatHeroPriceSummary(from, to, currency = "с.") {
  const fromLabel = from ? formatPriceInput(from) : "";
  const toLabel = to ? formatPriceInput(to) : "";

  if (fromLabel && toLabel) {
    return `${fromLabel} – ${toLabel} ${currency}`;
  }

  if (fromLabel) {
    return `от ${fromLabel} ${currency}`;
  }

  if (toLabel) {
    return `до ${toLabel} ${currency}`;
  }

  return "";
}

function HeroPriceFilter({ priceFrom, priceTo, priceCurrency, onChange }) {
  const [open, setOpen] = React.useState(false);
  const summary = formatHeroPriceSummary(priceFrom, priceTo, priceCurrency);

  return (
    <div className="block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`w-full h-12 flex items-center justify-between gap-3 rounded-xl bg-white px-4 text-sm outline-none transition border ${
          open ? "border-lagoon/40 ring-1 ring-lagoon/20" : "border-lagoon/25 hover:border-lagoon/40"
        } ${summary ? "text-slate-900 font-medium" : "text-slate-500"}`}
      >
        <span className="truncate">{summary || "Цена"}</span>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="mt-2 flex h-11 items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white">
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
            className="w-1/2 min-w-0 px-3 text-sm outline-none border-r border-slate-200 placeholder:text-slate-400"
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
            className="w-1/2 min-w-0 px-3 text-sm outline-none border-r border-slate-200 placeholder:text-slate-400"
          />

          <div className="relative shrink-0">
            <select
              value={priceCurrency}
              onChange={(e) =>
                onChange({
                  priceFrom,
                  priceTo,
                  priceCurrency: e.target.value,
                })
              }
              className="h-full min-w-[3.5rem] appearance-none bg-white pl-2.5 pr-7 text-sm outline-none"
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
      )}
    </div>
  );
}

export default function RealEstateSearchHero({
  compact = false,
  initialDeal = "Купить",
  initialCity = "Душанбе",
  initialSubcategory = "",
  onSearch,
}) {
  const nav = useNavigate();
  const [dealType, setDealType] = React.useState(initialDeal);
  const [city, setCity] = React.useState(initialCity);
  const [subcategory, setSubcategory] = React.useState(initialSubcategory);
  const [rooms, setRooms] = React.useState("");
  const [priceFrom, setPriceFrom] = React.useState("");
  const [priceTo, setPriceTo] = React.useState("");
  const [priceCurrency, setPriceCurrency] = React.useState("с.");
  const [moreOpen, setMoreOpen] = React.useState(false);

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

    if (onSearch) {
      onSearch({ dealType, subcategory, city, rooms, priceFrom, priceTo });
    }

    nav(url);
  };

  return (
    <>
      <section
        className={`rounded-3xl border border-white/20 bg-gradient-to-br from-ink-800 via-ink-700 to-lagoon-800 text-white shadow-lift overflow-hidden ${
          compact ? "p-4 md:p-5" : "p-5 md:p-8"
        }`}
      >
        <div className={compact ? "mb-4" : "mb-6"}>
          <h1
            className={`font-display font-extrabold leading-tight ${
              compact ? "text-2xl" : "text-3xl md:text-4xl"
            }`}
          >
            Недвижимость в {city || "Таджикистане"}
          </h1>
          <p className="text-white/70 mt-2 text-sm md:text-base max-w-2xl">
            Квартиры, дома, участки и коммерция — с фильтрами как на ведущих
            площадках.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {DEAL_TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setDealType(item.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                dealType === item.value
                  ? "bg-sun text-white shadow-md"
                  : "bg-white/10 hover:bg-white/15 text-white/90"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Город</span>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-12 rounded-xl bg-white text-slate-900 pl-9 pr-8 text-sm font-medium outline-none"
                >
                  {REAL_ESTATE_CITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Тип</span>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full h-12 rounded-xl bg-white text-slate-900 px-3 text-sm font-medium outline-none"
              >
                <option value="">Все типы</option>
                {Object.keys(SUBCATEGORY_META).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Комнат</span>
              <select
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full h-12 rounded-xl bg-white text-slate-900 px-3 text-sm font-medium outline-none"
              >
                <option value="">Любое</option>
                {ROOM_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="block">
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
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-sun hover:bg-sun-600 text-white font-bold transition shadow-md"
            >
              <Search size={18} />
              Показать объявления
            </button>

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="inline-flex items-center justify-center gap-1 h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition"
            >
              Ещё фильтры
            </button>
          </div>
        </form>
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
