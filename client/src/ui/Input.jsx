import React from "react";
import { cn } from "./cn";

/**
 * Text input with optional leading/trailing adornments.
 *
 * Adornments are rendered inside the control box and padded around, so an icon
 * never overlaps the caret.
 */
export const Input = React.forwardRef(function Input(
  { invalid = false, iconLeft: IconLeft, addonRight, className = "", wrapperClassName = "", ...rest },
  ref
) {
  const field = (
    <input
      ref={ref}
      className={cn(
        "input",
        invalid && "input-invalid",
        IconLeft && "pl-10",
        addonRight && "pr-11",
        className
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );

  if (!IconLeft && !addonRight) return field;

  return (
    <div className={cn("relative", wrapperClassName)}>
      {IconLeft && (
        <IconLeft
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      )}
      {field}
      {addonRight && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{addonRight}</div>
      )}
    </div>
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { invalid = false, className = "", ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn("textarea", invalid && "textarea-invalid", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { invalid = false, className = "", children, options, placeholder, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn("select", invalid && "select-invalid", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options
        ? options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })
        : children}
    </select>
  );
});

export default Input;
