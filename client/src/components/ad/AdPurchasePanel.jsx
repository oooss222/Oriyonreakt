import React from "react";
import { Link } from "react-router-dom";
import { Check, Flag, Heart, Share2, ShieldCheck } from "lucide-react";
import BusinessBadge from "../BusinessBadge";
import SellerContactButtons from "../SellerContactButtons";
import { StarRating } from "../SellerReviewsPanel";

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

function AdSecondaryActions({
  isFav,
  onToggleFav,
  onShare,
  copied,
  onReport,
  layout = "row",
}) {
  if (layout === "compact") {
    return (
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition ${
              isFav
                ? "bg-red-50 border-red-200 text-red-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            onClick={onToggleFav}
            aria-label={isFav ? "В избранном" : "В избранное"}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            onClick={onShare}
            aria-label="Поделиться"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          className="text-sm text-slate-500 hover:text-red-600 transition inline-flex items-center gap-1"
          onClick={onReport}
        >
          <Flag className="w-3.5 h-3.5" />
          Пожаловаться
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`btn py-2.5 rounded-2xl ${
            isFav ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : ""
          }`}
          onClick={onToggleFav}
        >
          <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          {isFav ? "В избранном" : "В избранное"}
        </button>

        <button type="button" className="btn py-2.5 rounded-2xl" onClick={onShare}>
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Поделиться
        </button>
      </div>

      <button
        type="button"
        className="text-sm text-slate-500 hover:text-red-600 transition inline-flex items-center gap-1 px-1"
        onClick={onReport}
      >
        <Flag className="w-3.5 h-3.5" />
        Пожаловаться на объявление
      </button>
    </div>
  );
}

export default function AdPurchasePanel({
  price,
  realEstatePricePerSqm = "",
  ad,
  sellerName,
  published,
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
  compact = false,
  showSecondaryActions = true,
  secondaryLayout = "row",
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-slate-500 mb-1">Цена</div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {price}
        </div>
        {realEstatePricePerSqm && (
          <div className="text-sm font-semibold text-sun-700 mt-1">
            {realEstatePricePerSqm}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-4">
        <div className="text-sm text-slate-500">Продавец</div>

        <div className="flex items-center gap-3">
          {ad.owner ? (
            <Link
              to={`/seller/${ad.owner}`}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sun to-lagoon flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 hover:opacity-90 transition overflow-hidden"
            >
              {ad.ownerCompanyLogo ? (
                <img
                  src={ad.ownerCompanyLogo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(sellerName)
              )}
            </Link>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sun to-lagoon flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {getInitials(sellerName)}
            </div>
          )}

          <div className="min-w-0">
            {ad.owner ? (
              <Link
                to={`/seller/${ad.owner}`}
                className="font-bold text-slate-900 truncate block hover:text-sun transition"
              >
                {sellerName}
              </Link>
            ) : (
              <div className="font-bold text-slate-900 truncate">{sellerName}</div>
            )}
            <div className="mt-1">
              <BusinessBadge
                sellerType={ad.ownerSellerType}
                businessVerified={ad.ownerBusinessVerified}
                size="lg"
              />
            </div>
            {!compact && (
              <div className="text-xs text-slate-500">
                {published ? `Объявление ${published.toLowerCase()}` : "На сайте"}
              </div>
            )}
            {sellerReviews.summary.count > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={sellerReviews.summary.average} size={14} />
                <span className="text-xs text-slate-500">
                  {Number(sellerReviews.summary.average).toFixed(1)} (
                  {sellerReviews.summary.count})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>Встречайтесь лично и проверяйте товар перед оплатой</span>
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
          compact={compact}
        />
      ) : isInactive ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Связаться с продавцом по этому объявлению нельзя.
        </div>
      ) : null}

      {showSecondaryActions && (
        <AdSecondaryActions
          isFav={isFav}
          onToggleFav={onToggleFav}
          onShare={onShare}
          copied={copied}
          onReport={onReport}
          layout={secondaryLayout}
        />
      )}
    </div>
  );
}
