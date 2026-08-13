import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from "lucide-react";
import { getListingFilterGrid } from "../data/filterGrids";
import { LOCATIONS, formatPriceInput, getPriceDigits, COMMON_SPEC_OPTIONS } from "../data/specOptions";
import RangeFilter from "./filters/RangeFilter";
import { getDistrictsForCity } from "../data/realEstate";
import { getSellerFilterOptions } from "../lib/filterConflicts";

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

function PillGroup({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value || "__all__"}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "border-ink bg-ink text-white"
                : "border-ink/12 bg-white text-ink-600 hover:border-ink/25"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SidebarSelect({ value, placeholder, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={`filter-sidebar__select ${
          value ? "text-ink font-medium" : "text-ink-400"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-300"
      />
    </div>
  );
}

export default function ListingFiltersSidebar({
  draft,
  setDraft,
  activeCat,
  availableSubcategories = [],
  categoryTotal = 0,
  statsBySubcategory = {},
  onApply,
  onReset,
  previewTotal = 0,
  previewLoading = false,
  hasActiveFilters = false,
}) {
  const grid = React.useMemo(
    () => getListingFilterGrid(activeCat, draft.subcategory),
    [activeCat, draft.subcategory]
  );

  const flatFields = React.useMemo(() => {
    const fields = [];

    grid.rows?.forEach((row) => {
      row.forEach((field) => {
        if (field) fields.push(field);
      });
    });

    grid.more?.forEach((field) => {
      if (field) fields.push(field);
    });

    return fields;
  }, [grid]);

  const sortField = flatFields.find((field) => field.type === "sort");
  const sortLabels = grid?.sortOptions || {
    new: "Сначала новые",
    views_desc: "Сначала популярные",
    price_asc: "Цена по возрастанию",
    price_desc: "Цена по убыванию",
  };

  const extraSpecFields = flatFields.filter(
    (field) =>
      field.type === "spec" &&
      field.specKey !== "Состояние" &&
      !["subcategory", "price", "location", "region", "sort", "search"].includes(
        field.type
      )
  );

  const rangeFields = flatFields.filter(
    (field) =>
      field.type === "range" ||
      field.type === "year-range" ||
      field.type === "mileage-range"
  );

  const dependentSpecFields = flatFields.filter(
    (field) => field.type === "spec-dependent"
  );

  const toggleFields = flatFields.filter((field) => field.type === "toggle");
  const regionField = flatFields.find((field) => field.type === "region");
  const districtField = flatFields.find((field) => field.type === "city-district");

  const sellerOptions =
    activeCat === "transport"
      ? [
          { value: "private", label: "Частный продавец" },
          { value: "company", label: "Компания" },
        ]
      : [];

  const conditionValue = draft.specs?.["Состояние"] || "";
  const showCount = previewLoading
    ? "…"
    : (previewTotal || categoryTotal || 0).toLocaleString("ru-RU");

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
              value={draft.search}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Например: iPhone 13 Pro"
              className="filter-sidebar__input pl-9"
            />
          </label>
        </FilterSection>

        {sortField ? (
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
                {Object.entries(sortLabels).map(([value, label]) => (
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
        ) : null}

        {availableSubcategories.length > 0 ? (
          <FilterSection title="Категория">
            <div className="space-y-0.5">
              <RadioOption
                active={!draft.subcategory}
                label="Все категории"
                count={categoryTotal}
                onSelect={() =>
                  commitDraft(
                    setDraft,
                    onApply,
                    (current) => ({
                      ...current,
                      subcategory: "",
                      specs: {},
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

              {availableSubcategories.map((sub) => (
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
                        specs: {},
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
        ) : null}

        <FilterSection title="Цена">
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
        </FilterSection>

        <FilterSection title="Город">
          <PillGroup
            value={draft.location || ""}
            options={[
              { value: "", label: "Все" },
              ...LOCATIONS.map((city) => ({ value: city, label: city })),
            ]}
            onChange={(value) =>
              commitDraft(
                setDraft,
                onApply,
                (current) => {
                  const nextSpecs = { ...current.specs };
                  const districts = getDistrictsForCity(value || "Душанбе");
                  const currentDistrict = nextSpecs["Район"];

                  if (currentDistrict && !districts.includes(currentDistrict)) {
                    delete nextSpecs["Район"];
                  }

                  return {
                    ...current,
                    location: value,
                    region: value ? "" : current.region,
                    specs: nextSpecs,
                  };
                },
                draft
              )
            }
          />
        </FilterSection>

        <FilterSection title="Состояние">
          <PillGroup
            value={conditionValue}
            options={[
              { value: "", label: "Все" },
              ...COMMON_SPEC_OPTIONS.condition.map((option) => ({
                value: option,
                label: option === "Новый" ? "Новое" : option,
              })),
            ]}
            onChange={(value) =>
              commitDraft(
                setDraft,
                onApply,
                (current) => {
                  const nextSpecs = { ...current.specs };

                  if (value) {
                    nextSpecs["Состояние"] = value;
                  } else {
                    delete nextSpecs["Состояние"];
                  }

                  return {
                    ...current,
                    specs: nextSpecs,
                  };
                },
                draft
              )
            }
          />
        </FilterSection>

        {(extraSpecFields.length > 0 ||
          dependentSpecFields.length > 0 ||
          rangeFields.length > 0 ||
          regionField ||
          districtField ||
          sellerOptions.length > 0 ||
          toggleFields.length > 0) && (
          <FilterSection title="Дополнительно" defaultOpen={false}>
            {regionField ? (
              <SidebarSelect
                value={draft.region}
                placeholder={regionField.label}
                options={regionField.options || []}
                onChange={(value) =>
                  commitDraft(
                    setDraft,
                    onApply,
                    (current) => ({
                      ...current,
                      region: value,
                      location: value ? "" : current.location,
                    }),
                    draft
                  )
                }
              />
            ) : null}

            {districtField ? (
              <SidebarSelect
                value={draft.specs?.[districtField.specKey] || ""}
                placeholder={districtField.label}
                options={getDistrictsForCity(draft.location || "Душанбе")}
                onChange={(value) =>
                  commitDraft(
                    setDraft,
                    onApply,
                    (current) => {
                      const nextSpecs = { ...current.specs };

                      if (value) {
                        nextSpecs[districtField.specKey] = value;
                      } else {
                        delete nextSpecs[districtField.specKey];
                      }

                      return {
                        ...current,
                        specs: nextSpecs,
                      };
                    },
                    draft
                  )
                }
              />
            ) : null}

            {extraSpecFields.map((field) => (
              <SidebarSelect
                key={field.id}
                value={draft.specs?.[field.specKey] || ""}
                placeholder={field.label}
                options={field.options || []}
                onChange={(value) =>
                  commitDraft(
                    setDraft,
                    onApply,
                    (current) => {
                      const nextSpecs = { ...current.specs };

                      if (value) {
                        nextSpecs[field.specKey] = value;
                      } else {
                        delete nextSpecs[field.specKey];
                      }

                      if (field.specKey === "Марка" || field.specKey === "Марка авто") {
                        delete nextSpecs.Модель;
                      }

                      if (field.specKey === "Производитель") {
                        delete nextSpecs.Модель;
                      }

                      return {
                        ...current,
                        specs: nextSpecs,
                      };
                    },
                    draft
                  )
                }
              />
            ))}

            {dependentSpecFields.map((field) => {
              const parentValue = draft.specs?.[field.dependsOn] || "";
              const options = field.optionsFrom?.[parentValue] || [];

              return (
                <SidebarSelect
                  key={field.id}
                  value={draft.specs?.[field.specKey] || ""}
                  placeholder={field.label}
                  options={options}
                  onChange={(value) =>
                    commitDraft(
                      setDraft,
                      onApply,
                      (current) => {
                        const nextSpecs = { ...current.specs };

                        if (value) {
                          nextSpecs[field.specKey] = value;
                        } else {
                          delete nextSpecs[field.specKey];
                        }

                        return {
                          ...current,
                          specs: nextSpecs,
                        };
                      },
                      draft
                    )
                  }
                />
              );
            })}

            {rangeFields.map((field) => (
              <div key={field.id}>
                <div className="mb-2 text-xs font-medium text-ink-400">
                  {field.label}
                </div>
                <RangeFilter
                  from={draft[field.rangeFromKey] || ""}
                  to={draft[field.rangeToKey] || ""}
                  onChange={({ from, to }) =>
                    setDraft((current) => ({
                      ...current,
                      [field.rangeFromKey]: from,
                      [field.rangeToKey]: to,
                    }))
                  }
                  presets={field.presets || []}
                  selectOptions={
                    field.type === "year-range" ? field.options || [] : []
                  }
                />
              </div>
            ))}

            {sellerOptions.length > 0 ? (
              <div className="space-y-2">
                {sellerOptions.map((option) => {
                  const active = draft.sellerType === option.value;

                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-1 py-1.5 hover:bg-mist/70"
                    >
                      <span className="flex items-center gap-2.5">
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
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {toggleFields.map((field) => {
              const active = Boolean(draft[field.toggleKey]);

              return (
                <label
                  key={field.id}
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
                          [field.toggleKey]: !current[field.toggleKey],
                        }),
                        draft
                      )
                    }
                    className="h-4 w-4 rounded border-ink/20 text-sun focus:ring-sun/30"
                  />
                  <span className="text-sm text-ink-700">{field.label}</span>
                </label>
              );
            })}
          </FilterSection>
        )}

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
