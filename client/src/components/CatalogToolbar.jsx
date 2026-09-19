import React from "react";
import { ArrowUpDown, ChevronDown, LayoutGrid, List } from "lucide-react";

const VIEW_KEY = "oriyon_catalog_view";

export function readCatalogView() {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function persistCatalogView(view) {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    /* ignore */
  }
}

export default function CatalogToolbar({
  t,
  sort = "new",
  sortLabels,
  onSortChange,
  view = "grid",
  onViewChange,
}) {
  return (
    <div className="catalog-toolbar">
      <label className="catalog-sort">
        <ArrowUpDown size={16} className="shrink-0 text-ink-400" />
        <select
          value={sort || "new"}
          onChange={(event) => onSortChange(event.target.value)}
          aria-label={t("filter.sort")}
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none shrink-0 text-ink-300"
        />
      </label>

      <div className="catalog-view" role="group" aria-label={t("listing.viewMode")}>
        <button
          type="button"
          aria-pressed={view === "grid"}
          aria-label={t("listing.viewGrid")}
          className={view === "grid" ? "is-active" : ""}
          onClick={() => onViewChange("grid")}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          aria-pressed={view === "list"}
          aria-label={t("listing.viewList")}
          className={view === "list" ? "is-active" : ""}
          onClick={() => onViewChange("list")}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
