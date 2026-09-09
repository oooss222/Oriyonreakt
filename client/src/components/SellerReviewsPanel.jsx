import React from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import { Alert, Avatar, Button, Field, SectionCard, Textarea, cn } from "../ui";
import { useI18n } from "../i18n";

const RATING_VALUES = [1, 2, 3, 4, 5];

export function StarRating({ value = 0, size = 16, className = "" }) {
  const { t } = useI18n();
  const rating = Number(value) || 0;

  return (
    <span
      role="img"
      aria-label={t("seller.ratingValue", { value: rating.toFixed(1) })}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {RATING_VALUES.map((star) => (
        <Star
          key={star}
          size={size}
          aria-hidden="true"
          className={
            star <= Math.round(rating)
              ? "fill-warning-400 text-warning-400"
              : "text-ink-300"
          }
        />
      ))}
    </span>
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
  const { t } = useI18n();
  const ratingName = React.useId();
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(t("seller.reviewNeedAuth"));
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
      setError(e.message || t("seller.reviewFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard
      title={t("seller.reviewsTitle")}
      icon={MessageSquareQuote}
      bodyClassName="space-y-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-3xl font-extrabold tabular-nums text-ink-900">
          {Number(summary.average || 0).toFixed(1)}
        </span>
        <StarRating value={summary.average} className="self-center" />
        <span className="text-sm text-ink-400">
          {t("seller.reviewsCount", { count: summary.count || 0 })}
        </span>
      </div>

      {canReview && (
        <form onSubmit={submit} className="surface-muted space-y-4 p-4">
          <h3 className="text-sm font-bold text-ink-900">{t("seller.reviewFormTitle")}</h3>

          <fieldset>
            <legend className="field-label">{t("seller.reviewRating")}</legend>

            <div className="flex items-center gap-1">
              {RATING_VALUES.map((value) => (
                <label
                  key={value}
                  className="grid min-h-[2.75rem] min-w-[2.75rem] cursor-pointer place-items-center"
                >
                  <input
                    type="radio"
                    name={ratingName}
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    className="peer sr-only"
                  />
                  <Star
                    size={26}
                    aria-hidden="true"
                    className={cn(
                      "rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sun/50 peer-focus-visible:ring-offset-2",
                      value <= rating ? "fill-warning-400 text-warning-400" : "text-ink-300"
                    )}
                  />
                  <span className="sr-only">
                    {t("seller.ratingOption", { value })}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t("seller.reviewComment")} hint={t("seller.reviewCommentHint")}>
            {(field) => (
              <Textarea
                {...field}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("seller.reviewPlaceholder")}
                rows={4}
              />
            )}
          </Field>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button type="submit" variant="primary" loading={loading}>
            {loading ? t("seller.reviewSubmitting") : t("seller.reviewSubmit")}
          </Button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-400">{t("seller.reviewsEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const name = item.reviewerName || t("seller.reviewer");

            return (
              <li key={item.id} className="surface-muted p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={name} size="sm" rounded="rounded-full" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
                    <p className="text-xs text-ink-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("ru-RU")
                        : ""}
                    </p>
                  </div>

                  <StarRating value={item.rating} size={14} className="shrink-0" />
                </div>

                {item.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-600 break-anywhere">
                    {item.comment}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
