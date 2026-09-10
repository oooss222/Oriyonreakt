import React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import { CATEGORY_SELECT_OPTIONS } from "../data/listingCategories";
import { getListingFilterGrid } from "../data/filterGrids";
import { getDistrictsForCity } from "../data/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import RangeFilter from "./filters/RangeFilter";
import { getSellerFilterOptions } from "../lib/filterConflicts";
import { useI18n } from "../i18n";
import { Chip, Input, Select, cn } from "../ui";

function FilterSelect({
  label,
  value,
  placeholder,
  options = [],
  onChange,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <Select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        options={options}
        className={value ? "font-medium" : "text-ink-400"}
      />
    </label>
  );
}

function formatPriceSummary(t, from, to, currency) {
  const fromLabel = from ? formatPriceInput(from) : "";
  const toLabel = to ? formatPriceInput(to) : "";

  if (fromLabel && toLabel) {
    return `${t("filter.rangeBoth", { from: fromLabel, to: toLabel })} ${currency}`;
  }

  if (fromLabel) {
    return `${t("filter.rangeFrom", { from: fromLabel })} ${currency}`;
  }

  if (toLabel) {
    return `${t("filter.rangeTo", { to: toLabel })} ${currency}`;
  }

  return "";
}

function PriceFilterPopover({ draft, setDraft, onApply }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const panelId = React.useId();
  const [panelStyle, setPanelStyle] = React.useState(null);
  const draftRef = React.useRef(draft);
  const currency = draft.priceCurrency || "с.";

  draftRef.current = draft;

  const closePopover = React.useCallback(
    (shouldApply = false) => {
      setOpen(false);
      if (shouldApply) {
        onApply?.(draftRef.current);
      }
    },
    [onApply]
  );

  React.useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setPanelStyle(null);
      return undefined;
    }

    const update = () => {
      const rect = rootRef.current.getBoundingClientRect();
      const panelHeight = panelRef.current?.offsetHeight || 72;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < panelHeight + 16 && rect.top > panelHeight + 16;
      const width = Math.min(rect.width, window.innerWidth - 32);

      setPanelStyle({
        top: openUp ? rect.top - panelHeight - 8 : rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        width,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        closePopover(true);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open, closePopover]);

  const summary = formatPriceSummary(t, draft.priceFrom, draft.priceTo, currency);

  const panel =
    open && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={t("filter.price")}
            className="card fixed z-[300] p-3 shadow-lg"
            style={{
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
            }}
          >
            <div className="flex items-stretch gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("filter.from")}
                  aria-label={`${t("filter.price")}, ${t("filter.from")}`}
                  value={draft.priceFrom ? formatPriceInput(draft.priceFrom) : ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceFrom: getPriceDigits(e.target.value),
                    }))
                  }
                  className="input"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("filter.to")}
                  aria-label={`${t("filter.price")}, ${t("filter.to")}`}
                  value={draft.priceTo ? formatPriceInput(draft.priceTo) : ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceTo: getPriceDigits(e.target.value),
                    }))
                  }
                  className="input"
                />
              </div>

              <select
                value={currency}
                aria-label={t("filter.currency")}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    priceCurrency: e.target.value,
                  }))
                }
                className="select w-[5.5rem] shrink-0"
              >
                <option value="с.">{t("price.currency")}</option>
                <option value="$">$</option>
              </select>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          "input flex items-center justify-between gap-3 text-left",
          summary ? "font-medium" : "text-ink-400"
        )}
      >
        <span className="truncate">{summary || t("filter.price")}</span>
        {open ? (
          <ChevronUp size={18} aria-hidden="true" className="shrink-0 text-ink-400" />
        ) : (
          <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-ink-400" />
        )}
      </button>

      {panel}
    </div>
  );
}

function commitDraft(setDraft, onApply, updater, current) {
  const next = updater(current);
  setDraft(next);
  onApply?.(next);
}

