import React from "react";
import { CheckCircle2, AlertTriangle, Circle } from "lucide-react";

function Item({ ok, warn, children }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : Circle;

  return (
    <li
      className={`flex items-start gap-2 text-sm ${
        ok ? "text-emerald-700" : warn ? "text-amber-700" : "text-slate-500"
      }`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function ListingReadinessChecklist({
  form,
  specs,
  photosCount,
  photoLimit,
  priceNegotiable,
  minPhotos = 1,
}) {
  const hasTitle = Boolean(form.title.trim());
  const hasPrice = priceNegotiable || Boolean(String(form.price || "").replace(/\D/g, ""));
  const hasLocation = Boolean(form.location.trim());
  const hasEnoughPhotos = photosCount >= minPhotos;
  const missingLockedSpecs = specs.filter(
    (row) => row.locked && !String(row.value || "").trim()
  );

  const ready =
    hasTitle &&
    hasPrice &&
    hasLocation &&
    hasEnoughPhotos &&
    missingLockedSpecs.length === 0;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-800">Готовность</div>
      <ul className="space-y-2">
        <Item ok={hasTitle}>Заголовок</Item>
        <Item ok={hasPrice} warn={!hasPrice}>
          {priceNegotiable ? "Цена: договорная" : "Цена"}
        </Item>
        <Item ok={hasLocation}>Город</Item>
        <Item ok={hasEnoughPhotos} warn={photosCount > 0 && !hasEnoughPhotos}>
          {hasEnoughPhotos
            ? `Фото: ${photosCount}/${photoLimit}`
            : `Добавьте минимум ${minPhotos} фото`}
        </Item>
        {missingLockedSpecs.length > 0 && (
          <Item warn>
            Заполните: {missingLockedSpecs.map((row) => row.name).join(", ")}
          </Item>
        )}
      </ul>
      <div
        className={`rounded-xl px-3 py-2 text-xs font-medium ${
          ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
        }`}
      >
        {ready
          ? "Можно публиковать"
          : "Заполните обязательные пункты перед публикацией"}
      </div>
    </div>
  );
}

export function isListingReady(args) {
  const hasTitle = Boolean(args.form.title.trim());
  const hasPrice =
    args.priceNegotiable || Boolean(String(args.form.price || "").replace(/\D/g, ""));
  const hasLocation = Boolean(args.form.location.trim());
  const hasEnoughPhotos = args.photosCount >= (args.minPhotos || 1);
  const missingLockedSpecs = args.specs.filter(
    (row) => row.locked && !String(row.value || "").trim()
  );

  return (
    hasTitle &&
    hasPrice &&
    hasLocation &&
    hasEnoughPhotos &&
    missingLockedSpecs.length === 0
  );
}
