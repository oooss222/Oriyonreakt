import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown } from "lucide-react";
import {
  DEAL_TYPES,
  ROOM_OPTIONS,
  REAL_ESTATE_CITIES,
  REAL_ESTATE_PRICE_PRESETS,
  REAL_ESTATE_RENT_PRESETS,
  SUBCATEGORY_META,
} from "../data/realEstate";
import { buildRealEstateListingUrl } from "../lib/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";

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
  const [showMore, setShowMore] = React.useState(false);

  const pricePresets =
    dealType === "Снять" || dealType === "Посуточно"
      ? REAL_ESTATE_RENT_PRESETS
      : REAL_ESTATE_PRICE_PRESETS;

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
    <section
      className={`rounded-3xl border border-white/20 bg-gradient-to-br from-ink-800 via-ink-700 to-lagoon-800 text-white shadow-lift overflow-hidden ${
        compact ? "p-4 md:p-5" : "p-5 md:p-8"
      }`}
    >
      <div className={compact ? "mb-4" : "mb-6"}>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sun-100 border border-white/10 mb-3">
          Oriyon · Недвижимость №1 в Таджикистане
        </div>
        <h1 className={`font-display font-extrabold leading-tight ${compact ? "text-2xl" : "text-3xl md:text-4xl"}`}>
          Недвижимость в {city || "Таджикистане"}
        </h1>
        <p className="text-white/70 mt-2 text-sm md:text-base max-w-2xl">
          Квартиры, дома, участки и коммерция — с фильтрами как на ведущих площадках.
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
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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

          <label className="block">
            <span className="text-xs text-white/60 mb-1 block">Цена от</span>
            <input
              value={priceFrom}
              onChange={(e) => setPriceFrom(formatPriceInput(e.target.value))}
              placeholder="от"
              className="w-full h-12 rounded-xl bg-white text-slate-900 px-3 text-sm font-medium outline-none"
            />
          </label>
        </div>

        {showMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Цена до</span>
              <input
                value={priceTo}
                onChange={(e) => setPriceTo(formatPriceInput(e.target.value))}
                placeholder="до"
                className="w-full h-12 rounded-xl bg-white text-slate-900 px-3 text-sm font-medium outline-none"
              />
            </label>

            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="text-xs text-white/60 mb-1 block">Быстрый выбор цены</span>
              <select
                onChange={(e) => {
                  const preset = pricePresets[Number(e.target.value)];
                  if (!preset) return;
                  setPriceFrom(preset.from ? formatPriceInput(preset.from) : "");
                  setPriceTo(preset.to ? formatPriceInput(preset.to) : "");
                }}
                defaultValue=""
                className="w-full h-12 rounded-xl bg-white text-slate-900 px-3 text-sm outline-none"
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
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-sun hover:bg-sun-600 text-white font-bold transition shadow-md"
          >
            <Search size={18} />
            Показать объявления
          </button>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="inline-flex items-center gap-1 h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition"
          >
            {showMore ? "Меньше фильтров" : "Ещё фильтры"}
            <ChevronDown
              size={16}
              className={`transition ${showMore ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </form>
    </section>
  );
}