function renderField(
  field,
  {
    draft,
    setDraft,
    availableSubcategories,
    showCategorySelect,
    onApply,
    hideSubcategoryField = false,
    grid,
    t,
  }
) {
  if (!field) return <div className="hidden xl:block" aria-hidden="true" />;

  if (field.type === "subcategory") {
    if (hideSubcategoryField) {
      return null;
    }

    return (
      <FilterSelect
        label={field.label}
        placeholder={t("filter.allSubcategories")}
        value={draft.subcategory}
        options={availableSubcategories}
        onChange={(value) =>
          commitDraft(setDraft, onApply, (current) => ({
            ...current,
            subcategory: value,
            specs: {},
            areaFrom: "",
            areaTo: "",
            floorFrom: "",
            floorTo: "",
            floorNotFirst: false,
            floorNotLast: false,
          }), draft)
        }
      />
    );
  }

  if (field.type === "category") {
    if (!showCategorySelect) {
      return <div className="hidden xl:block" aria-hidden="true" />;
    }

    const label =
      CATEGORY_SELECT_OPTIONS.find((item) => item.value === draft.cat)?.label ||
      "";

    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={label}
        options={CATEGORY_SELECT_OPTIONS.filter((item) => item.value).map(
          (item) => item.label
        )}
        onChange={(nextLabel) => {
          const nextCat =
            CATEGORY_SELECT_OPTIONS.find((item) => item.label === nextLabel)
              ?.value || "";

          commitDraft(setDraft, onApply, (current) => ({
            ...current,
            cat: nextCat,
            subcategory: "",
            specs: {},
          }), draft);
        }}
      />
    );
  }

  if (field.type === "price") {
    return (
      <PriceFilterPopover
        draft={draft}
        setDraft={setDraft}
        onApply={onApply}
      />
    );
  }

  if (field.type === "spec") {
    const specKey = field.specKey || field.id;

    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={draft.specs?.[specKey] || ""}
        options={field.options || []}
        onChange={(value) =>
          commitDraft(setDraft, onApply, (current) => {
            const nextSpecs = { ...current.specs };

            if (value) {
              nextSpecs[specKey] = value;
            } else {
              delete nextSpecs[specKey];
            }

            if (specKey === "Марка" || specKey === "Марка авто") {
              delete nextSpecs.Модель;
            }

            if (specKey === "Производитель") {
              delete nextSpecs.Модель;
            }

            return {
              ...current,
              specs: nextSpecs,
            };
          }, draft)
        }
      />
    );
  }

  if (field.type === "spec-dependent") {
    const parentValue = draft.specs?.[field.dependsOn] || "";
    const options = field.optionsFrom?.[parentValue] || [];

    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={draft.specs?.[field.specKey] || ""}
        options={options}
        disabled={!parentValue}
        onChange={(value) =>
          commitDraft(setDraft, onApply, (current) => {
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
          }, draft)
        }
      />
    );
  }

  if (field.type === "city-district") {
    const districts = getDistrictsForCity(draft.location || "Душанбе");

    return (
      <FilterSelect
        label={field.label}
        placeholder={districts.length ? field.label : t("filter.selectCityFirst")}
        value={draft.specs?.[field.specKey] || ""}
        options={districts}
        disabled={!districts.length}
        onChange={(value) =>
          commitDraft(setDraft, onApply, (current) => {
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
          }, draft)
        }
      />
    );
  }

  if (field.type === "region") {
    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={draft.region || ""}
        options={field.options || []}
        onChange={(value) =>
          commitDraft(setDraft, onApply, (current) => ({
            ...current,
            region: value,
          }), draft)
        }
      />
    );
  }

  if (field.type === "location") {
    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={draft.location || ""}
        options={field.options || []}
        onChange={(value) =>
          commitDraft(setDraft, onApply, (current) => {
            const nextSpecs = { ...current.specs };
            const districts = getDistrictsForCity(value || "Душанбе");
            const currentDistrict = nextSpecs["Район"];

            if (currentDistrict && !districts.includes(currentDistrict)) {
              delete nextSpecs["Район"];
            }

            return {
              ...current,
              location: value,
              specs: nextSpecs,
            };
          }, draft)
        }
      />
    );
  }

  if (field.type === "search") {
    return (
      <label className="block">
        <span className="sr-only">{field.label}</span>
        <Input
          iconLeft={Search}
          value={draft.search}
          onChange={(e) =>
            setDraft((current) => ({
              ...current,
              search: e.target.value,
            }))
          }
          placeholder={t("filter.searchPlaceholder")}
        />
      </label>
    );
  }

  if (field.type === "sort") {
    const sortLabels = grid?.sortOptions || {
      new: t("filter.sortNew"),
      views_desc: t("filter.sortPopular"),
      price_asc: t("filter.sortPriceAsc"),
      price_desc: t("filter.sortPriceDesc"),
    };

    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={sortLabels[draft.sort] || sortLabels.new}
        options={Object.values(sortLabels)}
        onChange={(label) => {
          const nextSort =
            Object.entries(sortLabels).find(([, value]) => value === label)?.[0] ||
            "new";

          commitDraft(setDraft, onApply, (current) => ({
            ...current,
            sort: nextSort,
          }), draft);
        }}
      />
    );
  }

  if (field.type === "range" || field.type === "year-range" || field.type === "mileage-range") {
    const fromKey = field.rangeFromKey;
    const toKey = field.rangeToKey;

    return (
      <div>
        <span className="field-label">{field.label}</span>
        <RangeFilter
          label={field.label}
          from={draft[fromKey] || ""}
          to={draft[toKey] || ""}
          onChange={({ from, to }) =>
            setDraft((current) => ({
              ...current,
              [fromKey]: from,
              [toKey]: to,
            }))
          }
          presets={field.presets || []}
          selectOptions={field.type === "year-range" ? field.options || [] : []}
        />
      </div>
    );
  }

  if (field.type === "toggle") {
    const active = Boolean(draft[field.toggleKey]);

    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() =>
          commitDraft(setDraft, onApply, (current) => ({
            ...current,
            [field.toggleKey]: !current[field.toggleKey],
          }), draft)
        }
        className={cn("btn btn-block h-11", active && "btn-accent")}
      >
        {field.label}
      </button>
    );
  }

  return null;
}

