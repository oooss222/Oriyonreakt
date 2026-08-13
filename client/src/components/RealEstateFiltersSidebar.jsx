import React from "react";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Search,
} from "lucide-react";
import {
  DEAL_TYPES,
  DAILY_HOUSING_TYPES,
  DAILY_AMENITY_OPTIONS,
  REAL_ESTATE_CITIES,
  getDistrictsForCity,
  POPULAR_DUSHANBE_DISTRICTS,
  getPricePresetsForDeal,
  isDailyDeal,
  realEstateSubcategoryUsesRooms,
  realEstateSubcategoryUsesFloor,
} from "../data/realEstate";
import {
  getRealEstateSortOptions,
  getRealEstateSubcategories,
} from "../data/realEstateFilters";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { getSellerFilterOptions } from "../lib/filterConflicts";
import RangeFilter from "./filters/RangeFilter";
import MultiPillGroup from "./filters/MultiPillGroup";
import RealEstateGuestsPicker from "./realestate/RealEstateGuestsPicker";
import RealEstateDateRangePicker from "./realestate/RealEstateDateRangePicker";

function commitDraft(setDraft, onApply, updater, current) {
  const next = updater(current);
  setDraft(next);
  onApply?.(next);
}

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className="border-b border-ink/10 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="label-caps">{title}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-ink-300" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-ink-300" />
        )}
      </button>

      {open ? <div className="mt-3 space-y-3">{children}</div> : null}
    </section>
  );
}

