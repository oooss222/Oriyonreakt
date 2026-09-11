import React from "react";
import { useI18n } from "../../i18n";

function PresetRow({ presets = [], activeFrom = "", activeTo = "", onSelect }) {
  if (!presets.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        if (!preset.from && !preset.to) return null;

        const active =
          String(activeFrom || "") === String(preset.from || "") &&
          String(activeTo || "") === String(preset.to || "");

        return (
          <button
            key={preset.label}
            type="button"
            onClick={() =>
              onSelect?.({
                from: preset.from ? String(preset.from) : "",
                to: preset.to ? String(preset.to) : "",
              })
            }
            className={`h-9 px-3 rounded-full border text-xs font-medium transition chip ${
              active ? "chip-active" : ""
            }`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

export default function RangeFilter({
  from = "",
  to = "",
  onChange,
  presets = [],
  fromPlaceholder,
  toPlaceholder,
  inputMode = "numeric",
  suffix = "",
  selectOptions = [],
}) {
  const { t } = useI18n();
  const resolvedFromPlaceholder = fromPlaceholder ?? t("filter.from");
  const resolvedToPlaceholder = toPlaceholder ?? t("filter.to");
  const handleFrom = (value) => onChange?.({ from: value, to });
  const handleTo = (value) => onChange?.({ from, to: value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {selectOptions.length > 0 ? (
          <>
            <select
              value={from}
              onChange={(e) => handleFrom(e.target.value)}
              className="mobile-control"
            >
              <option value="">{t("filter.anyRange")}</option>
              {selectOptions.map((item) => (
                <option key={`from-${item}`} value={item}>
                  {resolvedFromPlaceholder} {item}
                  {suffix}
                </option>
              ))}
            </select>
            <select
              value={to}
              onChange={(e) => handleTo(e.target.value)}
              className="mobile-control"
            >
              <option value="">{t("filter.anyRange")}</option>
              {selectOptions.map((item) => (
                <option key={`to-${item}`} value={item}>
                  {resolvedToPlaceholder} {item}
                  {suffix}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <input
              type="text"
              inputMode={inputMode}
              value={from}
              onChange={(e) =>
                handleFrom(
                  inputMode === "numeric"
                    ? e.target.value.replace(/[^\d]/g, "")
                    : e.target.value
                )
              }
              placeholder={resolvedFromPlaceholder}
              className="mobile-control"
            />
            <input
              type="text"
              inputMode={inputMode}
              value={to}
              onChange={(e) =>
                handleTo(
                  inputMode === "numeric"
                    ? e.target.value.replace(/[^\d]/g, "")
                    : e.target.value
                )
              }
              placeholder={resolvedToPlaceholder}
              className="mobile-control"
            />
          </>
        )}
      </div>

      <PresetRow
        presets={presets}
        activeFrom={from}
        activeTo={to}
        onSelect={({ from: nextFrom, to: nextTo }) =>
          onChange?.({ from: nextFrom, to: nextTo })
        }
      />
    </div>
  );
}
