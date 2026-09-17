import React from "react";

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
        <div key={index} className="card p-1.5 animate-pulse">
          <div className="w-full h-32 bg-mist-200 rounded-xl mb-1.5" />
          <div className="h-4 bg-mist-200 rounded w-4/5 mb-2" />
          <div className="h-4 bg-mist-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-mist-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
