import React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Search,
  X,
} from "lucide-react";
import { CATEGORY_SELECT_OPTIONS } from "../data/listingCategories";
import { getListingFilterGrid } from "../data/filterGrids";
import { getDistrictsForCity } from "../data/realEstate";
import { formatPriceInput, getPriceDigits } from "../data/specOptions";
import { Building2 } from "lucide-react";

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
          className={`w-full h-12 appearance-none rounded-xl bg-white px-4 pr-10 text-sm outline-none transition shadow-sm border border-white/80 focus:ring-2 focus:ring-lagoon/30 disabled:bg-slate-100 disabled:text-slate-400 ${
            value ? "text-slate-900 font-medium" : "text-slate-500"
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
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

function formatPriceSummary(from, to, currency = "с.") {
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

function PriceFilterPopover({ draft, setDraft, onApply }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const panelRef = React.useRef(null);
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

  const summary = formatPriceSummary(draft.priceFrom, draft.priceTo, currency);

  const panel =
    open && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[300] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
            style={{
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
            }}
          >
            <div className="flex items-stretch gap-2">
              <div className="flex flex-1 h-11 rounded-lg border border-slate-200 overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="от"
                  value={draft.priceFrom ? formatPriceInput(draft.priceFrom) : ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceFrom: getPriceDigits(e.target.value),
                    }))
                  }
                  className="w-1/2 h-full px-3 text-sm outline-none border-r border-slate-200 placeholder:text-slate-400"
                />

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="до"
                  value={draft.priceTo ? formatPriceInput(draft.priceTo) : ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceTo: getPriceDigits(e.target.value),
                    }))
                  }
                  className="w-1/2 h-full px-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  value={currency}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      priceCurrency: e.target.value,
                    }))
                  }
                  className="h-11 min-w-[4.5rem] appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-lagoon/30"
                >
                  <option value="с.">с.</option>
                  <option value="$">$</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
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
        className={`w-full h-12 flex items-center justify-between gap-3 rounded-xl bg-white px-4 text-sm outline-none transition shadow-sm border border-white/80 hover:border-slate-200 focus:ring-2 focus:ring-lagoon/30 ${
          summary ? "text-slate-900 font-medium" : "text-slate-500"
        }`}
      >
        <span className="truncate">{summary || "Цена"}</span>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-slate-400" />
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
        placeholder="Все подкатегории"
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
        placeholder={districts.length ? field.label : "Сначала город"}
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
        placeholder="Поиск по названию"
        className="w-full h-12 rounded-xl bg-white px-4 text-sm outline-none shadow-sm border border-white/80 focus:ring-2 focus:ring-lagoon/30"
      />
    );
  }

  if (field.type === "sort") {
    const sortLabels = grid?.sortOptions || {
      new: "Сначала новые",
      views_desc: "Сначала популярные",
      price_asc: "Цена по возрастанию",
      price_desc: "Цена по убыванию",
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

  if (field.type === "range") {
    const fromKey = field.rangeFromKey;
    const toKey = field.rangeToKey;

    return (
      <label className="block">
        <span className="sr-only">{field.label}</span>
        <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm">
          <span className="hidden xl:flex items-center px-3 text-xs font-semibold text-slate-500 shrink-0 border-r">
            {field.label}
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder={field.placeholderFrom || "от"}
            value={draft[fromKey] || ""}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                [fromKey]: e.target.value.replace(/[^\d]/g, ""),
              }))
            }
            className="w-1/2 px-3 text-sm outline-none border-r"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder={field.placeholderTo || "до"}
            value={draft[toKey] || ""}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                [toKey]: e.target.value.replace(/[^\d]/g, ""),
              }))
            }
            className="w-1/2 px-3 text-sm outline-none"
          />
        </div>
      </label>
    );
  }

  if (field.type === "toggle") {
    const active = Boolean(draft[field.toggleKey]);

    return (
      <button
        type="button"
        onClick={() =>
          commitDraft(setDraft, onApply, (current) => ({
            ...current,
            [field.toggleKey]: !current[field.toggleKey],
          }), draft)
        }
        className={`h-12 w-full rounded-xl border px-4 text-sm font-semibold transition ${
          active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white text-slate-600 border-white/80 shadow-sm"
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
}) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const grid = React.useMemo(
    () => getListingFilterGrid(activeCat, draft.subcategory),
    [activeCat, draft.subcategory]
  );

  const showCompanyFilter =
    activeCat === "realestate" || activeCat === "transport";

  const saveSearch = () => {
    const key = "oriyon_saved_searches";
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    const label = [
      draft.subcategory,
      draft.specs?.Марка || draft.specs?.Производитель,
      draft.location || draft.region,
      draft.sellerType === "company" ? "Премиум" : "",
    ]
      .filter(Boolean)
      .join(" · ");

    saved.unshift({
      label: label || "Поиск без названия",
      params: draft,
      cat: activeCat,
      savedAt: Date.now(),
    });

    localStorage.setItem(key, JSON.stringify(saved.slice(0, 8)));
  };

  return (
    <div
      className={`rounded-2xl border border-lagoon/15 bg-gradient-to-br from-lagoon-50/80 to-emerald-50/50 ${
        compact ? "p-0 border-0 bg-transparent" : "p-4 md:p-5"
      }`}
    >
      <div className={`space-y-3 ${compact ? "pb-24" : ""}`}>
        {grid.rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
          >
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
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showCompanyFilter && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() =>
              commitDraft(setDraft, onApply, (current) => ({
                ...current,
                sellerType:
                  current.sellerType === "company" ? "" : "company",
              }), draft)
            }
            className={`h-12 w-full rounded-xl border px-4 text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${
              draft.sellerType === "company"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-white/80 shadow-sm hover:border-blue-200"
            }`}
          >
            <Building2 size={16} />
            {draft.sellerType === "company"
              ? "Только премиум"
              : "Показать премиум-объявления"}
          </button>
        </div>
      )}

      {moreOpen && grid.more?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-lagoon/10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {grid.more.map((field) => (
            <div key={field.id} className="space-y-1">
              {(field.type === "search" || field.type === "sort") && (
                <div className="text-xs font-medium text-slate-500 px-1">
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
              })}
            </div>
          ))}
        </div>
      )}

      <div
        className={`mt-4 pt-4 border-t border-lagoon/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 ${
          compact
            ? "sticky bottom-0 z-10 -mx-0 px-3 py-3 bg-white border-t border-slate-200 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
            : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {grid.more?.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-lagoon hover:text-lagoon-700 transition"
            >
              {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {moreOpen ? "Меньше фильтров" : "Больше фильтров"}
            </button>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              <X size={15} />
              Сбросить фильтры
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            type="button"
            onClick={saveSearch}
            className="inline-flex justify-center items-center gap-2 h-11 px-4 rounded-xl border border-lagoon text-lagoon bg-white hover:bg-lagoon-50 transition text-sm font-medium"
          >
            <Heart size={16} />
            Сохранить поиск
          </button>

          <button
            type="button"
            onClick={() => onApply()}
            className="inline-flex justify-center items-center gap-2 h-11 px-5 rounded-xl bg-lagoon text-white hover:bg-lagoon-700 transition text-sm font-semibold shadow-sm"
          >
            <Search size={16} />
            {previewLoading
              ? "Показать…"
              : `Показать (${previewTotal.toLocaleString("ru-RU")})`}
          </button>
        </div>
      </div>
    </div>
  );
}
