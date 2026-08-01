import React from "react";
import { MapPin } from "lucide-react";
import { formatPrice } from "../../lib/format";
import { resolveMediaUrl } from "../../lib/media";

export default function ListingFormPreview({ form, previews, existingImages, priceNegotiable }) {
  const cover =
    previews[0] ||
    resolveMediaUrl(existingImages[0]?.url, { allowEmpty: true, placeholder: "" }) ||
    "/img/placeholder.jpg";

  const priceLabel = priceNegotiable
    ? "Договорная"
    : formatPrice(form.price, { emptyLabel: "Укажите цену" });

  return (
    <div className="rounded-2xl border bg-slate-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Превью в ленте
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <img src={cover} alt="" className="h-32 w-full object-cover bg-slate-100" />
        <div className="space-y-1 p-2.5">
          <div className="line-clamp-2 text-sm font-semibold text-slate-900">
            {form.title.trim() || "Заголовок объявления"}
          </div>
          <div className="text-price text-sm">{priceLabel}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} />
            {form.location || "Город"}
          </div>
        </div>
      </div>
    </div>
  );
}
