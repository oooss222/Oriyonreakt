import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Eye, MapPin, Tag } from "lucide-react";
import { formatViewsLabel } from "../../lib/format";

export default function AdListingHeader({
  title,
  publicId,
  catLabel,
  subcategory = "",
  listingUrl,
  showCategory = true,
  location,
  published,
  views,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          <Tag className="w-3 h-3" />
          №{publicId}
        </span>
        {showCategory && listingUrl && catLabel && (
          <Link
            to={listingUrl}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sun-50 text-sun-700 hover:bg-sun-100 transition"
          >
            {catLabel}
            {subcategory ? ` · ${subcategory}` : ""}
          </Link>
        )}
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
        {title || "Без названия"}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-4 h-4 text-sun" />
          {location || "Душанбе"}
        </span>
        {published && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {published}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {formatViewsLabel(views)}
        </span>
      </div>
    </div>
  );
}
