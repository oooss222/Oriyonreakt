import React from "react";
import { Tag, CheckCircle2, RotateCcw } from "lucide-react";

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
}) {
  return (
    <aside>
      <div className="listing-form-sidebar">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-sun" />
          <h2 className="text-lg font-semibold">Публикация</h2>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Категория</span>
            <span className="font-semibold text-slate-900 text-right">
              {categoryTitle || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Подкатегория</span>
            <span className="font-semibold text-slate-900 text-right">
              {subcategory || "—"}
            </span>
          </div>
        </div>

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
        </div>

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
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Сбросить
        </button>

        {footerNote ? (
          <p className="text-xs text-slate-500 leading-relaxed">{footerNote}</p>
        ) : null}
      </div>
    </aside>
  );
}
