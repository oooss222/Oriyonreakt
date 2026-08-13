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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-xl border font-semibold transition ${
          compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
        } ${
          active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white hover:bg-slate-50"
        }`}
      >
        <Scale size={compact ? 12 : 14} />
        {active ? "В сравнении" : "Сравнить"}
      </button>

      {count > 0 && !compact && showOpenLink && (
        <Link
          to={comparePath}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-sun hover:text-sun-600"
        >
          Открыть ({count}/{COMPARE_MAX})
        </Link>
      )}
    </div>
  );
}
