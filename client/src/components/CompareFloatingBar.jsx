import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, ChevronRight } from "lucide-react";
import {
  readCompareIds,
  COMPARE_MAX,
  getActiveCompareCat,
  findCompareCatWithItems,
} from "../lib/compareListings";
import { getCompareConfig, getComparePath } from "../lib/compareConfig";
import { useI18n } from "../i18n";

export default function CompareFloatingBar() {
  const location = useLocation();
  const { t } = useI18n();
  const pathCat = getActiveCompareCat(location.pathname);
  const [activeCat, setActiveCat] = React.useState(
    () => findCompareCatWithItems(pathCat) || pathCat
  );
  const [count, setCount] = React.useState(() =>
    activeCat ? readCompareIds(activeCat).length : 0
  );

  const config = activeCat ? getCompareConfig(activeCat) : null;
  const comparePath = activeCat ? getComparePath(activeCat) : "";

  const hidden =
    count === 0 ||
    !config ||
    location.pathname === comparePath ||
    location.pathname.startsWith(`${comparePath}/`);

  React.useEffect(() => {
    const sync = () => {
      const nextCat = findCompareCatWithItems(getActiveCompareCat(location.pathname));
      setActiveCat(nextCat);
      setCount(nextCat ? readCompareIds(nextCat).length : 0);
    };

    sync();
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, [location.pathname]);

  if (hidden) return null;

  return (
    <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] inset-x-0 z-[45] px-4 pointer-events-none lg:bottom-6">
      <Link
        to={comparePath}
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-slate-900 px-4 py-3 text-white shadow-lift transition hover:bg-slate-800"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Scale size={18} className="text-sun" />
          {t("compare.open", { count, max: COMPARE_MAX })}
          <span className="text-white/60 font-medium">
            · {t(`categories.${activeCat}`)}
          </span>
        </span>
        <ChevronRight size={18} className="text-white/70" />
      </Link>
    </div>
  );
}
