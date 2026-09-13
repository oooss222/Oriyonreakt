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
import { commitDraft, clearDependentModelSpec } from "../lib/filterDraft";
import { useI18n } from "../i18n";

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
      <div className="relative">
        <select
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-12 appearance-none rounded-xl bg-white px-4 pr-10 text-sm outline-none transition shadow-sm border border-white/80 focus:ring-2 focus:ring-sun/40 disabled:bg-mist-100 disabled:text-ink-400 ${
            value ? "text-ink-900 font-medium" : "text-ink-500"
          }`}
        >
          <option value="">{placeholder || label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </div>
    </label>
  );
}

function formatPriceSummary(from, to, currency = "с.", t) {
  const fromLabel = from ? formatPriceInput(from) : "";
  const toLabel = to ? formatPriceInput(to) : "";

  if (fromLabel && toLabel) {
    return `${fromLabel} – ${toLabel} ${currency}`;
  }

  if (fromLabel) {
    return `${t("filter.from")} ${fromLabel} ${currency}`;
  }

  if (toLabel) {
    return `${t("filter.to")} ${toLabel} ${currency}`;
  }

  return "";
}

function PriceFilterPopover({ draft, setDraft, onApply, presets = [] }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const [panelStyle, setPanelStyle] = React.useState(null);
  const draftRef = React.useRef(draft);
  const currency = "с.";

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
      const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 32);

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
  }, [open, presets.length]);

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

  const summary = formatPriceSummary(draft.priceFrom, draft.priceTo, currency, t);

  const panel =
    open && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[300] rounded-xl border border-mist-200 bg-white p-3 shadow-xl"
            style={{
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
            }}
          >
            <div className="flex items-stretch gap-2">
              <div className="flex flex-1 h-11 rounded-lg border border-mist-200 overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("filter.from")}
                  value={draft.priceFrom ? formatPriceInput(draft.priceFrom) : ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceFrom: getPriceDigits(e.target.value),
                    }))
                  }
                  className="w-1/2 h-full px-3 text-sm outline-none border-r border-mist-200 placeholder:text-ink-400"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("filter.to")}
                  value={draft.priceTo ? formatPriceInput(draft.priceTo) : ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceTo: getPriceDigits(e.target.value),
                    }))
                  }
                  className="w-1/2 h-full px-3 text-sm outline-none placeholder:text-ink-400"
                />
              </div>

              <div className="inline-flex h-11 min-w-[3.5rem] items-center justify-center rounded-lg border border-mist-200 bg-mist-50 px-3 text-sm font-semibold text-ink-600">
                с.
              </div>
            </div>

            {presets.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const active =
                    String(draft.priceFrom || "") === String(preset.from || "") &&
                    String(draft.priceTo || "") === String(preset.to || "");
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className={`chip ${active ? "chip-active" : ""}`}
                      onClick={() => {
                        const next = {
                          ...draftRef.current,
                          priceFrom: preset.from ? String(preset.from) : "",
                          priceTo: preset.to ? String(preset.to) : "",
                        };
                        setDraft(next);
                        onApply?.(next);
                        setOpen(false);
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`w-full h-12 flex items-center justify-between gap-3 rounded-xl bg-white px-4 text-sm outline-none transition shadow-sm border border-white/80 hover:border-mist-200 focus:ring-2 focus:ring-sun/40 ${
          summary ? "text-ink-900 font-medium" : "text-ink-500"
        }`}
      >
        <span className="truncate">{summary || t("form.price")}</span>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-ink-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-ink-400" />
        )}
      </button>

      {panel}
    </div>
  );
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
        presets={field.presets || []}
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

            clearDependentModelSpec(nextSpecs, specKey);

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
      <input
        value={draft.search}
        onChange={(e) =>
          setDraft((current) => ({
            ...current,
            search: e.target.value,
          }))
        }
        placeholder={t("filter.searchByTitle")}
        className="w-full h-12 rounded-xl bg-white px-4 text-sm outline-none shadow-sm border border-white/80 focus:ring-2 focus:ring-sun/40"
      />
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
        <div className="mb-1 text-xs font-medium text-ink-500 px-1">{field.label}</div>
        <RangeFilter
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
          fromPlaceholder={t("filter.from")}
          toPlaceholder={t("filter.to")}
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
        className={`h-12 w-full rounded-xl border px-4 text-sm font-semibold transition ${
          active
            ? "bg-ink-900 text-white border-ink-900"
            : "bg-white text-ink-600 border-white/80 shadow-sm"
        }`}
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
  hideActions = false,
  layout = "default",
}) {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = React.useState(false);
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
      className={`filter-panel ${
        compact ? "p-0 border-0 shadow-none bg-transparent" : "p-4 md:p-5"
      }`}
    >
      <div className={`space-y-3 ${compact && !hideActions ? "pb-24" : ""}`}>
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
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t("filter.sellerType")}>
          <button
            type="button"
            role="radio"
            aria-checked={!draft.sellerType}
            onClick={() =>
              commitDraft(setDraft, onApply, (current) => ({
                ...current,
                sellerType: "",
              }), draft)
            }
            className={`chip ${!draft.sellerType ? "chip-active" : ""}`}
          >
            {t("filter.any")}
          </button>
          {sellerOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={draft.sellerType === option.value}
              onClick={() =>
                commitDraft(setDraft, onApply, (current) => ({
                  ...current,
                  sellerType:
                    current.sellerType === option.value ? "" : option.value,
                }), draft)
              }
              className={`chip ${
                draft.sellerType === option.value ? "chip-active" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {moreOpen && grid.more?.length > 0 && (
        <div className={`mt-3 pt-3 border-t border-ink/10 ${moreGridClass}`}>
          {grid.more.map((field) => (
            <div key={field.id} className="space-y-1">
              {(field.type === "search" || field.type === "sort") && (
                <div className="text-xs font-medium text-ink-400 px-1">
                  {field.label}
                </div>
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

      {!hideActions ? (
      <div
        className={`mt-4 pt-4 border-t border-ink/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${
          compact
            ? "sticky bottom-0 z-10 -mx-0 px-3 py-3 bg-white border-t border-mist-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
            : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {grid.more?.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sun hover:text-sun-700 transition"
            >
              {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {moreOpen ? t("filter.fewerFilters") : t("filter.moreFilters")}
            </button>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition"
            >
              <X size={15} />
              {t("filter.reset")}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:ml-auto">
          <button
            type="button"
            onClick={() => onApply()}
            className="inline-flex justify-center items-center gap-2 h-11 px-5 rounded-xl bg-sun text-white hover:bg-sun-600 transition text-sm font-semibold shadow-sm"
          >
            <Search size={16} />
            {previewLoading
              ? t("filter.showLoading")
              : t("filter.showCount", {
                  count: previewTotal.toLocaleString("ru-RU"),
                })}
          </button>
        </div>
      </div>
      ) : grid.more?.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-ink/10">
          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sun hover:text-sun-700 transition"
          >
            {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {moreOpen ? t("filter.fewerFilters") : t("filter.moreFilters")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
