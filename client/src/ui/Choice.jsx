import React from "react";
import { Check } from "lucide-react";
import { cn } from "./cn";

/**
 * Checkbox drawn as a styled box over a real `<input>`, so keyboard, form
 * submission and assistive tech all keep working.
 */
// `boxed` turns the row into a selectable card, which is what option lists
// (report reasons, delivery options, plans) need to hit a comfortable target.
const BOXED =
  "min-h-[2.75rem] rounded-xl border border-ink-200 px-3 py-2.5 transition-colors hover:bg-mist-50 has-[:checked]:border-sun-400 has-[:checked]:bg-sun-50";

const Checkbox = React.forwardRef(function Checkbox(
  { label, description, boxed = false, className = "", labelClassName = "", ...rest },
  ref
) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-sm text-ink-700",
        boxed && BOXED,
        rest.disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <span className="relative mt-px grid h-5 w-5 shrink-0 place-items-center">
        <input ref={ref} type="checkbox" className="peer sr-only" {...rest} />
        <span
          aria-hidden="true"
          className="grid h-5 w-5 place-items-center rounded-md border border-ink-300 bg-white text-white transition
                     peer-checked:border-sun-500 peer-checked:bg-sun-500
                     peer-focus-visible:ring-2 peer-focus-visible:ring-sun/50 peer-focus-visible:ring-offset-2"
        >
          <Check size={13} strokeWidth={3} className="opacity-0 peer-checked:opacity-100" />
        </span>
      </span>

      <span className={cn("min-w-0", labelClassName)}>
        <span className="block leading-snug">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-400">{description}</span>}
      </span>
    </label>
  );
});

export default Checkbox;

export const Radio = React.forwardRef(function Radio(
  { label, description, boxed = false, className = "", ...rest },
  ref
) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-sm text-ink-700",
        boxed && BOXED,
        rest.disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <span className="relative mt-px grid h-5 w-5 shrink-0 place-items-center">
        <input ref={ref} type="radio" className="peer sr-only" {...rest} />
        <span
          aria-hidden="true"
          className="grid h-5 w-5 place-items-center rounded-full border border-ink-300 bg-white transition
                     peer-checked:border-sun-500 peer-checked:border-[6px]
                     peer-focus-visible:ring-2 peer-focus-visible:ring-sun/50 peer-focus-visible:ring-offset-2"
        />
      </span>

      <span className="min-w-0">
        <span className="block leading-snug">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-400">{description}</span>}
      </span>
    </label>
  );
});
