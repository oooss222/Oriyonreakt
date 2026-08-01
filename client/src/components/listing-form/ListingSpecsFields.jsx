import React from "react";
import { Plus, X } from "lucide-react";
import { getDependentOptions } from "../../data/specOptions";

export default function ListingSpecsFields({
  specs,
  updateSpec,
  addSpecRow,
  removeSpecRow,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Характеристики</h2>
        <button
          type="button"
          onClick={addSpecRow}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      <div className="space-y-3">
        {specs.map((spec, index) => {
          const selectOptions = getDependentOptions(spec, specs);
          const needsParent = Boolean(spec.dependsOn);
          const parentSelected = needsParent
            ? specs.some((row) => row.name === spec.dependsOn && row.value)
            : true;

          return (
            <div
              key={`${spec.name}-${index}`}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              {spec.locked ? (
                <div className="flex h-11 items-center rounded-lg border bg-slate-50 px-3 text-sm font-medium text-slate-700">
                  {spec.name}
                </div>
              ) : (
                <input
                  value={spec.name}
                  onChange={(e) => updateSpec(index, "name", e.target.value)}
                  placeholder="Название"
                  className="h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
                />
              )}

              {spec.type === "select" ? (
                <select
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  disabled={needsParent && !parentSelected}
                  className="h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {needsParent && !parentSelected
                      ? `Сначала выберите ${spec.dependsOn.toLowerCase()}`
                      : "Выберите"}
                  </option>
                  {selectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  placeholder="Значение"
                  className="h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
                />
              )}

              {!spec.locked ? (
                <button
                  type="button"
                  onClick={() => removeSpecRow(index)}
                  className="inline-flex h-11 w-full sm:w-11 items-center justify-center rounded-lg border text-red-600 hover:bg-red-50"
                  title="Удалить характеристику"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="hidden h-11 w-11 sm:block" />
              )}
            </div>
          );
        })}

        {specs.length === 0 && (
          <div className="text-sm text-slate-500">Характеристики не добавлены.</div>
        )}
      </div>
    </div>
  );
}
