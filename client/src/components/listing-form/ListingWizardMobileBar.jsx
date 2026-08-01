import React from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export default function ListingWizardMobileBar({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  saving,
  isLastStep,
  isEdit,
}) {
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-sm px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.08)]">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 0 || saving}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border font-semibold disabled:opacity-40"
        >
          <ChevronLeft size={18} />
          Назад
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-sun font-semibold text-white disabled:bg-slate-400"
          >
            <CheckCircle2 size={18} />
            {saving
              ? isEdit
                ? "Сохранение..."
                : "Публикация..."
              : isEdit
                ? "Сохранить"
                : "Опубликовать"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={saving}
            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-1 rounded-xl bg-sun font-semibold text-white"
          >
            Далее
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      <div className="mt-1 text-center text-[11px] text-slate-400">
        {step + 1} / {totalSteps}
      </div>
    </div>
  );
}
