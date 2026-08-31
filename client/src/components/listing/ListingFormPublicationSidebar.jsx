import React from "react";
import { Link } from "react-router-dom";
import { Tag, CheckCircle2, RotateCcw, Phone, ShieldAlert } from "lucide-react";
import ListingFormPreview from "./ListingFormPreview";

export default function ListingFormPublicationSidebar({
  categoryTitle,
  subcategory,
  checks = [],
  canPublish,
  publishHint,
  saving,
  isEdit,
  onReset,
  footerNote,
  hasPhone = true,
  requirePhone = false,
  previewItem = null,
  moderationHint = null,
}) {
  return (
    <aside className="hidden lg:block">
      <div className="listing-form-sidebar">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-sun" />
          <h2 className="font-display text-lg font-semibold text-ink tracking-tight">
            Публикация
          </h2>
        </div>

        <div className="rounded-xl border border-ink/8 bg-mist/50 p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-400">Категория</span>
            <span className="font-semibold text-ink text-right">
              {categoryTitle || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-400">Подкатегория</span>
            <span className="font-semibold text-ink text-right">
              {subcategory || "—"}
            </span>
          </div>
        </div>

        {previewItem ? <ListingFormPreview item={previewItem} /> : null}

        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.key || check.label}
              className={`listing-form-check ${
                check.ok ? "listing-form-check--ok" : "listing-form-check--warn"
              }`}
            >
              <span>{check.label}</span>
              <span className="font-medium">{check.detail}</span>
            </div>
          ))}

          {requirePhone ? (
            <div
              className={`listing-form-check ${
                hasPhone ? "listing-form-check--ok" : "listing-form-check--warn"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} />
                Телефон
              </span>
              <span className="font-medium">
                {hasPhone ? "Указан" : "Нужен в профиле"}
              </span>
            </div>
          ) : null}
        </div>

        {requirePhone && !hasPhone ? (
          <Link
            to="/profile?tab=profile"
            className="block rounded-xl border border-sun/20 bg-sun-50 px-3 py-2.5 text-xs font-medium text-sun-800 hover:bg-sun-50/80"
          >
            Добавьте телефон в профиле, чтобы покупатели могли связаться с вами.
          </Link>
        ) : null}

        {moderationHint ? (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{moderationHint}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canPublish}
          className={`listing-form-publish-btn ${
            canPublish
              ? "listing-form-publish-btn--ready"
              : "listing-form-publish-btn--disabled"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {saving
            ? isEdit
              ? "Сохранение..."
              : "Публикация..."
            : isEdit
              ? "Сохранить изменения"
              : "Опубликовать"}
        </button>

        {!canPublish && publishHint ? (
          <p className="text-xs text-red-600">{publishHint}</p>
        ) : null}

        <button
          type="button"
          onClick={onReset}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-mist transition"
        >
          <RotateCcw className="w-4 h-4" />
          Сбросить
        </button>

        {footerNote ? (
          <p className="text-xs text-ink-400 leading-relaxed">{footerNote}</p>
        ) : null}
      </div>
    </aside>
  );
}
