import React from "react";

export default function ListingGridSkeleton({ count = 10, columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-2 animate-pulse">
          <div className="w-full h-40 bg-mist-200 rounded-xl mb-2" />
          <div className="h-4 bg-mist-200 rounded w-4/5 mb-2" />
          <div className="h-4 bg-mist-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-mist-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
