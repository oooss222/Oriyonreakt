import React from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import {
  readCompareIds,
  toggleCompareId,
  isInCompare,
  COMPARE_MAX,
  isCompareSupported,
} from "../lib/compareListings";
import { getComparePath } from "../lib/compareConfig";
import { useI18n } from "../i18n";
import { cn, useToast } from "../ui";

export default function CompareListingButton({
  listingId,
  cat = "realestate",
  className = "",
  compact = false,
  overlay = false,
  showOpenLink = true,
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const supported = isCompareSupported(cat);
  const [active, setActive] = React.useState(() =>
    supported ? isInCompare(listingId, cat) : false
  );
  const [count, setCount] = React.useState(() =>
    supported ? readCompareIds(cat).length : 0
  );

  React.useEffect(() => {
    if (!supported) return undefined;

    const sync = () => {
      setActive(isInCompare(listingId, cat));
      setCount(readCompareIds(cat).length);
    };

    sync();
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, [listingId, cat, supported]);

  if (!supported || !listingId) return null;

  const comparePath = getComparePath(cat);

  const toggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleCompareId(listingId, cat);
    if (result?.reason === "full") {
      showToast(t("compare.listFull", { count: COMPARE_MAX, max: COMPARE_MAX }), "error");
      return;
    }
    setActive(Boolean(result?.active));
  };

  const sizeClass = overlay ? "h-10 w-10" : compact ? "h-9 w-9" : "h-10 w-10";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={active ? t("compare.inCompare") : t("compare.compareAction")}
        aria-pressed={active}
        title={active ? t("compare.inCompare") : t("compare.compareAction")}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition active:scale-95",
          sizeClass,
          overlay
            ? cn(
                "shadow-xs backdrop-blur-sm",
                active
                  ? "bg-sun-500 text-white"
                  : "bg-white/95 text-ink-400 hover:bg-white hover:text-ink-700"
              )
            : cn(
                "border",
                active
                  ? "border-sun-300 bg-sun-50 text-sun-700"
                  : "border-ink-200 bg-white text-ink-400 hover:bg-mist-100 hover:text-ink-600"
              )
        )}
      >
        <Scale
          className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"}
          aria-hidden="true"
        />
      </button>

      {count > 0 && !compact && !overlay && showOpenLink && (
        <Link
          to={comparePath}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-ink-400 hover:text-ink-600"
        >
          {t("compare.openList", { count, max: COMPARE_MAX })}
        </Link>
      )}
    </div>
  );
}
