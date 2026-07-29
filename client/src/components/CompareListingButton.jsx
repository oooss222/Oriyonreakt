import React from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import {
  readCompareIds,
  toggleCompareId,
  isInCompare,
  COMPARE_MAX,
} from "../lib/compareListings";

export default function CompareListingButton({ listingId, className = "" }) {
  const [active, setActive] = React.useState(() => isInCompare(listingId));
  const [count, setCount] = React.useState(() => readCompareIds().length);

  React.useEffect(() => {
    const sync = () => {
      setActive(isInCompare(listingId));
      setCount(readCompareIds().length);
    };

    sync();
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, [listingId]);

  const toggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!listingId) return;
    toggleCompareId(listingId);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
          active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white hover:bg-slate-50"
        }`}
      >
        <Scale size={14} />
        {active ? "В сравнении" : "Сравнить"}
      </button>

      {count > 0 && (
        <Link
          to="/realestate/sravnenie"
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-sun hover:text-sun-600"
        >
          Открыть ({count}/{COMPARE_MAX})
        </Link>
      )}
    </div>
  );
}
