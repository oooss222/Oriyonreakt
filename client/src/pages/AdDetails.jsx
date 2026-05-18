import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  Phone,
  User2,
  MessageCircle,
  Heart,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { api, API_BASE } from "../lib/api";
import AdSlot from "../components/AdSlot";
import ListingCard from "../components/ListingCard";

const TOKEN_KEY = "auth_token";

function imageUrl(src) {
  if (!src) return "/img/placeholder.jpg";

  if (src.startsWith("http")) {
    return src;
  }

  const server = API_BASE.replace(/\/api$/, "");
  const clean = String(src).replace(/^\/+/, "");

  return `${server}/${clean}`;
}

function formatPrice(value) {
  if (value == null || value === "") return "Договорная";

  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));

  if (!Number.isFinite(n)) return String(value);

  return `${n.toLocaleString("ru-RU")} TJS`;
}

export default function AdDetails() {
  const { id } = useParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [ad, setAd] = React.useState(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [related, setRelated] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isFav, setIsFav] = React.useState(false);
  const [phoneVisible, setPhoneVisible] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadAd() {
      try {
        setLoading(true);

        const cached = JSON.parse(
          sessionStorage.getItem("ad_preview") || "null"
        );

        if (cached && String(cached._id || cached.id) === String(id)) {
          if (active) setAd(cached);
        } else {
          const data = await api.listingById(id);
          if (active) setAd(data);
        }
      } catch {
        if (active) setAd(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAd();

    return () => {
      active = false;
    };
  }, [id]);

  React.useEffect(() => {
    if (!ad) return;

    let active = true;

    async function loadRelated() {
      try {
        const data = await api.listings({
          cat: ad.cat || undefined,
          subcategory: ad.subcategory || undefined,
          limit: 12,
        });

        const currentId = String(ad._id || ad.id);

        const list = Array.isArray(data)
          ? data.filter((item) => String(item._id || item.id) !== currentId)
          : [];

        if (active) {
          setRelated(list.slice(0, 10));
        }
      } catch {
        if (active) setRelated([]);
      }
    }

    loadRelated();

    return () => {
      active = false;
    };
  }, [ad]);

  React.useEffect(() => {
    if (!token || !ad) {
      setIsFav(false);
      return;
    }

    api
      .favorites(token)
      .then((list) => {
        const ids = new Set(
          (Array.isArray(list) ? list : []).map((i) => String(i._id || i.id))
        );

        setIsFav(ids.has(String(ad._id || ad.id)));
      })
      .catch(() => setIsFav(false));
  }, [token, ad]);

  const toggleFav = async () => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    const adId = ad?._id || ad?.id;

    if (!adId) return;

    try {
      if (isFav) {
        await api.removeFavorite(token, adId);
        setIsFav(false);
      } else {
        await api.addFavorite(token, adId);
        setIsFav(true);
      }
    } catch (e) {
      console.error("Favorite toggle failed:", e);
    }
  };

  if (loading) {
    return (
      <div className="container-x py-10">
        <div className="card p-8 text-center text-slate-500">Загрузка…</div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="container-x py-10">
        <div className="card p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Объявление не найдено</h1>

          <p className="text-slate-600">
            Попробуйте вернуться назад или обновить страницу.
          </p>

          <Link to="/" className="btn btn-primary">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const images = ad.images?.length
    ? ad.images.map((i) => imageUrl(i.url || i))
    : ad.img
    ? [imageUrl(ad.img)]
    : ["/img/placeholder.jpg"];

  const specs = Array.isArray(ad.specs)
    ? ad.specs
    : ad.attrs && typeof ad.attrs === "object"
    ? Object.entries(ad.attrs).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const price = formatPrice(ad.price);

  return (
    <div className="container-x py-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <main className="lg:col-span-8 space-y-5">
          <section className="card p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border bg-blue-50 text-blue-700 px-3 py-1 text-xs mb-2">
                  Объявление №{ad.publicId || ad.public_id || ad._id || ad.id}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {ad.title || "Без названия"}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {ad.location || ad.city || "Душанбе"}
                  </span>

                  {ad.createdAt && !Number.isNaN(Date.parse(ad.createdAt)) && (
                    <span>
                      Опубликовано{" "}
                      {new Date(ad.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
              </div>

              <button
                className={`btn shrink-0 ${isFav ? "btn-primary" : ""}`}
                onClick={toggleFav}
                title={isFav ? "Убрать из избранного" : "В избранное"}
              >
                <Heart className="w-4 h-4" />
                {isFav ? "В избранном" : "В избранное"}
              </button>
            </div>
          </section>

          <section className="card p-3 md:p-4">
           <div 
               className="relative rounded-3xl overflow-hidden bg-slate-100 cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={ad.title || "Фото объявления"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/900x600?text=No+Image";
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {images.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`shrink-0 rounded-xl border-2 overflow-hidden ${
                        activeImageIndex === index
                          ? "border-blue-600"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={src}
                        alt={`${ad.title || "Фото"} ${index + 1}`}
                        className="w-24 h-20 object-cover bg-slate-100"
                      />
                    </button>
                  ))}
                </div>
              )}
          </section>

          <section className="card p-4 md:p-5">
            <h2 className="text-lg font-bold mb-3">Описание</h2>

            <p className="text-slate-700 whitespace-pre-wrap leading-7">
              {ad.description || "Описание отсутствует."}
            </p>
          </section>

          <section className="card p-4 md:p-5">
            <h2 className="text-lg font-bold mb-3">Характеристики</h2>

            {specs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {specs.map((spec, index) => (
                  <div
                    key={`${spec.name}-${index}`}
                    className="flex items-center justify-between gap-4 py-2 text-sm"
                  >
                    <span className="text-slate-500">{spec.name}</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {String(spec.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">
                Характеристики не указаны.
              </div>
            )}
          </section>

          <AdSlot type="banner" id="ad-details-bottom-banner" />

          {related.length > 0 && (
            <section className="card p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold">Похожие объявления</h2>
                  <p className="text-sm text-slate-500">
                    Другие объявления из этой категории
                  </p>
                </div>

                <Link to="/listing" className="text-sm text-blue-600">
                  Смотреть все
                </Link>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                {related.map((item) => (
                  <div
                    key={item._id || item.id}
                    className="min-w-[220px] max-w-[220px] snap-start"
                  >
                    <ListingCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-5">
          <section className="card p-6 md:p-7 lg:sticky lg:top-24 rounded-3xl">
            <div className="text-sm text-slate-500">Цена</div>

            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {price}
            </div>

            <div className="border-t border-slate-200 mt-4 pt-4">
              <div className="text-slate-500 text-sm mb-2">Продавец</div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                  <User2 className="w-5 h-5 text-blue-600" />
                </div>

                <div>
                  <div className="font-bold">
                    {ad.sellerName || "Пользователь Oriyon"}
                  </div>

                  <div className="text-xs text-slate-500">
                    На сайте недавно
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                <ShieldCheck className="w-4 h-4" />
                Безопасная сделка: проверяйте товар перед оплатой
              </div>
            </div>

            <div className="space-y-2 mt-4">
            {ad.phone ? (
              phoneVisible ? (
                <a href={`tel:${ad.phone}`} className="btn btn-primary w-full">
                  <Phone className="w-4 h-4" />
                  {ad.phone}
                </a>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={() => setPhoneVisible(true)}
                >
                  <Phone className="w-4 h-4" />
                  Показать телефон
                </button>
              )
            ) : (
              <button className="btn btn-primary w-full">
                <Phone className="w-4 h-4" />
                Показать телефон
              </button>
            )}

            <button className="btn w-full">
              <MessageCircle className="w-4 h-4" />
              Написать сообщение
            </button>
          </div>

            <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              ID объявления: {ad.publicId || ad.public_id || ad._id || ad.id}
            </div>
          </section>

               </aside>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 text-white text-3xl"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                );
              }}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-white text-5xl"
            >
              ‹
            </button>
          )}

          <img
            src={images[activeImageIndex] || images[0]}
            alt={ad.title || "Фото объявления"}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-5xl"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}