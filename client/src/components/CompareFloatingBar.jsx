import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, Trash2 } from "lucide-react";
import {
  readCompareIds,
  clearCompare,
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
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+0.5rem)] px-4 lg:bottom-6"
      style={{ zIndex: "var(--z-sticky-bar)" }}
    >
      <div
        role="region"
        aria-label={t("compare.title")}
        className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-2xl
                   border border-ink-800 bg-ink-900 p-2 pl-3.5 text-white shadow-lg"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <Scale size={18} className="shrink-0 text-sun-400" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight">
              {t("compare.barTitle")}
            </span>
            <span className="block truncate text-2xs font-medium text-white/60">
              {t("compare.counter", { count, max: COMPARE_MAX })} ·{" "}
              {t(`categories.${activeCat}`)}
            </span>
          </span>
        </span>

        <button
          type="button"
          onClick={() => clearCompare(activeCat)}
          aria-label={t("compare.clear")}
          title={t("compare.clear")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/70
                     transition-colors hover:bg-white/10 hover:text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>

        <Link
          to={comparePath}
          className="inline-flex h-11 shrink-0 items-center rounded-xl bg-sun-500 px-4
                     text-sm font-semibold text-white transition-colors hover:bg-sun-600
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {t("compare.barCompare")}
        </Link>
      </div>
    </div>
  );
}
