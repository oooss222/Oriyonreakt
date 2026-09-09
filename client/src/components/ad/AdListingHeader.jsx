import React from "react";
import { Calendar, Eye, MapPin } from "lucide-react";
import { formatPublicId, formatViewsLabel } from "../../lib/format";
import { useI18n } from "../../i18n";

export default function AdListingHeader({
  title,
  publicId,
  location,
  published,
  views,
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5">
      <h1 className="font-display text-xl font-extrabold leading-tight text-ink-900 break-anywhere sm:text-2xl">
        {title || t("listing.noTitle")}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {location || t("location.dushanbe")}
        </span>
        {published && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {published}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          {formatViewsLabel(views)}
        </span>
        {publicId && (
          <span className="text-ink-400">№ {formatPublicId(publicId)}</span>
        )}
      </div>
    </div>
  );
}
