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

export default function CompareListingButton({
  listingId,
  cat = "realestate",
  className = "",
  compact = false,
  overlay = false,
  showOpenLink = true,
}) {
  const { t } = useI18n();
  const supported = isCompareSupported(cat);
  const [active, setActive] = React.useState(() =>
    supported ? isInCompare(listingId, cat) : false
  );
  const [count, setCount] = React.useState(() =>
    supported ? readCompareIds(cat).length : 0
  );
  const [toast, setToast] = React.useState("");

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

  React.useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!supported || !listingId) return null;

  const comparePath = getComparePath(cat);

  const toggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleCompareId(listingId, cat);
    if (result?.reason === "full") {
      setToast(t("compare.listFull", { count: COMPARE_MAX, max: COMPARE_MAX }));
      return;
    }
    setActive(Boolean(result?.active));
  };

  const sizeClass = compact || overlay ? "h-9 w-9" : "h-9 w-9";

  const buttonClass = overlay
    ? `inline-flex ${sizeClass} items-center justify-center rounded-full border shadow-sm transition backdrop-blur-sm ${
        active
          ? "border-sun/40 bg-sun text-white"
          : "border-white/40 bg-white/90 text-ink-500 hover:bg-white"
      }`
    : `inline-flex ${sizeClass} items-center justify-center rounded-full border transition ${
        active
          ? "border-sun/40 bg-sun/10 text-sun"
          : "border-ink/10 bg-white text-ink-400 hover:bg-mist/70 hover:text-ink-500"
      }`;

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={active ? t("compare.inCompare") : t("compare.compareAction")}
        aria-pressed={active}
        title={active ? t("compare.inCompare") : t("compare.compareAction")}
        className={buttonClass}
      >
        <Scale className={compact || overlay ? "h-4 w-4" : "h-[18px] w-[18px]"} />
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

      {toast && (
        <div className="absolute left-1/2 top-full z-30 mt-2 w-48 -translate-x-1/2 rounded-xl border border-ink/10 bg-white px-2.5 py-2 text-[11px] font-medium text-ink-600 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
