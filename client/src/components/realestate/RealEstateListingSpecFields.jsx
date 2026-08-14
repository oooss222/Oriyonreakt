import React from "react";
import MultiPillGroup from "../filters/MultiPillGroup";

function ChipGroup({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(active ? "" : option)}
            className={`listing-form-chip ${active ? "listing-form-chip--active" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function RealEstateListingSpecFields({
  fields,
  onUpdateByName,
}) {
  if (!fields.length) {
    return (
      <div className="px-4 py-6 text-sm text-slate-500">
        Выберите тип объекта и сделки, чтобы заполнить параметры.
      </div>
    );
  }

  return (
    <div className="listing-form-spec-list">
      {fields.map((row) => {
        const useChips =
          row.type === "select" &&
          Array.isArray(row.options) &&
          row.options.length > 0 &&
          row.options.length <= 6;

        return (
          <div key={row.name} className="listing-form-spec-row">
            <div className="listing-form-spec-label">{row.name}</div>

            <div className="listing-form-spec-control">
              {row.type === "multi" ? (
                <MultiPillGroup
                  values={row.value || ""}
                  options={row.options || []}
                  onChange={(value) => onUpdateByName(row.name, value)}
                />
              ) : useChips ? (
                <ChipGroup
                  value={row.value || ""}
                  options={row.options || []}
                  onChange={(value) => onUpdateByName(row.name, value)}
                />
              ) : row.type === "select" ? (
                <select
                  value={row.value || ""}
                  onChange={(e) => onUpdateByName(row.name, e.target.value)}
                  className="listing-form-select"
                >
                  <option value="">Выберите</option>
                  {(row.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={row.value || ""}
                  onChange={(e) => onUpdateByName(row.name, e.target.value)}
                  placeholder={row.placeholder || ""}
                  className="listing-form-input"
                />
              )}
            </div>

            <div className="listing-form-spec-remove listing-form-spec-remove--spacer" />
          </div>
        );
      })}
    </div>
  );
}
