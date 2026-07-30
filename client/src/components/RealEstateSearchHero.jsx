import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, MapPin } from "lucide-react";
import RealEstateMoreFiltersModal from "./RealEstateMoreFiltersModal";
import {
  DEAL_TYPES,
  ROOM_OPTIONS,
  REAL_ESTATE_CITIES,
  REAL_ESTATE_PRICE_PRESETS,
  REAL_ESTATE_RENT_PRESETS,
  SUBCATEGORY_META,
} from "../data/realEstate";
import { buildRealEstateListingUrl } from "../lib/realEstate";

const BAR_FIELD =
  "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-lagoon focus:ring-1 focus:ring-lagoon/30";

function BarSelect({ value, onChange, placeholder, options, onApply, className = "" }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onApply?.();
        }}
        className={`${BAR_FIELD} appearance-none pr-8 font-medium ${
          value ? "text-slate-900" : "text-slate-500"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
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
  const [subcategory, setSubcategory] = React.useState(
    initialSubcategory || "Квартиры"
  );
  const [rooms, setRooms] = React.useState("");
  const [locationQuery, setLocationQuery] = React.useState("");
  const [pricePreset, setPricePreset] = React.useState("");
  const [priceFrom, setPriceFrom] = React.useState("");
  const [priceTo, setPriceTo] = React.useState("");
  const [moreOpen, setMoreOpen] = React.useState(false);

  React.useEffect(() => {
    setCity(initialCity);
  }, [initialCity]);

  React.useEffect(() => {
    if (initialSubcategory) {
      setSubcategory(initialSubcategory);
    }
  }, [initialSubcategory]);

  const pricePresets =
    dealType === "Снять" || dealType === "Посуточно"
      ? REAL_ESTATE_RENT_PRESETS
      : REAL_ESTATE_PRICE_PRESETS;

  const subcategoryOptions = Object.keys(SUBCATEGORY_META).map((item) => ({
    value: item,
    label: item,
  }));

  const navigateSearch = React.useCallback(
    (overrides = {}) => {
      const nextDeal = overrides.dealType ?? dealType;
      const nextCity = overrides.city ?? city;
      const nextSubcategory = overrides.subcategory ?? subcategory;
      const nextRooms = overrides.rooms ?? rooms;
      const nextPriceFrom = overrides.priceFrom ?? priceFrom;
      const nextPriceTo = overrides.priceTo ?? priceTo;
      const nextSearch = overrides.locationQuery ?? locationQuery;

      const url = buildRealEstateListingUrl({
        dealType: nextDeal,
        subcategory: nextSubcategory,
        city: nextCity,
        rooms: nextRooms,
        priceFrom: nextPriceFrom,
        priceTo: nextPriceTo,
        search: nextSearch,
      });

      if (onSearch) {
        onSearch({
          dealType: nextDeal,
          subcategory: nextSubcategory,
          city: nextCity,
          rooms: nextRooms,
          priceFrom: nextPriceFrom,
          priceTo: nextPriceTo,
          locationQuery: nextSearch,
        });
      }

      nav(url);
    },
    [
      dealType,
      city,
      subcategory,
      rooms,
      priceFrom,
      priceTo,
      locationQuery,
      onSearch,
      nav,
    ]
  );

  const applyPricePreset = (index) => {
    if (index === "") {
      setPricePreset("");
      setPriceFrom("");
      setPriceTo("");
      navigateSearch({ priceFrom: "", priceTo: "" });
      return;
    }

    const preset = pricePresets[Number(index)];
    if (!preset) return;

    const nextFrom = preset.from ? String(preset.from) : "";
    const nextTo = preset.to ? String(preset.to) : "";

    setPricePreset(index);
    setPriceFrom(nextFrom);
    setPriceTo(nextTo);
    navigateSearch({ priceFrom: nextFrom, priceTo: nextTo });
  };

  const handleDealChange = (value) => {
    setDealType(value);
    setPricePreset("");
    setPriceFrom("");
    setPriceTo("");
    navigateSearch({ dealType: value, priceFrom: "", priceTo: "" });
  };

  return (
    <>
      <section
        className={`overflow-hidden rounded-2xl bg-lagoon-700 shadow-lift ${
          compact ? "" : ""
        }`}
      >
        <div className="flex flex-col gap-2 px-3 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex flex-wrap gap-1">
            {DEAL_TYPES.map((item) => {
              const active = dealType === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleDealChange(item.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="relative inline-flex min-w-0 items-center gap-1.5 self-start sm:self-auto">
            <MapPin size={16} className="shrink-0 text-white/80" />
            <select
              value={city}
              onChange={(e) => {
                const nextCity = e.target.value;
                setCity(nextCity);
                navigateSearch({ city: nextCity });
              }}
              className="max-w-[10rem] appearance-none bg-transparent pr-6 text-sm font-semibold text-white outline-none"
            >
              {REAL_ESTATE_CITIES.map((item) => (
                <option key={item} value={item} className="text-slate-900">
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/70"
            />
          </label>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateSearch();
          }}
          className="p-3 sm:p-4"
        >
          <div className="rounded-xl bg-white p-1.5 sm:p-2">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:flex lg:items-center lg:gap-1.5">
              <BarSelect
                value={subcategory}
                onChange={setSubcategory}
                onApply={() => navigateSearch()}
                placeholder="Квартиры"
                options={subcategoryOptions}
                className="lg:w-40 lg:shrink-0"
              />

              <input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Район, улица, дом"
                className={`${BAR_FIELD} lg:min-w-0 lg:flex-1`}
              />

              <BarSelect
                value={pricePreset}
                onChange={applyPricePreset}
                placeholder="Цена"
                options={pricePresets.map((preset, index) => ({
                  value: String(index),
                  label: preset.label,
                }))}
                className="lg:w-36 lg:shrink-0"
              />

              <BarSelect
                value={rooms}
                onChange={setRooms}
                onApply={() => navigateSearch()}
                placeholder="Комнат"
                options={ROOM_OPTIONS}
                className="lg:w-32 lg:shrink-0"
              />

              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="mobile-btn h-11 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-blue-600 hover:bg-slate-50 lg:w-auto lg:shrink-0 lg:px-4"
              >
                Ещё фильтры
              </button>
            </div>
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
