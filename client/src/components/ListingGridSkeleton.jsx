import React from "react";
import { ListingCardSkeleton } from "../ui";

export default function ListingGridSkeleton({
  count = 10,
  columns = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
}) {
  return (
    <div className={`grid gap-3 sm:gap-4 ${columns}`} aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
