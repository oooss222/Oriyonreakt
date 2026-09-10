import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Zap } from "lucide-react";
import ListingPromotionActions from "./ListingPromotionActions";
import { PromotionBadgeGroup } from "./PromotionBadge";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";

const getId = (item) => item?.id || item?._id;

export default function ListingPromotionPanel({
  listings = [],
  bumpPrice = 5,
  walletBalance = 0,
  promotingId = null,
  onPromote,
  initialListingId = "",
}) {
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
      <div className="rounded-3xl border bg-white p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-sun-50 grid place-items-center mb-3">
          <Zap className="text-sun" size={26} />
        </div>

        <div className="text-ink font-semibold mb-1">
          Нет объявлений для продвижения
        </div>

        <p className="text-sm text-ink-400 mb-4 max-w-md mx-auto">
          VIP, TOP и обновление даты доступны только для опубликованных
          объявлений. Сначала подайте объявление и дождитесь одобрения
          модерации.
        </p>

        <Link
          to="/add"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sun text-white hover:bg-sun-600 transition"
        >
          <PlusCircle size={18} />
          Подать объявление
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
            <Zap size={16} />
            Продвижение
          </div>

          <h2 className="text-2xl font-bold">VIP, TOP и обновление даты</h2>

          <p className="text-sm text-ink-400 mt-1">
            Выберите объявление и подключите нужную услугу. Кнопки продвижения
            больше не привязаны к карточкам в списке объявлений.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink-600 mb-1 block">
            Объявление для продвижения
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 bg-white"
          >
            {approvedListings.map((ad) => (
              <option key={getId(ad)} value={String(getId(ad))}>
                {ad.title || "Без названия"}
                {ad.location ? ` · ${ad.location}` : ""}
              </option>
            ))}
          </select>
        </label>

        {selectedListing && (
          <div className="rounded-2xl border bg-mist/70 p-3 flex items-center gap-3">
            <img
              src={getListingThumb(selectedListing, { width: 128 })}
              alt=""
              className="w-16 h-16 rounded-xl object-cover bg-white border shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm line-clamp-2">
                {selectedListing.title || "Без названия"}
              </div>
              <div className="text-sm text-sun-700 font-bold mt-0.5">
                {formatPrice(selectedListing.price, { emptyLabel: "—" })}
              </div>
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
              className="text-sm font-semibold text-sun-700 hover:underline shrink-0"
            >
              Открыть
            </Link>
          </div>
        )}
      </div>

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
