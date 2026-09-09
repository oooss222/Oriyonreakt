import React from "react";
import { Checkbox } from "../../ui";

export default function RentalQualityFilterFields({
  draft,
  onOnlyWithPhotosChange,
  onVerifiedOnlyChange,
  className = "",
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Checkbox
        label="Только с фото"
        checked={Boolean(draft.onlyWithPhotos)}
        onChange={(e) => onOnlyWithPhotosChange?.(e.target.checked)}
        className="min-h-[2.75rem] rounded-xl px-1 py-2.5 hover:bg-mist-50"
      />
      <Checkbox
        label="Проверенный объект"
        checked={Boolean(draft.verifiedOnly)}
        onChange={(e) => onVerifiedOnlyChange?.(e.target.checked)}
        className="min-h-[2.75rem] rounded-xl px-1 py-2.5 hover:bg-mist-50"
      />
    </div>
  );
}
