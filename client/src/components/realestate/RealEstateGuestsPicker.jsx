import React from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { GUEST_OPTIONS, formatGuestLabel } from "../../data/realEstate";
import { useI18n } from "../../i18n";

const FIELD_LABEL =
  "label-caps mb-1.5 block";
const FIELD_CONTROL =
  "h-11 w-full rounded-xl border border-mist-200/90 bg-white text-sm font-medium text-ink-900 outline-none transition focus:border-sun/50 focus:ring-2 focus:ring-sun/20";

export default function RealEstateGuestsPicker({
  value = "",
  onChange,
  label,
  showLabel = true,
  variant = "default",
}) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("realestate.filters.guestsLabel");
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const summary = value ? formatGuestLabel(value) : t("realestate.guestsPicker.placeholder");
  const isInline = variant === "inline";

  if (isInline) {
    return (
      <div ref={rootRef} className="relative min-w-0">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((state) => !state)}
          className={`flex w-full flex-col px-4 py-3.5 text-left transition hover:bg-mist-50/80 ${
            open ? "bg-sun-50/60" : ""
          }`}
        >
          <span className="mb-0.5 text-xs font-medium text-ink-500">{resolvedLabel}</span>
          <span
            className={`truncate text-sm font-semibold ${
              value ? "text-ink-900" : "text-ink-400"
            }`}
          >
            {summary}
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            aria-label={t("realestate.guestsPicker.ariaLabel")}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-[250] rounded-xl border border-mist-200 bg-white p-2 shadow-xl lg:left-auto lg:right-0 lg:min-w-[220px]"
          >
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                !value
                  ? "bg-sun-50 text-sun-800"
                  : "text-ink-700 hover:bg-mist-50"
              }`}
            >
              {t("realestate.guestsPicker.anyCount")}
            </button>
            {GUEST_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange?.(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  value === option
                    ? "bg-sun-50 text-sun-800"
                    : "text-ink-700 hover:bg-mist-50"
                }`}
              >
                {formatGuestLabel(option)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative block min-w-0">
      {showLabel && <span className={FIELD_LABEL}>{resolvedLabel}</span>}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((state) => !state)}
        className={`${FIELD_CONTROL} flex items-center justify-between gap-3 px-3 text-left ${
          open
            ? "border-sun ring-2 ring-sun/20"
            : value
              ? "text-ink-900"
              : "text-ink-500"
        }`}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Users size={15} className="shrink-0 text-ink-400" />
          {summary}
        </span>
        {open ? (
          <ChevronUp size={15} className="shrink-0 text-ink-400" />
        ) : (
          <ChevronDown size={15} className="shrink-0 text-ink-400" />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("realestate.guestsPicker.ariaLabel")}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[250] rounded-xl border border-mist-200 bg-white p-2 shadow-xl"
        >
          <button
            type="button"
            onClick={() => {
              onChange?.("");
              setOpen(false);
            }}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              !value
                ? "bg-sun-50 text-sun-800"
                : "text-ink-700 hover:bg-mist-50"
            }`}
          >
            {t("realestate.guestsPicker.anyCount")}
          </button>
          {GUEST_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange?.(option);
                setOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                value === option
                  ? "bg-sun-50 text-sun-800"
                  : "text-ink-700 hover:bg-mist-50"
              }`}
            >
              {formatGuestLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
