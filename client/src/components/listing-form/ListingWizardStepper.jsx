import React from "react";

export default function ListingWizardStepper({ steps, currentStep }) {
  return (
    <div className="rounded-2xl border bg-white p-3 sm:p-4">
      <div className="mb-2 text-xs font-medium text-slate-500">
        Шаг {currentStep + 1} из {steps.length}
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = index === currentStep;
          const done = index < currentStep;

          return (
            <div
              key={item.id}
              className={`rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight ${
                active
                  ? "bg-sun text-white"
                  : done
                    ? "bg-sun-50 text-sun-700"
                    : "bg-slate-50 text-slate-500"
              }`}
            >
              {Icon && <Icon size={15} className="mx-auto mb-1" />}
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel || item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
