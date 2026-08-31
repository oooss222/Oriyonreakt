import React from "react";
import { getDependentOptions } from "../../data/specOptions";
import { useI18n } from "../../i18n";

const COLOR_SWATCHES = {
  Белый: "#ffffff",
  Чёрный: "#171717",
  Серый: "#9ca3af",
  Синий: "#2563eb",
  Красный: "#dc2626",
  Серебристый: "#c0c0c0",
};

function ChipGroup({ value, options, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
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

function ColorSwatches({ value, options, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const active = value === option;
        const swatch = COLOR_SWATCHES[option];
        const isOther = option === "Другой";

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            title={option}
            onClick={() => onChange(active ? "" : option)}
            className={`listing-form-color-swatch ${
              active ? "listing-form-color-swatch--active" : ""
            }`}
          >
            <span
              className="listing-form-color-swatch__dot"
              style={
                isOther
                  ? {
                      background:
                        "conic-gradient(#ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)",
                    }
                  : { backgroundColor: swatch || "#e5e7eb" }
              }
            />
          </button>
        );
      })}
      <span className="text-sm text-ink-400">{value || "Выберите цвет"}</span>
    </div>
  );
}

export default function ListingFormSpecFields({
  specs,
  onUpdate,
  onRemove,
  invalid = false,
}) {
  const { t } = useI18n();
  const [showMore, setShowMore] = React.useState(false);

  const locked = specs.filter((row) => row.locked);
  const unlocked = specs.filter((row) => !row.locked);
  const primaryLocked = locked.slice(0, 4);
  const extraLocked = locked.slice(4);
  const visibleLocked = showMore ? locked : primaryLocked;
  const visible = [...visibleLocked, ...(showMore ? unlocked : [])];

  return (
    <div className="listing-form-spec-list" data-field="specs">
      {visible.map((spec) => {
        const index = specs.findIndex((row) => row === spec);
        const selectOptions = getDependentOptions(spec, specs);
        const needsParent = Boolean(spec.dependsOn);
        const parentSelected = needsParent
          ? specs.some((row) => row.name === spec.dependsOn && row.value)
          : true;
        const disabled = needsParent && !parentSelected;
        const useChips =
          spec.type === "select" &&
          spec.name !== "Цвет" &&
          selectOptions.length > 0 &&
          selectOptions.length <= 5;
        const emptyRequired = spec.locked && !String(spec.value || "").trim();

        return (
          <div
            key={`${spec.name}-${index}`}
            className={`listing-form-spec-row ${
              invalid && emptyRequired ? "ring-1 ring-red-300 bg-red-50/40" : ""
            }`}
          >
            <div className="listing-form-spec-label">
              {spec.locked ? (
                <span className={emptyRequired && invalid ? "text-red-700" : ""}>
                  {spec.name}
                  <span className="text-red-500"> *</span>
                </span>
              ) : (
                <input
                  value={spec.name}
                  onChange={(e) => onUpdate(index, "name", e.target.value)}
                  placeholder="Название"
                  className="w-full bg-transparent outline-none text-sm font-medium text-ink-600"
                />
              )}
            </div>

            <div className="listing-form-spec-control">
              {spec.name === "Цвет" && spec.type === "select" ? (
                <ColorSwatches
                  value={spec.value}
                  options={selectOptions}
                  disabled={disabled}
                  onChange={(value) => onUpdate(index, "value", value)}
                />
              ) : useChips ? (
                <ChipGroup
                  value={spec.value}
                  options={selectOptions}
                  disabled={disabled}
                  onChange={(value) => onUpdate(index, "value", value)}
                />
              ) : spec.type === "select" ? (
                <select
                  value={spec.value}
                  onChange={(e) => onUpdate(index, "value", e.target.value)}
                  disabled={disabled}
                  className="listing-form-select"
                >
                  <option value="">
                    {disabled
                      ? `Сначала выберите ${spec.dependsOn?.toLowerCase()}`
                      : "Выберите"}
                  </option>
                  {selectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={spec.value}
                  onChange={(e) => onUpdate(index, "value", e.target.value)}
                  placeholder="Значение"
                  className="listing-form-input"
                />
              )}
            </div>

            {!spec.locked ? (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="listing-form-spec-remove"
                title="Удалить характеристику"
              >
                ×
              </button>
            ) : (
              <div className="listing-form-spec-remove listing-form-spec-remove--spacer" />
            )}
          </div>
        );
      })}

      {extraLocked.length > 0 || unlocked.length > 0 ? (
        <div className="px-4 py-3 border-t border-ink/8">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-sm font-semibold text-sun hover:text-sun-700"
          >
            {showMore
              ? t("listing.specsShowLess")
              : t("listing.specsShowMore", {
                  count: extraLocked.length + unlocked.length,
                })}
          </button>
        </div>
      ) : null}

      {specs.length === 0 ? (
        <div className="px-4 py-6 text-sm text-ink-400">
          Характеристики не добавлены.
        </div>
      ) : null}
    </div>
  );
}

export function areListingSpecsComplete(specs = []) {
  const required = specs.filter((row) => row.locked);
  if (!required.length) return true;
  return required.every((row) => String(row.value || "").trim());
}
