import React from "react";
import { Link } from "react-router-dom";
import { Check, Scale } from "lucide-react";
import {
  readCompareIds,
  toggleCompareId,
  isInCompare,
  COMPARE_MAX,
  isCompareSupported,
  buildComparePreview,
} from "../lib/compareListings";
import { getComparePath } from "../lib/compareConfig";
import { useI18n } from "../i18n";

export default function CompareListingButton({
  listingId,
  cat = "realestate",
  listing = null,
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
  const [pop, setPop] = React.useState(false);

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
  const label = active ? t("compare.inCompare") : t("compare.compareAction");

  const toggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleCompareId(listingId, cat, buildComparePreview(listing));
    if (result?.reason === "full") {
      setToast(t("compare.maxReached", { max: COMPARE_MAX }));
      return;
    }
    setActive(Boolean(result?.active));
    setPop(true);
  };

  const buttonClass = overlay
    ? `inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition backdrop-blur-sm active:scale-95 ${
        active
          ? "border-sun/40 bg-sun text-white"
          : "border-white/40 bg-white/90 text-ink-500 hover:bg-white"
      }`
    : `inline-flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 ${
        active
          ? "border-sun/40 bg-sun/10 text-sun"
          : "border-ink/10 bg-white text-ink-400 hover:bg-mist/70 hover:text-ink-500"
      }`;

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={active}
        title={label}
        className={buttonClass}
      >
        <span
          className={`inline-flex ${pop ? "compare-pop" : ""}`}
          onAnimationEnd={() => setPop(false)}
        >
          {active ? <Check className="h-[18px] w-[18px]" /> : <Scale className="h-[18px] w-[18px]" />}
        </span>
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
        <div
          role="status"
          className="absolute left-1/2 top-full z-30 mt-2 w-44 -translate-x-1/2 rounded-xl border border-ink/10 bg-white px-2.5 py-2 text-[11px] font-medium text-ink-600 shadow-lg animate-fade-in"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
