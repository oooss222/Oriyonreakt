import React from "react";
import { Heart, PlusCircle } from "lucide-react";
import { EmptyState } from "../../ui";
import ProfileListingCard from "./ProfileListingCard";
import { getId } from "./profileUtils";
import { useI18n } from "../../i18n";

export default React.memo(function ProfileListingsGrid({
  items,
  tab,
  canManage,
  onRemove,
  onStatusAction,
  compact = false,
  onAppeal,
  selectable = false,
  selectedIds = new Set(),
  onToggleSelect,
}) {
  const { t } = useI18n();

  if (!items?.length) {
    const favorites = tab === "fav";

    return (
      <EmptyState
        bare
        icon={favorites ? Heart : PlusCircle}
        title={favorites ? t("favorites.empty") : t("empty.noMyListings")}
        description={favorites ? t("favorites.emptyHint") : t("empty.noMyListingsHint")}
        actionLabel={favorites ? t("empty.goHome") : t("empty.postListing")}
        actionTo={favorites ? "/" : "/add"}
        actionVariant={favorites ? "secondary" : "primary"}
      />
    );
  }

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        compact || canManage
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      }`}
    >
      {items.map((ad) => {
        const id = getId(ad);
        return (
          <ProfileListingCard
            key={id}
            ad={ad}
            canManage={canManage}
            onRemove={onRemove}
            onStatusAction={onStatusAction}
            compact={compact}
            isFavorite={tab === "fav"}
            onAppeal={onAppeal}
            selectable={selectable}
            selected={selectedIds.has(String(id))}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </div>
  );
});
