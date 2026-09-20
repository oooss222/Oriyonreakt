import React from "react";
import { Link } from "react-router-dom";
import { Check, Flag, Heart, Share2, ShieldCheck } from "lucide-react";
import CompareListingButton from "../CompareListingButton";
import SellerContactButtons from "../SellerContactButtons";
import { formatRegistrationDate } from "../../lib/format";
import { isCompareSupported } from "../../lib/compareListings";
import { isRealEstateListing } from "../../lib/realEstate";
import { StarRating } from "../SellerReviewsPanel";
import { useI18n } from "../../i18n";

function sellerTypeLabel(type, t) {
  return type === "company" ? t("seller.premium") : t("seller.private");
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "П";

  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function SellerAvatar({ ad, sellerName }) {
  const content = ad.ownerCompanyLogo ? (
    <img
      src={ad.ownerCompanyLogo}
      alt=""
      className="h-full w-full object-cover"
    />
  ) : (
    getInitials(sellerName)
  );

  const className =
    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lagoon text-sm font-bold text-white ring-1 ring-lagoon/20 transition hover:opacity-90";

  if (ad.owner) {
    return (
      <Link to={`/seller/${ad.owner}`} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default function AdPurchasePanel({
  price,
  realEstatePricePerSqm = "",
  ad,
  sellerName,
  sellerRegisteredAt,
  sellerReviews = { summary: { average: 0, count: 0 } },
  canContact,
  isInactive,
  phoneVisible,
  onRevealPhone,
  onChat,
  isFav,
  onToggleFav,
  onShare,
  copied,
  onReport,
  hideContacts = false,
}) {
  const { t } = useI18n();
  const compareCat = isRealEstateListing(ad) ? "realestate" : ad?.cat;
  const showCompare = isCompareSupported(compareCat);
  const registeredLabel = formatRegistrationDate(sellerRegisteredAt);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-3xl font-extrabold tracking-tight text-ink">
            {price}
          </div>
          {realEstatePricePerSqm && (
            <div className="mt-1 text-sm font-semibold text-sun-700">
              {realEstatePricePerSqm}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
              isFav
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-ink/10 bg-white text-ink-500 hover:border-ink/20 hover:text-red-500"
            }`}
            onClick={onToggleFav}
            aria-label={isFav ? t("favorites.ariaRemove") : t("favorites.add")}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {showCompare && (
            <CompareListingButton
              listingId={ad.id || ad._id}
              cat={compareCat}
              listing={ad}
              compact
              showOpenLink={false}
            />
          )}

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white text-ink-500 transition hover:border-ink/20 hover:bg-mist-50"
            onClick={onShare}
            aria-label={t("compare.share")}
          >
            {copied ? (
              <Check className="h-4 w-4 text-lagoon" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4 border-t border-ink/10 pt-5">
        <div className="flex items-center gap-3">
          <SellerAvatar ad={ad} sellerName={sellerName} />

          <div className="min-w-0">
            {ad.owner ? (
              <Link
                to={`/seller/${ad.owner}`}
                className="block truncate font-bold text-ink hover:text-sun transition"
              >
                {sellerName}
              </Link>
            ) : (
              <div className="truncate font-bold text-ink">{sellerName}</div>
            )}
            <div className="text-sm text-ink-500">
              {sellerTypeLabel(ad.ownerSellerType || "private", t)}
            </div>
            {registeredLabel && (
              <div className="mt-0.5 text-xs text-ink-400">
                {t("seller.memberSince", { date: registeredLabel })}
              </div>
            )}
            {sellerReviews.summary.count > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={sellerReviews.summary.average} size={14} />
                <span className="text-xs text-ink-500">
                  {Number(sellerReviews.summary.average).toFixed(1)} (
                  {sellerReviews.summary.count})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-lagoon/20 bg-lagoon-50 px-3 py-2.5 text-xs text-lagoon-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lagoon" />
          <span>{t("auth.trustLoginItem3Text")}</span>
        </div>
      </div>

      {!hideContacts &&
        (canContact ? (
          <SellerContactButtons
            phone={ad.phone}
            whatsapp={ad.sellerWhatsapp}
            telegram={ad.sellerTelegram}
            phoneVisible={phoneVisible}
            onRevealPhone={onRevealPhone}
            onChat={onChat}
            canContact={canContact}
            layout="ad"
          />
        ) : isInactive ? (
          <div className="rounded-xl border border-ink/10 bg-mist/70 px-4 py-3 text-sm text-ink-600">
            {t("seller.contactUnavailable")}
          </div>
        ) : null)}

      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-red-600"
        onClick={onReport}
      >
        <Flag className="h-3.5 w-3.5" />
        {t("report.title")}
      </button>
    </div>
  );
}
