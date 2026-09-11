import React from "react";
import {
  RENT_FURNITURE_OPTIONS,
  RENT_APPLIANCE_OPTIONS,
  RENT_UTILITIES_OPTIONS,
  RENT_INTERNET_OPTIONS,
  RENT_BALCONY_OPTIONS,
  DAILY_PETS_OPTIONS,
  DAILY_SMOKING_OPTIONS,
  RENT_CHILDREN_OPTIONS,
  RENT_TERM_OPTIONS,
  RENT_DEPOSIT_OPTIONS,
} from "../../data/realEstate";
import MultiPillGroup from "../filters/MultiPillGroup";
import { useI18n } from "../../i18n";

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
            className={`chip ${active ? "chip-active" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxOption({ checked, label, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-1 py-1.5 hover:bg-mist/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-ink/20 text-sun focus:ring-sun/30"
      />
      <span className="text-sm text-ink-700">{label}</span>
    </label>
  );
}

export default function RentRentalFilterFields({
  draft,
  setSpec,
  onSellerTypeChange,
  showSellerFilters = false,
  className = "",
}) {
  const { t } = useI18n();
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="label-caps mb-3">{t("realestate.filters.furnitureLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Мебель"] || ""}
          options={RENT_FURNITURE_OPTIONS}
          onChange={(value) => setSpec("Мебель", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.applianceLabel")}</div>
        <MultiPillGroup
          values={draft.specs?.["Техника"] || ""}
          options={RENT_APPLIANCE_OPTIONS}
          onChange={(value) => setSpec("Техника", value)}
        />
        <p className="mt-2 text-[11px] text-ink-400">
          {t("realestate.filters.multiSelectApplianceHint")}
        </p>
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.utilitiesLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Коммунальные"] || ""}
          options={RENT_UTILITIES_OPTIONS}
          onChange={(value) => setSpec("Коммунальные", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.internetLabel")}</div>
        <ChipGroup
          value={draft.specs?.["Интернет"] || ""}
          options={RENT_INTERNET_OPTIONS}
          onChange={(value) => setSpec("Интернет", value)}
        />
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.livingRulesTitle")}</div>
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs font-medium text-ink-500">{t("realestate.filters.balconyLabel")}</div>
            <ChipGroup
              value={draft.specs?.["Балкон"] || ""}
              options={RENT_BALCONY_OPTIONS}
              onChange={(value) => setSpec("Балкон", value)}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-ink-500">{t("realestate.filters.petsLabel")}</div>
            <ChipGroup
              value={draft.specs?.["Животные"] || ""}
              options={DAILY_PETS_OPTIONS}
              onChange={(value) => setSpec("Животные", value)}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-ink-500">{t("realestate.filters.smokingLabel")}</div>
            <ChipGroup
              value={draft.specs?.["Курение"] || ""}
              options={DAILY_SMOKING_OPTIONS}
              onChange={(value) => setSpec("Курение", value)}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-ink-500">{t("realestate.filters.childrenLabel")}</div>
            <ChipGroup
              value={draft.specs?.["Дети"] || ""}
              options={RENT_CHILDREN_OPTIONS}
              onChange={(value) => setSpec("Дети", value)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="label-caps mb-3">{t("realestate.filters.rentTermsTitle")}</div>
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs font-medium text-ink-500">{t("realestate.filters.rentTermLabel")}</div>
            <ChipGroup
              value={draft.specs?.["Срок аренды"] || ""}
              options={RENT_TERM_OPTIONS}
              onChange={(value) => setSpec("Срок аренды", value)}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-ink-500">{t("realestate.filters.depositLabel")}</div>
            <ChipGroup
              value={draft.specs?.["Залог"] || ""}
              options={RENT_DEPOSIT_OPTIONS}
              onChange={(value) => setSpec("Залог", value)}
            />
          </div>
        </div>
      </div>

      {showSellerFilters ? (
        <div className="space-y-1 border-t border-ink/10 pt-3">
          <CheckboxOption
            checked={draft.sellerType === "private"}
            label={t("realestate.filters.fromOwnerLabel")}
            onChange={() =>
              onSellerTypeChange?.(
                draft.sellerType === "private" ? "" : "private"
              )
            }
          />
          <CheckboxOption
            checked={draft.sellerType === "company"}
            label={t("realestate.filters.noCommissionLabel")}
            onChange={() =>
              onSellerTypeChange?.(
                draft.sellerType === "company" ? "" : "company"
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}
