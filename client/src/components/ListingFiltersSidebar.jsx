import React from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { getListingFilterGrid } from "../data/filterGrids";
import { LOCATIONS, formatPriceInput, getPriceDigits, COMMON_SPEC_OPTIONS } from "../data/specOptions";
import RangeFilter from "./filters/RangeFilter";
import { getDistrictsForCity } from "../data/realEstate";
import { useI18n } from "../i18n";
import { Checkbox, Chip, Field, Input, Radio, Select, cn } from "../ui";

function commitDraft(setDraft, onApply, updater, current) {
  const next = updater(current);
  setDraft(next);
  onApply?.(next);
}

function FilterGroup({ title, defaultOpen = true, collapsible = true, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const baseId = React.useId();
  const labelId = `${baseId}-label`;
  const bodyId = `${baseId}-body`;

  return (
    <section className="filter-group" role="group" aria-labelledby={labelId}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="filter-group__toggle"
          aria-expanded={open}
          aria-controls={bodyId}
        >
          <span id={labelId} className="label-caps">
            {title}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn("filter-group__chevron", open && "filter-group__chevron--open")}
          />
        </button>
      ) : (
        <span id={labelId} className="label-caps">
          {title}
        </span>
      )}

      <div id={bodyId} className="filter-group__body" hidden={collapsible && !open}>
        {children}
      </div>
    </section>
  );
}

function RadioOption({ name, active, label, count, onSelect }) {
  return (
    <div className="filter-option">
      <Radio
        name={name}
        checked={active}
        onChange={onSelect}
        label={label}
        className="min-w-0 flex-1"
      />

      {typeof count === "number" ? (
        <span className="filter-option__count">{count.toLocaleString("ru-RU")}</span>
      ) : null}
    </div>
  );
}

