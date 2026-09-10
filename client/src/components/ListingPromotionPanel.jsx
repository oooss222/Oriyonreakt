import React from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import ListingPromotionActions from "./ListingPromotionActions";
import { PromotionBadgeGroup } from "./PromotionBadge";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import { EmptyState, Field, Select } from "../ui";
import { useI18n } from "../i18n";

const getId = (item) => item?.id || item?._id;

export default function ListingPromotionPanel({
  listings = [],
  bumpPrice = 5,
  walletBalance = 0,
  promotingId = null,
  onPromote,
  initialListingId = "",
}) {
  const { t } = useI18n();

  const approvedListings = React.useMemo(
    () => listings.filter((ad) => (ad.status || "pending") === "approved"),
    [listings]
  );

  const [selectedId, setSelectedId] = React.useState("");

  React.useEffect(() => {
    if (!approvedListings.length) {
      setSelectedId("");
      return;
    }

    const preferredId = String(initialListingId || "");
    const preferredExists = approvedListings.some(
      (ad) => String(getId(ad)) === preferredId
    );

    if (preferredId && preferredExists) {
      setSelectedId(preferredId);
      return;
    }

    const exists = approvedListings.some(
      (ad) => String(getId(ad)) === String(selectedId)
    );

    if (!selectedId || !exists) {
      setSelectedId(String(getId(approvedListings[0])));
    }
  }, [approvedListings, selectedId, initialListingId]);

  const selectedListing = approvedListings.find(
    (ad) => String(getId(ad)) === String(selectedId)
  );

  if (!approvedListings.length) {
    return (
      <EmptyState
        icon={Zap}
        title={t("promotion.emptyTitle")}
        description={t("promotion.emptyDesc")}
        actionLabel={t("footer.postListing")}
        actionTo="/add"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="card space-y-4 p-4 sm:p-5">
        <header>
          <span className="badge">
            <Zap size={14} aria-hidden="true" />
            {t("promotion.badge")}
          </span>

          <h2 className="mt-2 section-title">{t("promotion.panelTitle")}</h2>

          <p className="mt-1 text-sm leading-relaxed text-ink-400">
            {t("promotion.panelDesc")}
          </p>
        </header>

        <Field label={t("promotion.selectListing")}>
          {(field) => (
            <Select
              {...field}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {approvedListings.map((ad) => (
                <option key={getId(ad)} value={String(getId(ad))}>
                  {ad.title || t("listing.noTitle")}
                  {ad.location ? ` · ${ad.location}` : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {selectedListing && (
          <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-mist-50 p-3">
            <img
              src={getListingThumb(selectedListing, { width: 128 })}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-xl border border-ink-200 bg-white object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-ink-900">
                {selectedListing.title || t("listing.noTitle")}
              </p>

              <p className="mt-0.5 text-sm font-bold text-sun-700">
                {formatPrice(selectedListing.price, { emptyLabel: "—" })}
              </p>

              <div className="mt-1">
                <PromotionBadgeGroup
                  vip={selectedListing.vip}
                  top={selectedListing.top}
                  size="sm"
                />
              </div>
            </div>

            <Link
              to={`/ad/${getId(selectedListing)}`}
              className="btn btn-sm shrink-0"
            >
              {t("listing.openListing")}
            </Link>
          </div>
        )}
      </section>

      {selectedListing && (
        <ListingPromotionActions
          listing={selectedListing}
          bumpPrice={bumpPrice}
          walletBalance={walletBalance}
          promoting={
            promotingId && String(promotingId).startsWith(`${selectedId}-`)
              ? promotingId
              : null
          }
          onPromote={(type, days) => onPromote?.(selectedId, type, days)}
        />
      )}
    </div>
  );
}
