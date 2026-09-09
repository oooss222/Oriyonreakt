import React from "react";
import { useI18n } from "../../i18n";
import { Chip } from "../../ui";

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
          <Chip
            key={preset.label}
            active={active}
            className="filter-chip text-xs"
            onClick={() =>
              onSelect?.({
                from: preset.from ? String(preset.from) : "",
                to: preset.to ? String(preset.to) : "",
              })
            }
          >
            {preset.label}
          </Chip>
        );
      })}
    </div>
  );
}

export default function RangeFilter({
  label = "",
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
  const fromLabel = fromPlaceholder || t("filter.from");
  const toLabel = toPlaceholder || t("filter.to");
  const handleFrom = (value) => onChange?.({ from: value, to });
  const handleTo = (value) => onChange?.({ from, to: value });

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        {selectOptions.length > 0 ? (
          <>
            <select
              value={from}
              onChange={(e) => handleFrom(e.target.value)}
              aria-label={`${label} ${fromLabel}`.trim()}
              className="select"
            >
              <option value="">{t("filter.any")}</option>
              {selectOptions.map((item) => (
                <option key={`from-${item}`} value={item}>
                  {fromLabel} {item}
                  {suffix}
                </option>
              ))}
            </select>
            <select
              value={to}
              onChange={(e) => handleTo(e.target.value)}
              aria-label={`${label} ${toLabel}`.trim()}
              className="select"
            >
              <option value="">{t("filter.any")}</option>
              {selectOptions.map((item) => (
                <option key={`to-${item}`} value={item}>
                  {toLabel} {item}
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
              placeholder={fromLabel}
              aria-label={`${label} ${fromLabel}`.trim()}
              className="input"
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
              placeholder={toLabel}
              aria-label={`${label} ${toLabel}`.trim()}
              className="input"
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
