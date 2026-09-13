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
    <div className="space-y-3">
      {publicId && (
        <span className="chip h-7 px-2.5 text-xs text-ink-500">
          № {formatPublicId(publicId)}
        </span>
      )}

      <h1 className="text-2xl font-extrabold leading-tight text-ink">
        {title || t("listing.noTitle")}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4 shrink-0" />
          {location || t("location.dushanbe")}
        </span>
        {published && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            {published}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Eye className="w-4 h-4 shrink-0" />
          {formatViewsLabel(views)}
        </span>
      </div>
    </div>
  );
}
