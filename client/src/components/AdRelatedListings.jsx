import React from "react";
import { api } from "../lib/api";
import ListingCard from "./ListingCard";
import RealEstateListingCard from "./RealEstateListingCard";
import ListingGridSkeleton from "./ListingGridSkeleton";
import SectionHeader from "./SectionHeader";
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
    <section className="card space-y-4 p-5 md:p-6">
      <SectionHeader
        title={t("listing.relatedTitle")}
        subtitle={
          ad?.subcategory
            ? `${catLabel} · ${ad.subcategory}`
            : t("listing.categoryLabel", { name: catLabel })
        }
        linkTo={listingUrl}
        linkLabel={t("category.all")}
      />

      {loading ? (
        <ListingGridSkeleton count={4} columns="grid-cols-2 sm:grid-cols-4" />
      ) : (
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {items.map((item) => (
            <div
              key={item._id || item.id}
              className="w-[168px] shrink-0 snap-start sm:w-[190px]"
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
