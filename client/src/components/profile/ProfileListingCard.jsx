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
import FavoriteButton from "../FavoriteButton";
import { PromotionBadgeGroup } from "../PromotionBadge";
import { getListingThumb } from "../../lib/media";
import { formatPrice, formatListingDate, formatViewCount } from "../../lib/format";
import {
  getPromotionCardClass,
  getPromotionMediaClass,
} from "../../lib/promotionStyles";
import { formatPhoneDisplay, getId } from "./profileUtils";
import { useI18n } from "../../i18n";

function getStatusMap(t) {
  return {
    pending: {
      label: t("profile.statusPending"),
      className: "bg-amber-400 text-white",
    },
    approved: {
      label: t("profile.statusApproved"),
      className: "bg-emerald-500 text-white",
    },
    rejected: {
      label: t("profile.statusRejected"),
      className: "bg-red-500 text-white",
    },
    sold: {
      label: t("profile.statusSold"),
      className: "bg-slate-700 text-white",
    },
    archived: {
      label: t("profile.statusArchived"),
      className: "bg-slate-500 text-white",
    },
  };
}

function CardAction({ as: Component = "button", icon: Icon, children, variant = "muted", className = "", ...props }) {
  const variants = {
    primary: "bg-sun text-white hover:bg-sun-600 shadow-sm",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
    muted: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    success: "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
    ghost: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    teal: "border border-teal-200 bg-teal-50 text-teal-800",
  };

  return (
    <Component
      type={Component === "button" ? "button" : undefined}
      className={[
        "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition",
        variants[variant] || variants.muted,
        className,
      ].join(" ")}
      {...props}
    >
      {Icon && <Icon size={14} className="shrink-0" />}
      {children ? <span className="truncate">{children}</span> : null}
    </Component>
  );
}

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
  const statusMap = getStatusMap(t);
  const statusInfo = statusMap[status] || statusMap.pending;
  const inactive = status === "sold" || status === "archived";
  const phone = formatPhoneDisplay(ad.phone);

  return (
    <article
      className={[
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg",
        getPromotionCardClass({ vip: ad.vip, top: ad.top }),
        selected ? "ring-2 ring-sun border-sun" : "border-slate-200",
        inactive ? "opacity-75" : "",
      ].join(" ")}
    >
      {selectable && canManage && (
        <label className="absolute top-2 right-2 z-20 cursor-pointer rounded-lg border bg-white/95 p-1.5 shadow-sm">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(id)}
            className="h-4 w-4 accent-sun"
          />
        </label>
      )}

      <Link
        to={`/ad/${id}`}
        onClick={() => sessionStorage.setItem("ad_preview", JSON.stringify(ad))}
        className="block min-w-0 flex-1"
      >
        <div className={`relative overflow-hidden ${inactive ? "grayscale-[40%]" : ""}`}>
          <img
            src={imgUrl}
            alt={ad.title || "Объявление"}
            className={[
              "w-full bg-slate-100 object-cover transition-transform duration-500 group-hover:scale-[1.03]",
              compact ? "h-36" : "h-40 sm:h-44",
              getPromotionMediaClass({ vip: ad.vip }),
            ].join(" ")}
            loading="lazy"
          />

          <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-1.5 p-2.5">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
            <PromotionBadgeGroup vip={ad.vip} top={ad.top} size="sm" />
          </div>

          {more > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
              +{more}
            </span>
          )}
        </div>

        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-sun">
            {ad.title || "Без названия"}
          </h3>

          <div className="flex items-center justify-between gap-2">
            <div className="text-base font-extrabold text-sun">
              {formatPrice(ad.price, { emptyLabel: "—" })}
            </div>
            {!canManage && <FavoriteButton id={id} defaultActive={isFavorite} compact />}
          </div>

          <div className="flex items-center gap-1 line-clamp-1 text-xs text-slate-500">
            <MapPin size={12} className="shrink-0 text-slate-400" />
            {ad.location || ad.city || t("profile.noLocation")}
          </div>

          {phone && (
            <div className="flex items-center gap-1 text-xs text-slate-500 tabular-nums">
              <Phone size={12} className="shrink-0 text-slate-400" />
              {phone}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>{formatListingDate(ad, { emptyLabel: "—" })}</span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} />
              {formatViewCount(ad.views)}
            </span>
          </div>
        </div>
      </Link>

      {ad.rejectionReason && (
        <div className="mx-3 mb-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          <b>{t("profile.reason")}:</b> {ad.rejectionReason}
        </div>
      )}

      {canManage && status === "rejected" && ad.appealStatus === "pending" && (
        <div className="mx-3 mb-3">
          <CardAction variant="teal" className="w-full pointer-events-none">
            {t("profile.appealPending")}
          </CardAction>
        </div>
      )}

      {canManage && (
        <div className="mt-auto border-t border-slate-100 bg-slate-50/60 p-3">
          {status === "rejected" && ad.appealStatus !== "pending" && (
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <CardAction as={Link} to={`/edit/${id}`} icon={Pencil} variant="primary">
                {t("profile.fixListing")}
              </CardAction>
              <CardAction icon={RefreshCw} variant="muted" onClick={() => onAppeal?.(id)}>
                {t("profile.dispute")}
              </CardAction>
              <CardAction
                icon={Trash2}
                variant="danger"
                className="px-3"
                aria-label={t("common.delete")}
                onClick={() => onRemove(id)}
              />
            </div>
          )}

          {status !== "rejected" && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <CardAction as={Link} to={`/edit/${id}`} icon={Pencil} variant="primary">
                  {t("profile.editListing")}
                </CardAction>
                <CardAction
                  as={Link}
                  to="/profile?tab=analytics"
                  icon={BarChart3}
                  variant="muted"
                  className="px-3"
                  aria-label={t("profile.analytics")}
                />
                <CardAction
                  icon={Trash2}
                  variant="danger"
                  className="px-3"
                  aria-label={t("common.delete")}
                  onClick={() => onRemove(id)}
                />
              </div>

              {status === "approved" && (
                <div className="grid grid-cols-2 gap-2">
                  <CardAction
                    icon={CheckCircle2}
                    variant="ghost"
                    onClick={() => onStatusAction?.(id, "sold")}
                  >
                    {t("profile.statusSold")}
                  </CardAction>
                  <CardAction
                    icon={EyeOff}
                    variant="ghost"
                    onClick={() => onStatusAction?.(id, "archive")}
                  >
                    {t("profile.unpublish")}
                  </CardAction>
                </div>
              )}

              {(status === "sold" || status === "archived") && (
                <CardAction
                  icon={Archive}
                  variant="success"
                  className="w-full"
                  onClick={() => onStatusAction?.(id, "republish")}
                >
                  {t("profile.republish")}
                </CardAction>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
});
