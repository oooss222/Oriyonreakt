import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, ChevronRight } from "lucide-react";
import { readCompareIds, COMPARE_MAX } from "../lib/compareListings";

export default function CompareFloatingBar() {
  const location = useLocation();
  const [count, setCount] = React.useState(() => readCompareIds().length);

  const hidden =
    count === 0 || location.pathname.startsWith("/realestate/sravnenie");

  React.useEffect(() => {
    const sync = () => setCount(readCompareIds().length);
    sync();
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] inset-x-0 z-[45] px-4 pointer-events-none lg:bottom-6">
      <Link
        to="/realestate/sravnenie"
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-slate-900 px-4 py-3 text-white shadow-lift transition hover:bg-slate-800"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Scale size={18} className="text-sun" />
          Сравнение · {count}/{COMPARE_MAX}
        </span>
        <ChevronRight size={18} className="text-white/70" />
      </Link>
    </div>
  );
}
