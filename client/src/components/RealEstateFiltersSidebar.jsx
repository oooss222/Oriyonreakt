import React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  DEAL_TYPES,
  REAL_ESTATE_CITIES,
  POPULAR_DUSHANBE_DISTRICTS,
  getDistrictsForCity,
  isDailyDeal,
  isRentDeal,
  isSubcategoryCompatibleWithDeal,
  realEstateSubcategoryUsesRooms,
  realEstateSubcategoryUsesRentApartmentFilters,
} from "../data/realEstate";
import { getRealEstateSubcategories } from "../data/realEstateFilters";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { getSellerFilterOptions } from "../lib/filterConflicts";
import SaveSearchButton from "./SaveSearchButton";
import RealEstateGuestsPicker from "./realestate/RealEstateGuestsPicker";
import RealEstateDateRangePicker from "./realestate/RealEstateDateRangePicker";
import DailyRentalFilterFields from "./realestate/DailyRentalFilterFields";
import RentRentalFilterFields from "./realestate/RentRentalFilterFields";
import LandFilterFields from "./realestate/LandFilterFields";
import GarageFilterFields from "./realestate/GarageFilterFields";
import CommercialFilterFields from "./realestate/CommercialFilterFields";
import RentalQualityFilterFields from "./realestate/RentalQualityFilterFields";
import { useI18n } from "../i18n";
import { cn } from "../ui";

const ROOM_OPTIONS = ["1", "2", "3", "4", "5+"];

const SIDEBAR_SUBCATEGORIES = [
  "Квартиры",
  "Дома и коттеджи",
  "Комнаты",
  "Участки",
  "Гаражи и парковки",
  "Коммерческая недвижимость",
  "Новостройки",
];

function commitDraft(setDraft, onApply, updater, current) {
  const next = updater(current);
  setDraft(next);
  onApply?.(next);
}

function FilterBlock({ title, children }) {
  const labelId = React.useId();

  if (!title) {
    return <section className="border-b border-ink-200 py-4 last:border-b-0">{children}</section>;
  }

  return (
    <section
      role="group"
      aria-labelledby={labelId}
      className="border-b border-ink-200 py-4 last:border-b-0"
    >
      <div id={labelId} className="label-caps mb-3">
        {title}
      </div>
      {children}
    </section>
  );
}

function Segment({ label, options, value, onChange, className = "" }) {
  return (
    <div role="group" aria-label={label} className={cn("re-filter-segment", className)}>
      {options.map((item) => {
        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "re-filter-segment__btn",
              active && "re-filter-segment__btn--active"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function RadioOption({ active, label, count, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className="filter-option w-full text-left"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
            active ? "border-sun-500" : "border-ink-300"
          )}
        >
          {active ? <span className="h-2 w-2 rounded-full bg-sun-500" /> : null}
        </span>
        <span
          className={cn(
            "truncate text-sm",
            active ? "font-semibold text-ink-900" : "text-ink-600"
          )}
        >
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span className="filter-option__count">{count.toLocaleString("ru-RU")}</span>
      ) : null}
    </button>
  );
}

function DistrictChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "re-filter-district-chip",
        active && "re-filter-district-chip--active"
      )}
    >
      <span className="truncate">{label}</span>
      {typeof count === "number" && count > 0 ? (
        <span className="shrink-0 text-ink-400">{count}</span>
      ) : null}
    </button>
  );
}