function RadioOption({ active, label, count, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-mist/70"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition ${
            active ? "border-sun" : "border-ink/20"
          }`}
        >
          {active ? <span className="h-2 w-2 rounded-full bg-sun" /> : null}
        </span>
        <span
          className={`truncate text-sm ${
            active ? "font-semibold text-ink" : "text-ink-600"
          }`}
        >
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-xs font-medium text-ink-300">
          {count.toLocaleString("ru-RU")}
        </span>
      ) : null}
    </button>
  );
}

function PillGroup({ value, options, onChange, anyLabel = "Все" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
          !value
            ? "border-ink bg-ink text-white"
            : "border-ink/12 bg-white text-ink-600 hover:border-ink/25"
        }`}
      >
        {anyLabel}
      </button>

      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        const active = value === optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "border-ink bg-ink text-white"
                : "border-ink/12 bg-white text-ink-600 hover:border-ink/25"
            }`}
          >
            {optionLabel}
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
}) {
  const subcategories = getRealEstateSubcategories();
  const dealType = draft.specs?.["Тип сделки"] || "";
  const isDaily = isDailyDeal(dealType);
  const effectiveSubcategory = draft.subcategory || "";
  const showRooms = realEstateSubcategoryUsesRooms(effectiveSubcategory);
  const showFloor = realEstateSubcategoryUsesFloor(effectiveSubcategory);
  const sortOptions = getRealEstateSortOptions(dealType);
  const sellerOptions = getSellerFilterOptions(dealType, effectiveSubcategory);
  const pricePresets = getPricePresetsForDeal(dealType);
  const activeCity = draft.location || "Душанбе";
  const districts = getDistrictsForCity(activeCity);
  const popularDistricts =
    activeCity === "Душанбе" ? POPULAR_DUSHANBE_DISTRICTS : districts.slice(0, 6);

  const showCount = previewLoading
    ? "…"
    : (previewTotal || categoryTotal || 0).toLocaleString("ru-RU");

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

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar__header">
        <SlidersHorizontal size={18} className="text-ink-500" />
        <h2 className="text-base font-bold text-ink">Фильтры</h2>
      </div>

      <div className="filter-sidebar__body">
        <FilterSection title="Ключевые слова">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <input
              value={draft.search || ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Например: 2-комнатная центр"
              className="filter-sidebar__input pl-9"
            />
          </label>
        </FilterSection>

        <FilterSection title="Сортировка">
          <div className="relative">
            <ArrowUpDown
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <select
              value={draft.sort || "new"}
              onChange={(event) =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => ({
                    ...current,
                    sort: event.target.value,
                  }),
                  draft
                )
              }
              className="filter-sidebar__select pl-9"
            >
              {Object.entries(sortOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
          </div>
        </FilterSection>

        <FilterSection title="Тип недвижимости">
          <div className="space-y-0.5">
            <RadioOption
              active={!draft.subcategory}
              label="Все типы"
              count={categoryTotal}
              onSelect={() =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => ({
                    ...current,
                    subcategory: "",
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
        </FilterSection>

        <FilterSection title="Сделка">
          <PillGroup
            value={dealType}
            options={DEAL_TYPES.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            anyLabel="Любая"
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
        </FilterSection>

        {isDaily ? (
          <FilterSection title="Поездка">
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

            <PillGroup
              value={draft.subcategory || ""}
              options={DAILY_HOUSING_TYPES}
              anyLabel="Любой"
              onChange={(value) =>
                commitDraft(
                  setDraft,
                  onApply,
                  (current) => ({
                    ...current,
                    subcategory: value,
                  }),
                  draft
                )
              }
            />
          </FilterSection>
        ) : null}

        {showRooms && !isDaily ? (
          <FilterSection title="Комнат">
            <PillGroup
              value={draft.specs?.["Комнат"] || ""}
              options={["1", "2", "3", "4", "5", "5+"]}
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
          </FilterSection>
        ) : null}

        <FilterSection title="Город">
          <PillGroup
            value={draft.location || ""}
            options={REAL_ESTATE_CITIES.map((city) => ({
              value: city,
              label: city,
            }))}
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
        </FilterSection>

        {districts.length > 0 ? (
          <FilterSection title="Район" defaultOpen={false}>
            <MultiPillGroup
              values={draft.specs?.["Район"] || ""}
              options={popularDistricts}
              onChange={(value) => setSpec("Район", value)}
              anyLabel="Любой"
            />
          </FilterSection>
        ) : null}

        <FilterSection title={isDaily ? "Цена за сутки" : "Цена"}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="от"
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
              placeholder="до"
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

          {pricePresets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pricePresets.map((preset) => {
                if (!preset.from && !preset.to) return null;

                const active =
                  String(draft.priceFrom || "") === String(preset.from || "") &&
                  String(draft.priceTo || "") === String(preset.to || "");

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        priceFrom: preset.from ? String(preset.from) : "",
                        priceTo: preset.to ? String(preset.to) : "",
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-sun bg-sun-50 text-sun-800"
                        : "border-ink/12 bg-white text-ink-600"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </FilterSection>

        <FilterSection title="Дополнительно" defaultOpen={false}>
          {!isDaily ? (
            <div>
              <div className="mb-2 text-xs font-medium text-ink-400">
                Площадь, м²
              </div>
              <RangeFilter
                from={draft.areaFrom || ""}
                to={draft.areaTo || ""}
                onChange={({ from, to }) =>
                  setDraft((current) => ({
                    ...current,
                    areaFrom: from,
                    areaTo: to,
                  }))
                }
                fromPlaceholder="от"
                toPlaceholder="до"
                suffix=" м²"
              />
            </div>
          ) : null}

          {showFloor && !isDaily ? (
            <>
              <div>
                <div className="mb-2 text-xs font-medium text-ink-400">Этаж</div>
                <RangeFilter
                  from={draft.floorFrom || ""}
                  to={draft.floorTo || ""}
                  onChange={({ from, to }) =>
                    setDraft((current) => ({
                      ...current,
                      floorFrom: from,
                      floorTo: to,
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      floorNotFirst: !current.floorNotFirst,
                    }))
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    draft.floorNotFirst
                      ? "border-ink bg-ink text-white"
                      : "border-ink/12 bg-white text-ink-600"
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
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    draft.floorNotLast
                      ? "border-ink bg-ink text-white"
                      : "border-ink/12 bg-white text-ink-600"
                  }`}
                >
                  Не последний
                </button>
              </div>
            </>
          ) : null}

          {isDaily ? (
            <MultiPillGroup
              values={draft.specs?.["Удобства"] || ""}
              options={DAILY_AMENITY_OPTIONS}
              onChange={(value) => setSpec("Удобства", value)}
            />
          ) : null}

          {sellerOptions.length > 0 ? (
            <div className="space-y-2">
              {sellerOptions.map((option) => {
                const active = draft.sellerType === option.value;

                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-1 py-1.5 hover:bg-mist/70"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        commitDraft(
                          setDraft,
                          onApply,
                          (current) => ({
                            ...current,
                            sellerType:
                              current.sellerType === option.value
                                ? ""
                                : option.value,
                          }),
                          draft
                        )
                      }
                      className="h-4 w-4 rounded border-ink/20 text-sun focus:ring-sun/30"
                    />
                    <span className="text-sm text-ink-700">{option.label}</span>
                  </label>
                );
              })}
            </div>
          ) : null}

          {!isDaily ? (
            <>
              <PillGroup
                value={draft.specs?.["Мебель"] || ""}
                options={["С мебелью", "Без мебели", "Частично"]}
                onChange={(value) => setSpec("Мебель", value)}
              />
              <PillGroup
                value={draft.specs?.["Ремонт"] || ""}
                options={[
                  "Без ремонта",
                  "Косметический",
                  "Евро",
                  "Дизайнерский",
                ]}
                onChange={(value) => setSpec("Ремонт", value)}
              />
              <PillGroup
                value={draft.specs?.["Состояние"] || ""}
                options={["Новостройка", "Вторичка"]}
                onChange={(value) => setSpec("Состояние", value)}
              />
            </>
          ) : null}
        </FilterSection>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition hover:text-ink-600"
          >
            <X size={15} />
            Сбросить фильтры
          </button>
        ) : null}
      </div>

      <div className="filter-sidebar__footer">
        <button
          type="button"
          onClick={() => onApply()}
          className="filter-sidebar__apply"
        >
          {previewLoading ? "Показать…" : `Показать ${showCount} объявления`}
        </button>
      </div>
    </div>
  );
}
