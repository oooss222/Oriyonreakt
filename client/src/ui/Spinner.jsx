import React from "react";
import { cn } from "./cn";

const SIZES = { sm: 14, md: 16, lg: 20 };

export default function Spinner({ size = "md", className = "", label }) {
  const px = SIZES[size] || SIZES.md;

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      role={label ? "status" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
