import React from "react";
import { Search } from "lucide-react";
import { useI18n } from "../../i18n";

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`listing-form-chip ${active ? "listing-form-chip--active" : ""}`}
    >
      {label}
    </button>
  );
}

export default function ListingFormSubcategoryPicker({
  cat,
  value,
  onChange,
}) {
  const { t } = useI18n();
  const groups = cat?.subGroups;
  const subs = cat?.subs || [];
  const [query, setQuery] = React.useState("");
  const needle = query.trim().toLowerCase();
  const showSearch = (groups?.length || subs.length) > 8;

  if (groups?.length) {
    const visible = groups
      .map(({ group, items }) => ({
        group,
        items: items.filter((item) => {
          if (!needle) return true;
          return `${group} ${item}`.toLowerCase().includes(needle);
        }),
      }))
      .filter((row) => row.items.length);

    return (
      <div className="space-y-4">
        {showSearch ? (
          <label className="listing-form-search">
            <Search className="listing-form-search__icon" size={16} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("listing.subcategorySearch")}
              className="listing-form-search__input"
            />
          </label>
        ) : null}

        {visible.map(({ group, items }) => (
          <div key={group}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              {group}
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const next = `${group} — ${item}`;
                return (
                  <Chip
                    key={next}
                    label={item}
                    active={value === next}
                    onClick={() => onChange(next)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {subs.some((sub) => !sub.includes(" — ")) ? (
          <div className="flex flex-wrap gap-2">
            {subs
              .filter((sub) => !sub.includes(" — "))
              .filter((sub) => !needle || sub.toLowerCase().includes(needle))
              .map((sub) => (
                <Chip
                  key={sub}
                  label={sub}
                  active={value === sub}
                  onClick={() => onChange(sub)}
                />
              ))}
          </div>
        ) : null}
      </div>
    );
  }

  const filtered = needle
    ? subs.filter((sub) => sub.toLowerCase().includes(needle))
    : subs;

  return (
    <div className="space-y-3">
      {showSearch ? (
        <label className="listing-form-search">
          <Search className="listing-form-search__icon" size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("listing.subcategorySearch")}
            className="listing-form-search__input"
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {filtered.map((sub) => (
          <Chip
            key={sub}
            label={sub}
            active={value === sub}
            onClick={() => onChange(sub)}
          />
        ))}
      </div>
    </div>
  );
}
