import React from "react";
import { cn } from "./cn";

/** Shimmering placeholder. Always give it the size of the real content. */
export default function Skeleton({ className = "", rounded = "rounded-lg", ...rest }) {
  return <div className={cn("skeleton", rounded, className)} aria-hidden="true" {...rest} />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/**
 * Matches the real listing card box for box, so swapping the data in does not
 * shift the grid.
 */
export function ListingCardSkeleton() {
  return (
    <div className="listing-card">
      <Skeleton className="aspect-[4/3] w-full" rounded="rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}
