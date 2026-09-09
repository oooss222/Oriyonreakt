import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import RealEstateMoreFiltersModal from "./RealEstateMoreFiltersModal";
import RealEstateCitySelect from "./RealEstateCitySelect";
import RealEstateDailySearchBar from "./realestate/RealEstateDailySearchBar";
import RealEstateQuickCollections from "./realestate/RealEstateQuickCollections";
import {
  DEAL_TYPES,
  ROOM_OPTIONS,
  SUBCATEGORY_META,
  getPricePresetsForDeal,
  realEstateSubcategoryUsesRooms,
  isDailyDeal,
  isSubcategoryCompatibleWithDeal,
} from "../data/realEstate";
import { buildRealEstateListingUrl } from "../lib/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { useI18n, pluralRealEstateListings } from "../i18n";
import { Button, Field, Input, Select, cn } from "../ui";

function formatHeroPriceSummary(from, to, currency = "с.") {
  const fromLabel = from ? formatPriceInput(from) : "";
  const toLabel = to ? formatPriceInput(to) : "";

  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel} ${currency}`;
  if (fromLabel) return `от ${fromLabel} ${currency}`;
  if (toLabel) return `до ${toLabel} ${currency}`;
  return "";
}

function pluralAds(count, t) {
  return pluralRealEstateListings(t, count);
}

/**
 * Deal type is a filter, not a tab strip: there is no panel to control, so it
 * announces as a group of toggles.
 */
function DealTypeGroup({ value, onChange, label }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mb-4 inline-flex w-full gap-1 rounded-xl border border-ink-200 bg-mist-100 p-1 sm:w-auto"
    >
      {DEAL_TYPES.map((item) => {
        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "min-h-[2.75rem] flex-1 rounded-lg px-4 text-sm font-semibold transition-colors sm:min-w-[6.5rem] sm:flex-none",
              active
                ? "bg-sun-500 text-white shadow-xs"
                : "text-ink-600 hover:bg-white hover:text-ink-900"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function HeroPriceFilter({
  priceFrom,
  priceTo,
  priceCurrency,
  onChange,
  dealType = "Купить",
  label,
  t,
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const panelId = React.useId();
  const summary = formatHeroPriceSummary(priceFrom, priceTo, priceCurrency);
  const presets = getPricePresetsForDeal(dealType).filter(
    (item) => item.from || item.to
  );

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
      <span className="field-label" id={`${panelId}-label`}>
        {label}
      </span>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${panelId}-label`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "input flex items-center justify-between gap-3 text-left",
          summary ? "text-ink-900" : "text-ink-400"
        )}
      >
        <span className="truncate">{summary || t("realestate.anyPrice")}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={t("realestate.priceRange")}
          className="absolute left-0 right-0 top-[calc(100%+6px)] w-full min-w-[17rem] space-y-3
                     rounded-2xl border border-ink-200 bg-white p-3 text-ink-900 shadow-lg"
          style={{ zIndex: "var(--z-dropdown)" }}
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("realestate.from")}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  placeholder="0"
                  value={priceFrom ? formatPriceInput(priceFrom) : ""}
                  onChange={(e) =>
                    onChange({
                      priceFrom: getPriceDigits(e.target.value),
                      priceTo,
                      priceCurrency,
                    })
                  }
                />
              )}
            </Field>

            <Field label={t("realestate.to")}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  placeholder="∞"
                  value={priceTo ? formatPriceInput(priceTo) : ""}
                  onChange={(e) =>
                    onChange({
                      priceFrom,
                      priceTo: getPriceDigits(e.target.value),
                      priceCurrency,
                    })
                  }
                />
              )}
            </Field>
          </div>

          <Field label={t("realestate.currency")}>
            {(props) => (
              <Select
                {...props}
                value={priceCurrency}
                onChange={(e) =>
                  onChange({ priceFrom, priceTo, priceCurrency: e.target.value })
                }
              >
                <option value="с.">с.</option>
                <option value="$">$</option>
              </Select>
            )}
          </Field>

          {presets.length > 0 && (
            <div role="group" aria-label={t("realestate.quickPick")} className="flex flex-wrap gap-1.5">
              {presets.slice(0, 5).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChange({
                      priceFrom: preset.from ? String(preset.from) : "",
                      priceTo: preset.to ? String(preset.to) : "",
                      priceCurrency,
                    })
                  }
                  className="chip filter-chip text-xs"
                >
                  {preset.label.replace("Любая", "").trim() || preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RealEstateSearchHero({
  compact = false,
  listingPage = false,
  initialDeal = "Купить",
  initialCity = "Душанбе",
  initialSubcategory = "",
  initialRooms = "",
  initialPriceFrom = "",
  initialPriceTo = "",
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = "",
  totalCount = 0,
  onCityChange,
  onSearch,
}) {
  const { t } = useI18n();
  const nav = useNavigate();
  const [dealType, setDealType] = React.useState(initialDeal);
  const [city, setCity] = React.useState(initialCity);
  const [subcategory, setSubcategory] = React.useState(initialSubcategory);
  const [rooms, setRooms] = React.useState(initialRooms);
  const [priceFrom, setPriceFrom] = React.useState(initialPriceFrom);
  const [priceTo, setPriceTo] = React.useState(initialPriceTo);
  const [checkIn, setCheckIn] = React.useState(initialCheckIn);
  const [checkOut, setCheckOut] = React.useState(initialCheckOut);
  const [guests, setGuests] = React.useState(initialGuests || (isDailyDeal(initialDeal) ? "2" : ""));
  const [priceCurrency, setPriceCurrency] = React.useState("с.");
  const [moreOpen, setMoreOpen] = React.useState(false);
  const filtersLabelId = React.useId();

  React.useEffect(() => setCity(initialCity), [initialCity]);
  React.useEffect(() => setSubcategory(initialSubcategory), [initialSubcategory]);
  React.useEffect(() => setDealType(initialDeal), [initialDeal]);
  React.useEffect(() => setRooms(initialRooms), [initialRooms]);
  React.useEffect(() => setPriceFrom(initialPriceFrom), [initialPriceFrom]);
  React.useEffect(() => setPriceTo(initialPriceTo), [initialPriceTo]);
  React.useEffect(() => setCheckIn(initialCheckIn), [initialCheckIn]);
  React.useEffect(() => setCheckOut(initialCheckOut), [initialCheckOut]);
  React.useEffect(() => setGuests(initialGuests), [initialGuests]);

  React.useEffect(() => {
    if (isDailyDeal(dealType)) {
      setGuests((prev) => prev || initialGuests || "2");
    }
  }, [dealType, initialGuests]);

  const handleCityChange = (nextCity) => {
    setCity(nextCity);
    onCityChange?.(nextCity);
  };

  const handleDealTypeChange = (nextDeal) => {
    const nextSubcategory = !isSubcategoryCompatibleWithDeal(subcategory, nextDeal)
      ? ""
      : subcategory;

    setDealType(nextDeal);
    setSubcategory(nextSubcategory);

    if (isDailyDeal(nextDeal)) {
      setGuests((prev) => prev || initialGuests || "2");
    }

    if (listingPage) {
      const url = buildRealEstateListingUrl({
        dealType: nextDeal,
        subcategory: nextSubcategory,
        city,
        rooms,
        priceFrom: getPriceDigits(priceFrom),
        priceTo: getPriceDigits(priceTo),
        checkIn,
        checkOut,
        guests: isDailyDeal(nextDeal) ? guests || initialGuests || "2" : guests,
      });
      nav(url);
    }
  };

  const submit = (e) => {
    e?.preventDefault?.();

    const effectiveSubcategory =
      isDailyDeal(dealType) && !isSubcategoryCompatibleWithDeal(subcategory, dealType)
        ? ""
        : subcategory;

    const url = buildRealEstateListingUrl({
      dealType,
      subcategory: effectiveSubcategory,
      city,
      rooms,
      priceFrom: getPriceDigits(priceFrom),
      priceTo: getPriceDigits(priceTo),
      checkIn,
      checkOut,
      guests,
    });

    onSearch?.({
      dealType,
      subcategory: effectiveSubcategory,
      city,
      rooms,
      priceFrom,
      priceTo,
      checkIn,
      checkOut,
      guests,
    });
    nav(url);
  };

  const isDaily = isDailyDeal(dealType);

  const dealLabel = isDaily
    ? t("realestate.dailyRent")
    : DEAL_TYPES.find((item) => item.value === dealType)?.label?.toLowerCase() || "купить";

  const actionLabel = isDaily
    ? dealLabel
    : dealLabel.charAt(0).toUpperCase() + dealLabel.slice(1);

  const heroTitle = city
    ? t("realestate.inCity", { action: actionLabel, city })
    : t("realestate.inTajikistan", { action: actionLabel });

  const submitLabel =
    totalCount > 0
      ? t("realestate.showCount", {
          count: totalCount.toLocaleString("ru-RU"),
          unit: pluralAds(totalCount, t),
        })
      : isDaily
        ? t("realestate.show")
        : t("realestate.showListings");

  const hasActiveFilters = Boolean(
    subcategory ||
      rooms ||
      priceFrom ||
      priceTo ||
      checkIn ||
      checkOut ||
      guests ||
      dealType !== "Купить"
  );

  const showRooms = !isDaily && realEstateSubcategoryUsesRooms(subcategory);

  return (
    <>
      <section className={cn("hero-dark", compact ? "p-4 md:p-5" : "p-5 md:p-8")}>
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sun-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-sun-500/10 blur-3xl"
          aria-hidden="true"
        />

        {!compact && (
          <div className="relative mb-5 max-w-3xl md:mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sun-300">
              {t("realestate.heroBrand")}
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-tight md:text-[2.35rem]">
              {heroTitle}
            </h1>
            {totalCount > 0 && (
              <p className="mt-2 text-sm text-white/70">
                {t("realestate.activeCount", { count: totalCount.toLocaleString("ru-RU") })}
                {isDaily ? t("realestate.dailyTypes") : t("realestate.saleTypes")}
              </p>
            )}
          </div>
        )}

        <div className="relative overflow-visible">
          {isDaily ? (
            <div className="rounded-2xl bg-white p-4 text-ink-900 shadow-md md:p-5">
              <DealTypeGroup
                value={dealType}
                onChange={handleDealTypeChange}
                label={t("realestate.dealType")}
              />

              <form onSubmit={submit}>
                <RealEstateDailySearchBar
                  city={city}
                  onCityChange={handleCityChange}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onDatesChange={({ checkIn: nextIn, checkOut: nextOut }) => {
                    setCheckIn(nextIn);
                    setCheckOut(nextOut);
                  }}
                  guests={guests}
                  onGuestsChange={setGuests}
                  submitLabel={submitLabel}
                  hideCity={listingPage}
                  onMoreFilters={listingPage ? undefined : () => setMoreOpen(true)}
                  hasMoreFilters={hasActiveFilters}
                />
              </form>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 text-ink-900 shadow-md md:p-5">
              <DealTypeGroup
                value={dealType}
                onChange={handleDealTypeChange}
                label={t("realestate.dealType")}
              />

              <form onSubmit={submit} className="space-y-4">
                <div role="group" aria-labelledby={filtersLabelId}>
                  <h2 id={filtersLabelId} className="sr-only">
                    {t("realestate.searchParams")}
                  </h2>

                  <div
                    className={cn(
                      "grid grid-cols-1 gap-3 sm:grid-cols-2",
                      showRooms ? "lg:grid-cols-4" : "lg:grid-cols-3"
                    )}
                  >
                    {!listingPage && (
                      <Field label={t("realestate.city")}>
                        {(props) => (
                          <div className="relative">
                            <MapPin
                              size={16}
                              aria-hidden="true"
                              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-400"
                            />
                            <RealEstateCitySelect
                              {...props}
                              value={city}
                              onChange={(e) => handleCityChange(e.target.value)}
                              className="select pl-9"
                            />
                          </div>
                        )}
                      </Field>
                    )}

                    <Field label={t("realestate.type")}>
                      {(props) => (
                        <Select
                          {...props}
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                        >
                          <option value="">{t("realestate.allTypes")}</option>
                          {Object.keys(SUBCATEGORY_META).map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>

                    {showRooms && (
                      <Field label={t("realestate.rooms")}>
                        {(props) => (
                          <Select
                            {...props}
                            value={rooms}
                            onChange={(e) => setRooms(e.target.value)}
                          >
                            <option value="">{t("realestate.any")}</option>
                            {ROOM_OPTIONS.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    )}

                    <HeroPriceFilter
                      dealType={dealType}
                      priceFrom={priceFrom}
                      priceTo={priceTo}
                      priceCurrency={priceCurrency}
                      label={t("realestate.price")}
                      t={t}
                      onChange={({
                        priceFrom: nextFrom,
                        priceTo: nextTo,
                        priceCurrency: nextCurrency,
                      }) => {
                        setPriceFrom(nextFrom);
                        setPriceTo(nextTo);
                        setPriceCurrency(nextCurrency);
                      }}
                    />
                  </div>
                </div>

                {!listingPage && !isDaily && (
                  <RealEstateQuickCollections
                    city={city}
                    className="scroll-fade-x border-t border-ink-200 pt-3"
                  />
                )}

                {!listingPage && (
                  <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row">
                    <Button type="submit" variant="primary" size="lg" icon={Search} block>
                      {submitLabel}
                    </Button>

                    <Button
                      size="lg"
                      icon={SlidersHorizontal}
                      block
                      onClick={() => setMoreOpen(true)}
                      className={cn(
                        "sm:w-auto sm:min-w-[10.5rem]",
                        hasActiveFilters && "border-sun-300 ring-1 ring-sun-100"
                      )}
                    >
                      {t("realestate.moreFilters")}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      {!listingPage && (
        <RealEstateMoreFiltersModal
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          dealType={dealType}
          city={city}
          subcategory={subcategory}
          rooms={rooms}
          guests={guests}
          checkIn={checkIn}
          checkOut={checkOut}
          priceFrom={priceFrom}
          priceTo={priceTo}
          onNavigate={(url) => nav(url)}
        />
      )}
    </>
  );
}