export default function ListingFiltersPanel({
  draft,
  setDraft,
  activeCat,
  availableSubcategories,
  showCategorySelect = false,
  onApply,
  onReset,
  previewTotal = 0,
  previewLoading = false,
  hasActiveFilters = false,
  compact = false,
  hideSubcategoryField = false,
  layout = "default",
}) {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const moreId = React.useId();
  const grid = React.useMemo(
    () => getListingFilterGrid(activeCat, draft.subcategory),
    [activeCat, draft.subcategory]
  );

  const sellerOptions =
    activeCat === "realestate"
      ? getSellerFilterOptions(
          draft.specs?.["Тип сделки"] || "",
          draft.subcategory
        )
      : activeCat === "transport"
        ? [
            { value: "private", label: t("filter.sellerPrivate") },
            { value: "company", label: t("filter.sellerCompany") },
          ]
        : [];

  const isSidebar = layout === "sidebar";
  const rowGridClass = isSidebar
    ? "grid grid-cols-1 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3";
  const moreGridClass = isSidebar
    ? "grid grid-cols-1 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3";

  return (
    <div
      className={cn(
        "filter-panel",
        compact ? "border-0 bg-transparent p-0 shadow-none" : "p-4 md:p-5"
      )}
    >
      <div className={cn("space-y-3", compact && "pb-24")}>
        {grid.rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className={rowGridClass}>
            {row.map((field, fieldIndex) => (
              <div key={field?.id || `empty-${rowIndex}-${fieldIndex}`}>
                {renderField(field, {
                  draft,
                  setDraft,
                  availableSubcategories,
                  showCategorySelect,
                  onApply,
                  hideSubcategoryField,
                  grid,
                  t,
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {sellerOptions.length > 0 && (
        <div
          role="group"
          aria-label={t("filter.seller")}
          className="mt-3 flex flex-wrap gap-2"
        >
          <Chip
            active={!draft.sellerType}
            className="filter-chip"
            onClick={() =>
              commitDraft(setDraft, onApply, (current) => ({
                ...current,
                sellerType: "",
              }), draft)
            }
          >
            {t("filter.any")}
          </Chip>

          {sellerOptions.map((option) => (
            <Chip
              key={option.value}
              active={draft.sellerType === option.value}
              className="filter-chip"
              onClick={() =>
                commitDraft(setDraft, onApply, (current) => ({
                  ...current,
                  sellerType:
                    current.sellerType === option.value ? "" : option.value,
                }), draft)
              }
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      {moreOpen && grid.more?.length > 0 && (
        <div
          id={moreId}
          className={cn("mt-3 border-t border-ink-200 pt-3", moreGridClass)}
        >
          {grid.more.map((field) => (
            <div key={field.id} className="space-y-1">
              {(field.type === "search" || field.type === "sort") && (
                <span className="field-label">{field.label}</span>
              )}
              {renderField(field, {
                draft,
                setDraft,
                availableSubcategories,
                showCategorySelect,
                onApply,
                hideSubcategoryField,
                grid,
                t,
              })}
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "mt-4 flex flex-col gap-3 border-t border-ink-200 pt-4 lg:flex-row lg:items-center lg:justify-between",
          compact &&
            "sticky bottom-0 z-10 bg-white px-3 py-3 shadow-[0_-8px_24px_rgb(18_22_27_/_0.08)]"
        )}
      >
        <div className="flex flex-wrap items-center gap-4">
          {grid.more?.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              aria-controls={moreOpen ? moreId : undefined}
              className="inline-flex min-h-[2.5rem] items-center gap-1.5 text-sm font-semibold text-sun-700 transition-colors hover:text-sun-600"
            >
              {moreOpen ? (
                <ChevronUp size={16} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} aria-hidden="true" />
              )}
              {moreOpen ? t("filter.lessFilters") : t("filter.moreFilters")}
            </button>
          )}

          {hasActiveFilters && (
            <button type="button" onClick={onReset} className="filter-reset">
              <X size={15} aria-hidden="true" />
              {t("filter.reset")}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onApply()}
            className="btn btn-primary h-11 px-5"
          >
            <Search size={16} aria-hidden="true" />
            {previewLoading
              ? t("filter.showLoading")
              : t("filter.showCount", {
                  count: previewTotal.toLocaleString("ru-RU"),
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
