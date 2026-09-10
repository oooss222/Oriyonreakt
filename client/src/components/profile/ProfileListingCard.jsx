import React from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button, Checkbox, StatusBadge, cn } from "../../ui";
import FavoriteButton from "../FavoriteButton";
import { PromotionBadgeGroup } from "../PromotionBadge";
import { getListingThumb } from "../../lib/media";
import { formatPrice, formatListingDate, formatViewCount } from "../../lib/format";
import { getPromotionCardClass } from "../../lib/promotionStyles";
import { formatPhoneDisplay, getId, getListingStatusMeta } from "./profileUtils";
import { useI18n } from "../../i18n";

// `btn-sm` is 34px tall, which is below the touch-target floor, so the owner
// actions keep the small type but grow back to 40px.
const ACTION = "min-h-[2.5rem]";
const ACTION_ICON = "h-10 w-10";

export default React.memo(function ProfileListingCard({
  ad,
  canManage,
  onRemove,
  onStatusAction,
  compact = false,
  isFavorite = false,
  onAppeal,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const { t } = useI18n();
  const id = getId(ad);
  const imgUrl = getListingThumb(ad, { width: 400 });
  const more = Math.max(0, (ad.images?.length || 0) - 1);
  const status = ad.status || "pending";
  const statusInfo = getListingStatusMeta(status, t);
  const inactive = status === "sold" || status === "archived";
  const phone = formatPhoneDisplay(ad.phone);
  const title = ad.title || t("listing.noTitle");
  const showSelect = selectable && canManage;
  const hasMediaControl = showSelect || !canManage;

  const primeDetailView = () => {
    try {
      sessionStorage.setItem("ad_preview", JSON.stringify(ad));
    } catch {
      // A full quota only costs the detail page its warm start.
    }
  };

  // The title link is the real navigation target so the card stays keyboard and
  // middle-click friendly; this only extends the mouse target to the rest of the
  // card without swallowing the owner controls layered on top of it.
  const onCardClick = (event) => {
    if (event.target.closest("a, button, input, label, [role='button']")) return;

    event.currentTarget.querySelector(".listing-card__link")?.click();
  };

  return (
    <article
      onClick={onCardClick}
      className={cn(
        "listing-card group cursor-pointer",
        getPromotionCardClass({ vip: ad.vip, top: ad.top }),
        selected && "border-sun-400 ring-2 ring-sun-500",
        inactive && "opacity-80"
      )}
    >
      <div className={cn("listing-card__media", inactive && "grayscale-[40%]")}>
        <img
          src={imgUrl}
          alt={title}
          width={400}
          height={300}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex flex-wrap items-start gap-1.5 p-2",
            hasMediaControl && "pr-12"
          )}
        >
          <StatusBadge tone={statusInfo.tone} label={statusInfo.label} className="shadow-xs" />
          <PromotionBadgeGroup vip={ad.vip} top={ad.top} size="sm" />
        </div>

        {showSelect && (
          <div className="absolute right-1.5 top-1.5 z-20 rounded-xl border border-ink-200 bg-white shadow-sm">
            <Checkbox
              label={t("profile.selectListing", { title })}
              labelClassName="sr-only"
              checked={selected}
              onChange={() => onToggleSelect?.(id)}
              className="h-10 w-10 items-center justify-center"
            />
          </div>
        )}

        {!canManage && (
          <div className="absolute right-1.5 top-1.5 z-20">
            <FavoriteButton id={id} defaultActive={isFavorite} overlay />
          </div>
        )}

        {more > 0 && (
          <span className="absolute bottom-2 right-2 z-10 media-pill">
            +{more}
            <span className="sr-only"> {t("a11y.photoCount")}</span>
          </span>
        )}
      </div>

      <div className={cn("listing-card__body", compact && "p-2.5")}>
        <div className="listing-card__price-row">
          <strong className="listing-card__price">
            {formatPrice(ad.price, { emptyLabel: "—" })}
          </strong>
        </div>

        <h3 className="listing-card__title">
          <Link
            to={`/ad/${id}`}
            onClick={primeDetailView}
            className="listing-card__link"
          >
            {title}
          </Link>
        </h3>

        <span className="listing-card__location">
          <MapPin size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {ad.location || ad.city || t("profile.noLocation")}
          </span>
        </span>

        {phone && (
          <span className="listing-card__location tabular-nums">
            <Phone size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{phone}</span>
          </span>
        )}

        <div className="listing-card__footer">
          <time className="listing-card__time">
            {formatListingDate(ad, { emptyLabel: "—" })}
          </time>
          <span className="listing-card__time inline-flex items-center gap-1">
            <Eye size={12} aria-hidden="true" />
            {formatViewCount(ad.views)}
            <span className="sr-only"> {t("a11y.viewCount")}</span>
          </span>
        </div>

        {ad.rejectionReason && (
          <p className="mt-1 rounded-xl border border-danger-200 bg-danger-50 p-2.5 text-xs leading-relaxed text-danger-700">
            <span className="font-semibold">{t("profile.reason")}:</span>{" "}
            {ad.rejectionReason}
          </p>
        )}
      </div>

      {canManage && (
        <div className="mt-auto border-t border-ink-200 bg-mist-50 p-3">
          {status === "rejected" && ad.appealStatus === "pending" && (
            <p className="badge badge-info w-full justify-center py-2">
              {t("profile.appealPending")}
            </p>
          )}

          {status === "rejected" && ad.appealStatus !== "pending" && (
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Button
                variant="primary"
                size="sm"
                to={`/edit/${id}`}
                icon={Pencil}
                className={ACTION}
              >
                <span className="truncate">{t("profile.fixListing")}</span>
              </Button>
              <Button
                size="sm"
                icon={RefreshCw}
                className={ACTION}
                onClick={() => onAppeal?.(id)}
              >
                <span className="truncate">{t("profile.dispute")}</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                className={ACTION_ICON}
                aria-label={t("common.delete")}
                title={t("common.delete")}
                onClick={() => onRemove(id)}
              />
            </div>
          )}

          {status !== "rejected" && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  to={`/edit/${id}`}
                  icon={Pencil}
                  className={ACTION}
                >
                  <span className="truncate">{t("profile.editListing")}</span>
                </Button>
                <Button
                  size="sm"
                  to="/profile?tab=analytics"
                  icon={BarChart3}
                  className={ACTION_ICON}
                  aria-label={t("profile.analytics")}
                  title={t("profile.analytics")}
                />
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  className={ACTION_ICON}
                  aria-label={t("common.delete")}
                  title={t("common.delete")}
                  onClick={() => onRemove(id)}
                />
              </div>

              {status === "approved" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    icon={CheckCircle2}
                    className={ACTION}
                    onClick={() => onStatusAction?.(id, "sold")}
                  >
                    <span className="truncate">{t("profile.statusSold")}</span>
                  </Button>
                  <Button
                    size="sm"
                    icon={EyeOff}
                    className={ACTION}
                    onClick={() => onStatusAction?.(id, "archive")}
                  >
                    <span className="truncate">{t("profile.unpublish")}</span>
                  </Button>
                </div>
              )}

              {inactive && (
                <Button
                  variant="lagoon"
                  size="sm"
                  block
                  icon={Archive}
                  className={ACTION}
                  onClick={() => onStatusAction?.(id, "republish")}
                >
                  <span className="truncate">{t("profile.republish")}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
});
