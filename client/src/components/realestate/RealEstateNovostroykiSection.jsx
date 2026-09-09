import React from "react";
import { Building2, ArrowRight } from "lucide-react";
import { buildRealEstateCategoryUrl } from "../../lib/realEstate";
import { useI18n } from "../../i18n";
import { Button } from "../../ui";

export default function RealEstateNovostroykiSection({
  city = "Душанбе",
  listingCount = 0,
  developments = [],
}) {
  const { t } = useI18n();
  const headingId = React.useId();
  const listingsUrl = buildRealEstateCategoryUrl(city, "Новостройки");

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-sun-200 bg-sun-50 p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-500 text-white">
              <Building2 size={20} aria-hidden="true" />
            </span>

            <div>
              <h2 id={headingId} className="text-lg font-bold text-ink-900">
                {t("realestate.novostroyki")}
              </h2>
              <p className="text-sm text-ink-500">
                {t("realestate.novostroykiHint", { city })}
              </p>
            </div>
          </div>

          {listingCount > 0 && (
            <p className="mt-1 text-sm text-ink-600">
              {t("realestate.novostroykiCount", {
                count: listingCount.toLocaleString("ru-RU"),
              })}
              {developments.length > 0 &&
                t("realestate.novostroykiComplexes", { count: developments.length })}
            </p>
          )}
        </div>

        <Button
          variant="primary"
          to={listingsUrl}
          iconRight={ArrowRight}
          className="shrink-0"
        >
          {t("realestate.novostroykiCta")}
        </Button>
      </div>
    </section>
  );
}
