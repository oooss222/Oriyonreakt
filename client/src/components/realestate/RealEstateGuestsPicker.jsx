import React from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { GUEST_OPTIONS, formatGuestLabel } from "../../data/realEstate";
import { useI18n } from "../../i18n";
import { cn } from "../../ui";

function GuestOption({ selected, children, onSelect }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-[2.75rem] w-full items-center rounded-lg px-3 text-sm font-medium transition-colors",
        selected ? "bg-sun-50 text-sun-800" : "text-ink-700 hover:bg-mist-100"
      )}
    >
      {children}
    </button>
  );
}

export default function RealEstateGuestsPicker({
  value = "",
  onChange,
  label,
  showLabel = true,
  variant = "default",
}) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const listId = React.useId();

  const fieldLabel = label || t("realestate.guests");

  React.useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const summary = value ? formatGuestLabel(value) : t("realestate.guestsPlaceholder");
  const isInline = variant === "inline";

  const select = (next) => {
    onChange?.(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const options = (
    <div
      id={listId}
      role="listbox"
      aria-label={t("realestate.guestsCount")}
      className={cn(
        "absolute left-0 right-0 top-[calc(100%+6px)] space-y-0.5 rounded-xl border border-ink-200 bg-white p-2 shadow-lg",
        isInline && "lg:left-auto lg:right-0 lg:min-w-[220px]"
      )}
      style={{ zIndex: "var(--z-dropdown)" }}
    >
      <GuestOption selected={!value} onSelect={() => select("")}>
        {t("realestate.guestsAny")}
      </GuestOption>

      {GUEST_OPTIONS.map((option) => (
        <GuestOption
          key={option}
          selected={value === option}
          onSelect={() => select(option)}
        >
          {formatGuestLabel(option)}
        </GuestOption>
      ))}
    </div>
  );

  if (isInline) {
    return (
      <div ref={rootRef} className="relative min-w-0">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={`${fieldLabel}: ${summary}`}
          onClick={() => setOpen((state) => !state)}
          className={cn(
            "flex min-h-[3.25rem] w-full flex-col justify-center px-4 py-3 text-left transition-colors hover:bg-mist-50",
            open && "bg-sun-50"
          )}
        >
          <span className="mb-0.5 text-xs font-medium text-ink-500">{fieldLabel}</span>
          <span
            className={cn(
              "truncate text-sm font-semibold",
              value ? "text-ink-900" : "text-ink-400"
            )}
          >
            {summary}
          </span>
        </button>

        {open && options}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative block min-w-0">
      {showLabel && <span className="field-label">{fieldLabel}</span>}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${fieldLabel}: ${summary}`}
        onClick={() => setOpen((state) => !state)}
        className={cn(
          "input flex items-center justify-between gap-3 text-left",
          open && "border-sun-400 ring-2 ring-sun/25",
          value ? "text-ink-900" : "text-ink-400"
        )}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Users size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
          {summary}
        </span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
        )}
      </button>

      {open && options}
    </div>
  );
}
