import React from "react";
import Skeleton from "./ui/Skeleton";

export default function ListingGridSkeleton({
  count = 10,
  wide = false,
  className = "",
}) {
  return (
    <div
      className={`${wide ? "listing-grid listing-grid--wide" : "listing-grid"} ${className}`.trim()}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden p-1.5">
          <Skeleton className="mb-1.5 h-32 w-full rounded-xl" />
          <Skeleton className="mb-2 h-4 w-4/5" />
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
