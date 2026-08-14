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

export default function CompareListingButton({
  listingId,
  cat = "realestate",
  className = "",
  compact = false,
  showOpenLink = true,
}) {
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
    toggleCompareId(listingId, cat);
  };

  const sizeClass = compact
    ? "h-10 w-10"
    : "h-9 w-9";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={active ? "В сравнении" : "Сравнить"}
        aria-pressed={active}
        title={active ? "В сравнении" : "Сравнить"}
        className={`inline-flex ${sizeClass} items-center justify-center rounded-full border transition ${
          active
            ? "border-slate-300 bg-slate-50 text-slate-700"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        <Scale className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
      </button>

      {count > 0 && !compact && showOpenLink && (
        <Link
          to={comparePath}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Открыть ({count}/{COMPARE_MAX})
        </Link>
      )}
    </div>
  );
}
