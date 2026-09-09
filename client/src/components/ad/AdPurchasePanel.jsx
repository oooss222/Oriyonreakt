import React from "react";
import { Link } from "react-router-dom";
import { Check, Flag, Heart, Share2, ShieldCheck } from "lucide-react";
import CompareListingButton from "../CompareListingButton";
import SellerContactButtons from "../SellerContactButtons";
import { sellerTypeLabel } from "../../lib/businessAccount";
import { formatRegistrationDate } from "../../lib/format";
import { isCompareSupported } from "../../lib/compareListings";
import { isRealEstateListing } from "../../lib/realEstate";
import { StarRating } from "../SellerReviewsPanel";
import { useI18n } from "../../i18n";

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
}) {
  const { t } = useI18n();
  const compareCat = isRealEstateListing(ad) ? "realestate" : ad?.cat;
  const showCompare = isCompareSupported(compareCat);
  const registeredLabel = formatRegistrationDate(sellerRegisteredAt);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
            {price}
          </div>
          {realEstatePricePerSqm && (
            <div className="mt-1 text-sm font-semibold text-sun-700">
              {realEstatePricePerSqm}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
              isFav
                ? "border-danger-200 bg-danger-50 text-danger-500"
                : "border-ink-200 bg-white text-ink-400 hover:text-danger-500"
            }`}
            onClick={onToggleFav}
            aria-pressed={isFav}
            aria-label={t(isFav ? "favorites.remove" : "favorites.add")}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {showCompare && (
            <CompareListingButton
              listingId={ad.id || ad._id}
              cat={compareCat}
              compact
              showOpenLink={false}
            />
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 transition hover:bg-mist-100 hover:text-ink-700"
            onClick={onShare}
            aria-label={t("listing.share")}
          >
            {copied ? (
              <Check className="h-4 w-4 text-success-600" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4 border-t border-ink-200 pt-5">
        <div className="flex items-center gap-3">
          {ad.owner ? (
            <Link
              to={`/seller/${ad.owner}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lagoon-500 text-sm font-bold text-white transition hover:opacity-90"
            >
              {ad.ownerCompanyLogo ? (
                <img
                  src={ad.ownerCompanyLogo}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(sellerName)
              )}
            </Link>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lagoon-500 text-sm font-bold text-white">
              {getInitials(sellerName)}
            </div>
          )}

          <div className="min-w-0">
            {ad.owner ? (
              <Link
                to={`/seller/${ad.owner}`}
                className="block truncate font-bold text-ink-900 transition hover:text-sun-700"
              >
                {sellerName}
              </Link>
            ) : (
              <div className="truncate font-bold text-ink-900">{sellerName}</div>
            )}
            <div className="text-sm text-ink-400">
              {sellerTypeLabel(ad.ownerSellerType || "private")}
            </div>
            {registeredLabel && (
              <div className="mt-0.5 text-xs text-ink-400">
                {t("seller.registeredOn", { date: registeredLabel })}
              </div>
            )}
            {sellerReviews.summary.count > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={sellerReviews.summary.average} size={14} />
                <span className="text-xs text-ink-400">
                  {Number(sellerReviews.summary.average).toFixed(1)} (
                  {sellerReviews.summary.count})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-3 py-2.5 text-xs leading-relaxed text-success-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden />
          <span>{t("listing.safetyTip")}</span>
        </div>
      </div>

      {canContact ? (
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
        <div className="rounded-xl border border-ink-200 bg-mist-50 px-4 py-3 text-sm text-ink-500">
          {t("listing.contactUnavailable")}
        </div>
      ) : null}

      <button
        type="button"
        className="inline-flex min-h-[2.25rem] items-center gap-1.5 text-sm text-ink-400 transition hover:text-danger-600"
        onClick={onReport}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {t("report.action")}
      </button>
    </div>
  );
}
