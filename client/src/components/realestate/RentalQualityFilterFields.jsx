import React from "react";

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

export default function RentalQualityFilterFields({
  draft,
  onOnlyWithPhotosChange,
  onVerifiedOnlyChange,
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <CheckboxOption
        checked={Boolean(draft.onlyWithPhotos)}
        label="Только с фото"
        onChange={() => onOnlyWithPhotosChange?.(!draft.onlyWithPhotos)}
      />
      <CheckboxOption
        checked={Boolean(draft.verifiedOnly)}
        label="Проверенный объект"
        onChange={() => onVerifiedOnlyChange?.(!draft.verifiedOnly)}
      />
    </div>
  );
}
