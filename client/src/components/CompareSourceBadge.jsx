import React from "react";
import { ExternalLink } from "lucide-react";
import { getPlatformLabel } from "../lib/comparePlatforms";

export default function CompareSourceBadge({
  item,
  className = "",
}) {
  if (item?._isExternal) {
    const label = getPlatformLabel(item._compareSource);

    if (item._compareUrl) {
      return (
        <a
          href={item._compareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 rounded-lg bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500 hover:bg-mist-200 ${className}`}
        >
          {label}
          <ExternalLink size={10} />
        </a>
      );
    }

    return (
      <span
        className={`inline-flex items-center rounded-lg bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500 ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg bg-sun/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun-700 ${className}`}
    >
      Oriyon
    </span>
  );
}
