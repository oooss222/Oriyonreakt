import React from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import FavoriteButton from "../FavoriteButton";
import { PromotionBadgeGroup } from "../PromotionBadge";
import { getListingThumb } from "../../lib/media";
import { formatPrice, formatListingDate, formatViewCount } from "../../lib/format";
import {
  getPromotionCardAccent,
  getPromotionCardClass,
} from "../../lib/promotionStyles";
import { getId } from "./profileUtils";

const STATUS_MAP = {
  pending: {
    label: "На модерации",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Опубликовано",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Отклонено",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  sold: {
    label: "Продано",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  archived: {
    label: "Снято",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

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
  const id = getId(ad);
  const imgUrl = getListingThumb(ad);
  const more = Math.max(0, (ad.images?.length || 0) - 1);
  const status = ad.status || "pending";
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <div
      className={`group relative rounded-2xl border bg-white p-1.5 hover:shadow-xl transition-all duration-300 overflow-hidden ${getPromotionCardClass(
        { vip: ad.vip, top: ad.top }
      )} ${selected ? "ring-2 ring-sun border-sun" : ""}`}
    >
      <span
        className={getPromotionCardAccent({ vip: ad.vip, top: ad.top })}
        aria-hidden="true"
      />

      {selectable && canManage && (
        <label className="absolute top-2 right-2 z-20 rounded-lg bg-white/95 border p-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(id)}
            className="w-4 h-4 accent-sun"
          />
        </label>
      )}

      <Link
        to={`/ad/${id}`}
        onClick={() => sessionStorage.setItem("ad_preview", JSON.stringify(ad))}
        className="block"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={imgUrl}
            alt={ad.title || "Объявление"}
            className={`w-full object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-105 ${
              compact ? "h-32" : "h-36"
            }`}
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1 z-10 max-w-[calc(100%-3rem)]">
            <span
              className={`inline-flex px-2 py-0.5 text-[11px] rounded-full border bg-white/90 backdrop-blur ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
            <PromotionBadgeGroup vip={ad.vip} top={ad.top} size="sm" />
          </div>

          {more > 0 && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white rounded-full px-2 py-0.5">
              +{more}
            </span>
          )}
        </div>

        <div className="p-2">
          <div className="font-semibold text-sm line-clamp-2 group-hover:text-sun transition">
            {ad.title || "Без названия"}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="text-sun-700 font-extrabold">
              {formatPrice(ad.price, { emptyLabel: "—" })}
            </div>
            {!canManage && <FavoriteButton id={id} defaultActive={isFavorite} compact />}
          </div>

          <div className="text-xs text-slate-500 line-clamp-1 mt-1">
            {ad.location || ad.city || "Локация не указана"}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1 text-xs text-slate-400">
            <span>{formatListingDate(ad, { emptyLabel: "Дата не указана" })}</span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} />
              {formatViewCount(ad.views)}
            </span>
          </div>
        </div>
      </Link>

      {ad.rejectionReason && (
        <div className="mx-2 mb-2 rounded-xl border border-red-200 bg-red-50 text-red-700 p-2 text-xs">
          <b>Причина:</b> {ad.rejectionReason}
        </div>
      )}

      {canManage && status === "rejected" && ad.appealStatus === "pending" && (
        <div className="mx-2 mb-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 p-2 text-xs">
          Апелляция на рассмотрении
        </div>
      )}

      {canManage && status === "rejected" && ad.appealStatus !== "pending" && (
        <div className="mx-2 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to={`/edit/${id}`}
            className="mobile-btn bg-sun text-white hover:bg-sun-600 text-sm"
          >
            <Pencil size={15} />
            Исправить
          </Link>
          <button
            type="button"
            onClick={() => onAppeal?.(id)}
            className="mobile-btn border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm"
          >
            Оспорить
          </button>
        </div>
      )}

      {canManage && (
        <div className="px-2 pb-2 flex flex-col gap-2">
          {status !== "rejected" && (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/edit/${id}`}
                className="mobile-btn bg-sun text-white hover:bg-sun-600"
              >
                <Pencil size={16} />
                Редактировать
              </Link>
              <button
                type="button"
                className="mobile-btn border text-red-600 hover:bg-red-50"
                onClick={() => onRemove(id)}
              >
                <Trash2 size={16} />
                Удалить
              </button>
            </div>
          )}

          {status === "approved" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                className="mobile-btn border text-slate-700 hover:bg-slate-50"
                onClick={() => onStatusAction?.(id, "sold")}
              >
                Продано
              </button>
              <button
                type="button"
                className="mobile-btn border text-slate-700 hover:bg-slate-50"
                onClick={() => onStatusAction?.(id, "archive")}
              >
                Снять с публикации
              </button>
            </div>
          )}

          {(status === "sold" || status === "archived") && (
            <button
              type="button"
              className="mobile-btn border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => onStatusAction?.(id, "republish")}
            >
              Опубликовать снова
            </button>
          )}
        </div>
      )}
    </div>
  );
});
