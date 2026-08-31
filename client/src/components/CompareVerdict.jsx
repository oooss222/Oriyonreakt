import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getCompareItemKey, isExternalCompareItem } from "../lib/compareResolve";
import { getPlatformLabel } from "../lib/comparePlatforms";

export default function CompareVerdict({ verdict, catalogPath, t }) {
  if (!verdict?.item) return null;

  const item = verdict.item;
  const key = getCompareItemKey(item);
  const external = isExternalCompareItem(item);

  return (
    <section className="rounded-2xl border border-sun/20 bg-sun-50/60 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sun text-white grid place-items-center shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wide text-sun">
            {verdict.label}
          </div>
          <h3 className="font-display text-lg font-bold text-ink line-clamp-2 tracking-tight">
            {verdict.title}
          </h3>
          {verdict.reasons?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {verdict.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-md bg-white border border-sun/15 px-2.5 py-1 text-xs font-medium text-ink-600"
                >
                  {reason}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {external && item._compareUrl ? (
              <a
                href={item._compareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sun px-3.5 py-2 text-sm font-semibold text-white hover:bg-sun-600 transition"
              >
                {t("compare.openOn", {
                  platform: getPlatformLabel(item._compareSource),
                })}
                <ExternalLink size={14} />
              </a>
            ) : (
              <Link
                to={`/ad/${key}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sun px-3.5 py-2 text-sm font-semibold text-white hover:bg-sun-600 transition"
              >
                {t("compare.openListing")}
              </Link>
            )}
            {catalogPath && (
              <Link
                to={catalogPath}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-sm font-semibold text-ink-600 hover:bg-mist transition"
              >
                {t("compare.findMoreOriyon")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
