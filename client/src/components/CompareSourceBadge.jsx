import React from "react";
import { ExternalLink } from "lucide-react";
import { getPlatformLabel } from "../lib/comparePlatforms";
import { cn } from "../ui";

const BASE =
  "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-2xs font-bold uppercase tracking-wide";

export default function CompareSourceBadge({ item, className = "" }) {
  if (item?._isExternal) {
    const label = getPlatformLabel(item._compareSource);

    if (item._compareUrl) {
      return (
        <a
          href={item._compareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(BASE, "bg-mist-100 text-ink-500 hover:bg-mist-200", className)}
        >
          {label}
          <ExternalLink size={10} aria-hidden="true" />
        </a>
      );
    }

    return (
      <span className={cn(BASE, "bg-mist-100 text-ink-500", className)}>{label}</span>
    );
  }

  return (
    <span className={cn(BASE, "bg-sun-50 text-sun-800", className)}>Oriyon</span>
  );
}
