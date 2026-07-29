import React from "react";
import { Star } from "lucide-react";

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
            className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
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
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Войдите, чтобы оставить отзыв");
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
      setError(e.message || "Не удалось сохранить отзыв");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">Отзывы о продавце</div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={summary.average} />
            <span className="text-sm text-slate-600">
              {Number(summary.average || 0).toFixed(1)} · {summary.count || 0} отзывов
            </span>
          </div>
        </div>
      </div>

      {canReview && (
        <form onSubmit={submit} className="rounded-2xl border bg-slate-50 p-4 space-y-3">
          <div className="text-sm font-medium text-slate-800">Оставить отзыв</div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`rounded-lg px-2 py-1 text-sm border ${
                  rating >= value
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Расскажите о сделке..."
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
            {loading ? "Отправляем..." : "Отправить отзыв"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-slate-500">Пока нет отзывов.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900">
                  {item.reviewerName || "Покупатель"}
                </div>
                <StarRating value={item.rating} size={14} />
              </div>
              {item.comment && (
                <div className="text-sm text-slate-600 mt-2">{item.comment}</div>
              )}
              <div className="text-xs text-slate-400 mt-2">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("ru-RU")
                  : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
