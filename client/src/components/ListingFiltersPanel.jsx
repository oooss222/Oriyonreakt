import React from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Search,
  X,
} from "lucide-react";
import { CATEGORY_SELECT_OPTIONS } from "../data/listingCategories";
import {
  getListingFilterGrid,
  PRICE_PRESETS,
} from "../data/filterGrids";

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

function PriceFilterSelect({ draft, setDraft }) {
  const selectedLabel =
    PRICE_PRESETS.find(
      (item) =>
        item.from === (draft.priceFrom || "") && item.to === (draft.priceTo || "")
    )?.label || "";

  return (
    <FilterSelect
      label="Цена"
      placeholder="Цена"
      value={selectedLabel === "Любая" ? "" : selectedLabel}
      options={PRICE_PRESETS.filter((item) => item.label !== "Любая").map(
        (item) => item.label
      )}
      onChange={(label) => {
        const selected =
          PRICE_PRESETS.find((item) => item.label === label) ||
          PRICE_PRESETS[0];

        setDraft((current) => ({
          ...current,
          priceFrom: selected.from,
          priceTo: selected.to,
        }));
      }}
    />
  );
}

function renderField(
  field,
  {
    draft,
    setDraft,
    availableSubcategories,
    showCategorySelect,
  }
) {
  if (!field) return <div className="hidden xl:block" aria-hidden="true" />;

  if (field.type === "subcategory") {
    return (
      <FilterSelect
        label={field.label}
        placeholder={field.label}
        value={draft.subcategory}
        options={availableSubcategories}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            subcategory: value,
            specs: {},
          }))
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

          setDraft((current) => ({
            ...current,
            cat: nextCat,
            subcategory: "",
            specs: {},
          }));
        }}
      />
    );
  }

  if (field.type === "price") {
    return <PriceFilterSelect draft={draft} setDraft={setDraft} />;
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
          setDraft((current) => {
            const nextSpecs = { ...current.specs };

            if (value) {
              nextSpecs[specKey] = value;
            } else {
              delete nextSpecs[specKey];
            }

            if (specKey === "Марка") {
              delete nextSpecs.Модель;
            }

            if (specKey === "Производитель") {
              delete nextSpecs.Модель;
            }

            return {
              ...current,
              specs: nextSpecs,
            };
          })
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
          setDraft((current) => {
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
          })
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
          setDraft((current) => ({
            ...current,
            region: value,
          }))
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
          setDraft((current) => ({
            ...current,
            location: value,
          }))
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
    const sortLabels = {
      new: "Сначала новые",
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

          setDraft((current) => ({
            ...current,
            sort: nextSort,
          }));
        }}
      />
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
}) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const grid = React.useMemo(
    () => getListingFilterGrid(activeCat, draft.subcategory),
    [activeCat, draft.subcategory]
  );

  const saveSearch = () => {
    const key = "oriyon_saved_searches";
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    const label = [
      draft.subcategory,
      draft.specs?.Марка || draft.specs?.Производитель,
      draft.location || draft.region,
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
        compact ? "p-3" : "p-4 md:p-5"
      }`}
    >
      <div className="space-y-3">
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
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

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
              })}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-lagoon/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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
            onClick={onApply}
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
