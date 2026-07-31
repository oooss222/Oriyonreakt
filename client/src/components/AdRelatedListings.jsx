import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import ListingCard from "./ListingCard";
import RealEstateListingCard from "./RealEstateListingCard";
import ListingGridSkeleton from "./ListingGridSkeleton";
import { loadRelatedListings } from "../lib/listingQuickFacts";
import { isRealEstateListing } from "../lib/realEstate";

export default function AdRelatedListings({ ad, listingUrl, catLabel }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!ad) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    loadRelatedListings(api, ad, 10)
      .then((list) => {
        if (active) setItems(list);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ad]);

  if (!loading && items.length === 0) return null;

  const heading = ad?.subcategory
    ? `Похожие: ${ad.subcategory}`
    : "Похожие объявления";

  return (
    <section className="card p-5 md:p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">{heading}</h2>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {ad?.subcategory
              ? `${catLabel} · ${ad.subcategory}`
              : `Категория «${catLabel}»`}
          </p>
        </div>

        <Link
          to={listingUrl}
          className="inline-flex items-center gap-1 text-sm font-semibold text-sun hover:text-sun-600 shrink-0"
        >
          Все
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <ListingGridSkeleton count={4} columns="grid-cols-2 sm:grid-cols-4" />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
          {items.map((item) => (
            <div
              key={item._id || item.id}
              className="snap-start shrink-0 w-[168px] sm:w-[190px]"
            >
              {isRealEstateListing(item) ? (
                <RealEstateListingCard item={item} />
              ) : (
                <ListingCard item={item} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