function RoomSquareGroup({ label, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-5 gap-2">
      {ROOM_OPTIONS.map((option) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : option)}
            className={cn("re-filter-room-btn", active && "re-filter-room-btn--active")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function RealEstateFiltersSidebar({
  draft,
  setDraft,
  onApply,
  onReset,
  previewTotal = 0,
  previewLoading = false,
  hasActiveFilters = false,
  categoryTotal = 0,
  statsBySubcategory = {},
  activeCat = "realestate",
  appliedDraft,
}) {
  const { t } = useI18n();
  const subcategoryGroupId = React.useId();
  const dealType = draft.specs?.["Тип сделки"] || "";
  const isDaily = isDailyDeal(dealType);
  const isRent = isRentDeal(dealType);
  const effectiveSubcategory = draft.subcategory || "";
  const showRooms = realEstateSubcategoryUsesRooms(effectiveSubcategory);
  const showRentApartmentFilters =
    isRent && realEstateSubcategoryUsesRentApartmentFilters(effectiveSubcategory);
  const isLand = effectiveSubcategory === "Участки";
  const isGarage = effectiveSubcategory === "Гаражи и парковки";
  const isCommercial = effectiveSubcategory === "Коммерческая недвижимость";
  const sellerOptions = getSellerFilterOptions(dealType, effectiveSubcategory);
  const activeCity = draft.location || "Душанбе";
  const districts =
    activeCity === "Душанбе"
      ? POPULAR_DUSHANBE_DISTRICTS
      : getDistrictsForCity(activeCity).slice(0, 6);
  const activeDistrict = draft.specs?.["Район"] || "";
  const activeDistricts = activeDistrict
    ? activeDistrict.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  const priceMode = React.useMemo(() => {
    if (draft.pricePerSqmFrom || draft.pricePerSqmTo) return "sqm";
    return "object";
  }, [draft.pricePerSqmFrom, draft.pricePerSqmTo]);

  const [localPriceMode, setLocalPriceMode] = React.useState(priceMode);

  React.useEffect(() => {
    setLocalPriceMode(priceMode);
  }, [priceMode]);

  const subcategories = React.useMemo(() => {
    const all = getRealEstateSubcategories();
    const ordered = SIDEBAR_SUBCATEGORIES.filter((name) => all.includes(name));
    const rest = all.filter((name) => !ordered.includes(name));
    return [...ordered, ...rest].filter((name) =>
      isSubcategoryCompatibleWithDeal(name, dealType)
    );
  }, [dealType]);

  const showCount = previewLoading
    ? "…"
    : (previewTotal || categoryTotal || 0).toLocaleString("ru-RU");

  const saveDraft = appliedDraft || draft;

  const setSpecValue = (key, value) => {
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

  const setDistrict = (district) => {
    setDraft((current) => {
      const nextSpecs = { ...current.specs };

      if (!district) {
        delete nextSpecs["Район"];
      } else {
        nextSpecs["Район"] = district;
      }

      return { ...current, specs: nextSpecs };
    });
  };

  const toggleDistrict = (district) => {
    const next = activeDistricts.includes(district)
      ? activeDistricts.filter((item) => item !== district)
      : [...activeDistricts, district];

    setDistrict(next.join(", "));
  };

  const handlePriceModeChange = (mode) => {
    setLocalPriceMode(mode);

    if (mode === "object") {
      setDraft((current) => ({
        ...current,
        pricePerSqmFrom: "",
        pricePerSqmTo: "",
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      priceFrom: "",
      priceTo: "",
    }));
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar__header">
        <SlidersHorizontal size={18} className="text-ink-500" aria-hidden="true" />
        <h2 className="text-base font-bold text-ink-900">{t("filter.title")}</h2>
      </div>

      <div className="filter-sidebar__body">
        <FilterBlock title={t("realestate.dealType")}>
          <div className="space-y-3">
            <Segment
              className="re-filter-segment--deal"
              label={t("realestate.dealType")}
              options={DEAL_TYPES}
              value={dealType}
              onChange={(value) =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => ({
                    ...current,
                    specs: {
                      ...current.specs,
                      "Тип сделки": value,
                    },
                  }),
                  draft
                )
              }
            />

            <div id={subcategoryGroupId} className="sr-only">
              {t("filter.category")}
            </div>

            <div
              role="radiogroup"
              aria-labelledby={subcategoryGroupId}
              className="space-y-0.5"
            >
              {subcategories.map((sub) => (
                <RadioOption
                  key={sub}
                  active={draft.subcategory === sub}
                  label={sub}
                  count={statsBySubcategory[sub] || 0}
                  onSelect={() =>
                    commitDraft(
                      setDraft,
                      onApply,
                      (current) => ({
                        ...current,
                        subcategory: sub,
                        areaFrom: "",
                        areaTo: "",
                        floorFrom: "",
                        floorTo: "",
                        floorNotFirst: false,
                        floorNotLast: false,
                      }),
                      draft
                    )
                  }
                />
              ))}
            </div>
          </div>
        </FilterBlock>

        {isDaily ? (
          <>
            <FilterBlock title={t("realestate.trip")}>
              <div className="space-y-3">
                <RealEstateDateRangePicker
                  checkIn={draft.checkIn || ""}
                  checkOut={draft.checkOut || ""}
                  onChange={({ checkIn, checkOut }) =>
                    setDraft((current) => ({
                      ...current,
                      checkIn,
                      checkOut,
                    }))
                  }
                />

                <RealEstateGuestsPicker
                  compact
                  value={draft.guests || ""}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, guests: value }))
                  }
                />
              </div>
            </FilterBlock>

            <FilterBlock title={t("realestate.dailyFeaturesTitle")}>
              <DailyRentalFilterFields
                draft={draft}
                setSpec={setSpecValue}
              />
            </FilterBlock>
          </>
        ) : null}

        {showRentApartmentFilters ? (
          <FilterBlock title={t("realestate.rentFeaturesTitle")}>
            <RentRentalFilterFields
              draft={draft}
              setSpec={setSpecValue}
              showSellerFilters={sellerOptions.length > 0}
              onSellerTypeChange={(value) =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => ({
                    ...current,
                    sellerType: value,
                  }),
                  draft
                )
              }
            />
          </FilterBlock>
        ) : null}

        {isLand && !isDaily ? (
          <FilterBlock title={t("realestate.landParams")}>
            <LandFilterFields draft={draft} setSpec={setSpecValue} />
          </FilterBlock>
        ) : null}

        {isGarage && !isDaily ? (
          <FilterBlock
            title={isRent ? t("realestate.rentFeaturesTitle") : t("realestate.params")}
          >
            <GarageFilterFields
              draft={draft}
              setSpec={setSpecValue}
              isRent={isRent}
            />
          </FilterBlock>
        ) : null}

        {isCommercial && !isDaily ? (
          <FilterBlock
            title={isRent ? t("realestate.rentFeaturesTitle") : t("realestate.params")}
          >
            <CommercialFilterFields
              draft={draft}
              setSpec={setSpecValue}
              isRent={isRent}
            />
          </FilterBlock>
        ) : null}

        {isDaily || isRent ? (
          <FilterBlock title={t("filter.more")}>
            <RentalQualityFilterFields
              draft={draft}
              onOnlyWithPhotosChange={(value) =>
                setDraft((current) => ({ ...current, onlyWithPhotos: value }))
              }
              onVerifiedOnlyChange={(value) =>
                setDraft((current) => ({ ...current, verifiedOnly: value }))
              }
            />
          </FilterBlock>
        ) : null}

        <FilterBlock title={t("realestate.cityAndDistricts")}>
          <div className="space-y-3">
            <Segment
              className="re-filter-segment--2"
              label={t("filter.city")}
              options={REAL_ESTATE_CITIES.map((city) => ({ value: city, label: city }))}
              value={activeCity}
              onChange={(value) =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => {
                    const nextSpecs = { ...current.specs };
                    delete nextSpecs["Район"];

                    return {
                      ...current,
                      location: value,
                      specs: nextSpecs,
                    };
                  },
                  draft
                )
              }
            />

            <div role="group" aria-label={t("realestate.district")} className="flex flex-wrap gap-2">
              <DistrictChip
                active={!activeDistrict}
                label={t("realestate.allDistricts")}
                count={districts.length}
                onClick={() => setDistrict("")}
              />

              {districts.map((district) => (
                <DistrictChip
                  key={district}
                  active={activeDistricts.includes(district)}
                  label={district}
                  onClick={() => toggleDistrict(district)}
                />
              ))}
            </div>
          </div>
        </FilterBlock>

        <FilterBlock title={t("filter.price")}>
          <div className="space-y-3">
            {!isDaily && !isRent ? (
              <Segment
                className="re-filter-segment--2 re-filter-segment--compact"
                label={t("realestate.priceMode")}
                options={[
                  { value: "object", label: t("realestate.priceModeObject") },
                  { value: "sqm", label: t("realestate.priceModeSqm") },
                ]}
                value={localPriceMode}
                onChange={handlePriceModeChange}
              />
            ) : null}

            {localPriceMode === "sqm" && !isDaily && !isRent ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t("realestate.ppsqmFrom")}
                  placeholder={t("realestate.fromCurrency")}
                  value={
                    draft.pricePerSqmFrom
                      ? formatPriceInput(draft.pricePerSqmFrom)
                      : ""
                  }
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      pricePerSqmFrom: getPriceDigits(event.target.value),
                    }))
                  }
                  className="filter-sidebar__input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t("realestate.ppsqmTo")}
                  placeholder={t("realestate.toCurrency")}
                  value={
                    draft.pricePerSqmTo
                      ? formatPriceInput(draft.pricePerSqmTo)
                      : ""
                  }
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      pricePerSqmTo: getPriceDigits(event.target.value),
                    }))
                  }
                  className="filter-sidebar__input"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t("filter.rangeFrom")}
                  placeholder={t("realestate.fromCurrency")}
                  value={draft.priceFrom ? formatPriceInput(draft.priceFrom) : ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priceFrom: getPriceDigits(event.target.value),
                    }))
                  }
                  className="filter-sidebar__input"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t("filter.rangeTo")}
                  placeholder={t("realestate.toCurrency")}
                  value={draft.priceTo ? formatPriceInput(draft.priceTo) : ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priceTo: getPriceDigits(event.target.value),
                    }))
                  }
                  className="filter-sidebar__input"
                />
              </div>
            )}
          </div>
        </FilterBlock>

        {showRooms ? (
          <FilterBlock title={t("realestate.rooms")}>
            <RoomSquareGroup
              label={t("realestate.rooms")}
              value={draft.specs?.["Комнат"] || ""}
              onChange={(value) =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => ({
                    ...current,
                    specs: {
                      ...current.specs,
                      Комнат: value,
                    },
                  }),
                  draft
                )
              }
            />
          </FilterBlock>
        ) : null}

        {hasActiveFilters ? (
          <button type="button" onClick={onReset} className="filter-reset my-2">
            <X size={15} aria-hidden="true" />
            {t("filter.reset")}
          </button>
        ) : null}
      </div>

      <div className="filter-sidebar__footer space-y-2">
        <button
          type="button"
          onClick={() => onApply()}
          className="filter-sidebar__apply filter-sidebar__apply--sun"
        >
          {previewLoading
            ? t("realestate.showResultsLoading")
            : t("realestate.showResults", { count: showCount })}
        </button>

        <SaveSearchButton
          draft={saveDraft}
          activeCat={activeCat}
          className="w-full [&>button]:h-11 [&>button]:w-full"
        />
      </div>
    </div>
  );
}
