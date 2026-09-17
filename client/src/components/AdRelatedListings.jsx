import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import ListingCard from "./ListingCard";
import RealEstateListingCard from "./RealEstateListingCard";
import ListingGridSkeleton from "./ListingGridSkeleton";
import { loadRelatedListings } from "../lib/listingQuickFacts";
import { isRealEstateListing } from "../lib/realEstate";
import { useI18n } from "../i18n";

export default function AdRelatedListings({ ad, listingUrl, catLabel }) {
  const { t } = useI18n();
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

  return (
    <section className="rounded-3xl border border-mist-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-ink-900">
            {t("listing.relatedTitle")}
          </h2>
          <p className="mt-0.5 truncate text-sm text-ink-500">
            {ad?.subcategory
              ? `${catLabel} · ${ad.subcategory}`
              : t("listing.categoryLabel", { name: catLabel })}
          </p>
        </div>

        <Link
          to={listingUrl}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sun hover:text-sun-600"
        >
          {t("category.all")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <ListingGridSkeleton count={4} />
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide snap-x snap-mandatory">
          {items.map((item) => (
            <div
              key={item._id || item.id}
              className="w-[min(11.75rem,72vw)] shrink-0 snap-start sm:w-[12.5rem]"
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
