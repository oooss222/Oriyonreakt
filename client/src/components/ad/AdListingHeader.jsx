import React from "react";
import { Calendar, Eye, MapPin } from "lucide-react";
import { formatPublicId, formatViewsLabel } from "../../lib/format";

export default function AdListingHeader({
  title,
  publicId,
  location,
  published,
  views,
}) {
  return (
    <div className="space-y-3">
      {publicId && (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          № {formatPublicId(publicId)}
        </span>
      )}

      <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
        {title || "Без названия"}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4 shrink-0" />
          {location || "Душанбе"}
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
