/**
 * Applies a draft-state updater and immediately reports the result upward.
 * Both filter sidebars (catalog and real estate) update a local "draft" of
 * pending filter values on every field change and call `onApply` right away
 * (there's no separate "Apply" step for most fields) — this was duplicated
 * verbatim in both components.
 */
export function commitDraft(setDraft, onApply, updater, current) {
  const next = updater(current);
  setDraft(next);
  onApply?.(next);
}

const BRAND_SPEC_KEYS = ["Марка", "Марка авто", "Производитель"];

/**
 * A "Model" spec is only ever meaningful for the currently selected brand —
 * changing the brand/manufacturer filter should drop whatever model was
 * selected instead of silently keeping a mismatched value. Mutates `specs`
 * in place (matches the surrounding draft-building code, which builds a
 * fresh `nextSpecs` object per change and mutates it before returning).
 */
export function clearDependentModelSpec(specs, specKey) {
  if (BRAND_SPEC_KEYS.includes(specKey)) {
    delete specs.Модель;
  }
}
