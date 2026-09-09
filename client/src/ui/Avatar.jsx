import React from "react";
import { cn } from "./cn";

const SIZES = {
  xs: "h-7 w-7 text-2xs",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-16 w-16 text-xl sm:h-18 sm:w-18",
};

function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "?";

  return parts.map((part) => part[0]).join("").toUpperCase();
}

/** Photo when there is one, otherwise initials on a neutral tile. */
export default function Avatar({
  src,
  name,
  size = "md",
  rounded = "rounded-xl",
  className = "",
  ...rest
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden font-bold",
        showImage ? "bg-mist-200" : "bg-ink-900 text-white",
        SIZES[size] || SIZES.md,
        rounded,
        className
      )}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