function ChipGroup({ label, value, options, onChange }) {
  const labelId = React.useId();

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
      <span id={labelId} className="sr-only">
        {label}
      </span>

      {options.map((option) => (
        <Chip
          key={option.value || "__all__"}
          active={value === option.value}
          className="filter-chip"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Chip>
      ))}
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
  activeFilterCount = 0,
}) {
  const { t } = useI18n();
  const subcategoryName = React.useId();
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

  const setSpec = (specKey, value, extra = {}) =>
    commitDraft(
      setDraft,
      onApply,
      (current) => {
        const nextSpecs = { ...current.specs };

        if (value) {
          nextSpecs[specKey] = value;
        } else {
          delete nextSpecs[specKey];
        }

        if (specKey === "Марка" || specKey === "Марка авто" || specKey === "Производитель") {
          delete nextSpecs.Модель;
        }

        return { ...current, specs: nextSpecs, ...extra };
      },
      draft
    );

  const selectSubcategory = (value) =>
    commitDraft(
      setDraft,
      onApply,
      (current) => ({
        ...current,
        subcategory: value,
        specs: {},
        areaFrom: "",
        areaTo: "",
        floorFrom: "",
        floorTo: "",
        floorNotFirst: false,
        floorNotLast: false,
      }),
      draft
    );

  const hasMoreFilters =
    extraSpecFields.length > 0 ||
    dependentSpecFields.length > 0 ||
    rangeFields.length > 0 ||
    Boolean(regionField) ||
    Boolean(districtField) ||
    sellerOptions.length > 0 ||
    toggleFields.length > 0;

  return (
    <div className="filter-sidebar">
      <div className="filter-sidebar__header">
        <SlidersHorizontal size={18} className="text-ink-500" aria-hidden="true" />
        <h2 className="text-base font-bold text-ink-900">{t("filter.title")}</h2>
        {activeFilterCount > 0 && (
          <span className="filter-sidebar__count">{activeFilterCount}</span>
        )}
      </div>

      <div className="filter-sidebar__body">
        <FilterGroup title={t("filter.keywords")}>
          <Input
            iconLeft={Search}
            value={draft.search}
            onChange={(event) =>
              setDraft((current) => ({ ...current, search: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onApply?.(draft);
              }
            }}
            placeholder={t("filter.keywordsPlaceholder")}
            aria-label={t("filter.keywords")}
          />
        </FilterGroup>

        {availableSubcategories.length > 0 ? (
          <FilterGroup title={t("filter.category")}>
            <div className="-mx-1">
              <RadioOption
                name={subcategoryName}
                active={!draft.subcategory}
                label={t("filter.allCategories")}
                count={categoryTotal}
                onSelect={() => selectSubcategory("")}
              />

              {availableSubcategories.map((sub) => (
                <RadioOption
                  key={sub}
                  name={subcategoryName}
                  active={draft.subcategory === sub}
                  label={sub}
                  count={statsBySubcategory[sub] || 0}
                  onSelect={() => selectSubcategory(sub)}
                />
              ))}
            </div>
          </FilterGroup>
        ) : null}

        <FilterGroup title={t("filter.price")}>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t("filter.from")}
              aria-label={`${t("filter.price")}, ${t("filter.from")}`}
              value={draft.priceFrom ? formatPriceInput(draft.priceFrom) : ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priceFrom: getPriceDigits(event.target.value),
                }))
              }
            />
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t("filter.to")}
              aria-label={`${t("filter.price")}, ${t("filter.to")}`}
              value={draft.priceTo ? formatPriceInput(draft.priceTo) : ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priceTo: getPriceDigits(event.target.value),
                }))
              }
            />
          </div>
        </FilterGroup>

        <FilterGroup title={t("filter.city")}>
          <ChipGroup
            label={t("filter.city")}
            value={draft.location || ""}
            options={[
              { value: "", label: t("filter.all") },
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
        </FilterGroup>

        <FilterGroup title={t("filter.condition")} defaultOpen={false}>
          <ChipGroup
            label={t("filter.condition")}
            value={conditionValue}
            options={[
              { value: "", label: t("filter.all") },
              ...COMMON_SPEC_OPTIONS.condition.map((option) => ({
                value: option,
                label: option === "Новый" ? "Новое" : option,
              })),
            ]}
            onChange={(value) => setSpec("Состояние", value)}
          />
        </FilterGroup>

        {hasMoreFilters && (
          <FilterGroup title={t("filter.more")} defaultOpen={false}>
            {regionField ? (
              <Field label={regionField.label}>
                {(props) => (
                  <Select
                    {...props}
                    value={draft.region || ""}
                    placeholder={t("filter.any")}
                    options={regionField.options || []}
                    onChange={(event) =>
                      commitDraft(
                        setDraft,
                        onApply,
                        (current) => ({
                          ...current,
                          region: event.target.value,
                          location: event.target.value ? "" : current.location,
                        }),
                        draft
                      )
                    }
                  />
                )}
              </Field>
            ) : null}

            {districtField ? (
              <Field label={districtField.label}>
                {(props) => (
                  <Select
                    {...props}
                    value={draft.specs?.[districtField.specKey] || ""}
                    placeholder={t("filter.any")}
                    options={getDistrictsForCity(draft.location || "Душанбе")}
                    onChange={(event) =>
                      setSpec(districtField.specKey, event.target.value)
                    }
                  />
                )}
              </Field>
            ) : null}

            {extraSpecFields.map((field) => (
              <Field key={field.id} label={field.label}>
                {(props) => (
                  <Select
                    {...props}
                    value={draft.specs?.[field.specKey] || ""}
                    placeholder={t("filter.any")}
                    options={field.options || []}
                    onChange={(event) => setSpec(field.specKey, event.target.value)}
                  />
                )}
              </Field>
            ))}

            {dependentSpecFields.map((field) => {
              const parentValue = draft.specs?.[field.dependsOn] || "";
              const options = field.optionsFrom?.[parentValue] || [];

              return (
                <Field key={field.id} label={field.label}>
                  {(props) => (
                    <Select
                      {...props}
                      value={draft.specs?.[field.specKey] || ""}
                      placeholder={t("filter.any")}
                      options={options}
                      disabled={!parentValue}
                      onChange={(event) => setSpec(field.specKey, event.target.value)}
                    />
                  )}
                </Field>
              );
            })}

            {rangeFields.map((field) => (
              <div key={field.id}>
                <span className="field-label">{field.label}</span>
                <RangeFilter
                  label={field.label}
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
              <div role="group" aria-label={t("filter.seller")} className="-mx-1">
                {sellerOptions.map((option) => (
                  <div key={option.value} className="filter-option">
                    <Checkbox
                      label={option.label}
                      checked={draft.sellerType === option.value}
                      onChange={() =>
                        commitDraft(
                          setDraft,
                          onApply,
                          (current) => ({
                            ...current,
                            sellerType:
                              current.sellerType === option.value ? "" : option.value,
                          }),
                          draft
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {toggleFields.length > 0 ? (
              <div className="-mx-1">
                {toggleFields.map((field) => (
                  <div key={field.id} className="filter-option">
                    <Checkbox
                      label={field.label}
                      checked={Boolean(draft[field.toggleKey])}
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
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </FilterGroup>
        )}
      </div>

      <div className="filter-sidebar__footer space-y-1.5">
        <button
          type="button"
          onClick={() => onApply()}
          className="filter-sidebar__apply"
        >
          {previewLoading ? t("filter.showLoading") : t("filter.showCount", { count: showCount })}
        </button>

        {hasActiveFilters ? (
          <button type="button" onClick={onReset} className="filter-reset w-full justify-center">
            <X size={15} aria-hidden="true" />
            {t("filter.reset")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
