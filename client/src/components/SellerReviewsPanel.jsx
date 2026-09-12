import React from "react";
import { Star } from "lucide-react";
import { useI18n } from "../i18n";

export function StarRating({ value = 0, size = 16, className = "" }) {
  const rating = Number(value) || 0;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index + 1 <= Math.round(rating);

        return (
          <Star
            key={index}
            size={size}
            className={filled ? "fill-amber-400 text-amber-400" : "text-ink-300"}
          />
        );
      })}
    </div>
  );
}

export default function SellerReviewsPanel({
  sellerId,
  listingId,
  token,
  canReview = false,
  summary = { average: 0, count: 0 },
  items = [],
  onSubmitted,
}) {
  const { t, lang } = useI18n();
  const numberLocale =
    lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(t("seller.reviewLoginRequired"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { api } = await import("../lib/api");
      const result = await api.createSellerReview(token, {
        sellerId,
        listingId,
        rating,
        comment,
      });

      setComment("");
      onSubmitted?.(result);
    } catch (e) {
      setError(e.message || t("seller.reviewSaveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-ink-900">{t("seller.reviewsTitle")}</div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={summary.average} />
            <span className="text-sm text-ink-600">
              {Number(summary.average || 0).toFixed(1)} ·{" "}
              {t("seller.reviewsCount", { count: summary.count || 0 })}
            </span>
          </div>
        </div>
      </div>

      {canReview && (
        <form onSubmit={submit} className="rounded-2xl border bg-mist-50 p-4 space-y-3">
          <div className="text-sm font-medium text-ink-800">{t("seller.leaveReview")}</div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`rounded-lg px-2 py-1 text-sm border ${
                  rating >= value
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-white border-mist-200 text-ink-500"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("seller.reviewPlaceholder")}
            className="input w-full min-h-[90px]"
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary rounded-xl disabled:opacity-60"
          >
            {loading ? t("report.sending") : t("seller.reviewSubmit")}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-ink-500">{t("seller.reviewsEmpty")}</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-mist-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-ink-900">
                  {item.reviewerName || t("seller.buyerFallback")}
                </div>
                <StarRating value={item.rating} size={14} />
              </div>
              {item.comment && (
                <div className="text-sm text-ink-600 mt-2">{item.comment}</div>
              )}
              <div className="text-xs text-ink-400 mt-2">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(numberLocale)
                  : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
