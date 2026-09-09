import React from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getCompareItemKey, isExternalCompareItem } from "../lib/compareResolve";
import { getPlatformLabel } from "../lib/comparePlatforms";
import { Button } from "../ui";

export default function CompareVerdict({ verdict, catalogPath, t }) {
  if (!verdict?.item) return null;

  const item = verdict.item;
  const key = getCompareItemKey(item);
  const external = isExternalCompareItem(item);

  return (
    <section className="rounded-2xl border border-sun-200 bg-sun-50 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="icon-box-sun h-10 w-10 shrink-0 bg-sun-500 text-white ring-sun-500">
          <CheckCircle2 size={18} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-sun-700">
            {verdict.label}
          </p>

          <h2 className="font-display text-lg font-bold tracking-tight text-ink-900 line-clamp-2">
            {verdict.title}
          </h2>

          {verdict.reasons?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {verdict.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-md border border-sun-100 bg-white px-2.5 py-1 text-xs font-medium text-ink-600"
                >
                  {reason}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {external && item._compareUrl ? (
              <Button
                variant="primary"
                href={item._compareUrl}
                target="_blank"
                rel="noopener noreferrer"
                iconRight={ExternalLink}
              >
                {t("compare.openOn", {
                  platform: getPlatformLabel(item._compareSource),
                })}
              </Button>
            ) : (
              <Button variant="primary" to={`/ad/${key}`}>
                {t("compare.openListing")}
              </Button>
            )}

            {catalogPath && (
              <Button to={catalogPath}>{t("compare.findMoreOriyon")}</Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
