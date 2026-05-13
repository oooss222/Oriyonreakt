import React from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Phone, User2 } from "lucide-react";
import { api, API_BASE } from "../lib/api";

const TOKEN_KEY = "auth_token";

function imageUrl(src) {
  if (!src) return "/img/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return API_BASE.replace("/api", "") + src;
}

export default function AdDetails() {
  const { id } = useParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [ad, setAd] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isFav, setIsFav] = React.useState(false);

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
          return;
        }

        const data = await api.listingById(id);
        if (active) setAd(data);
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
    if (!token || !ad) {
      setIsFav(false);
      return;
    }

    api
      .favorites(token)
      .then((list) => {
        const ids = new Set(
          (Array.isArray(list) ? list : []).map((i) =>
            String(i._id || i.id)
          )
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

    const adId = ad._id || ad.id;

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
        <div className="card p-6 text-center">Загрузка…</div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="container-x py-10">
        <div className="card p-6 text-center space-y-3">
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

  const price = ad.price || "Договорная";

  const specs = Array.isArray(ad.specs)
    ? ad.specs
    : ad.attrs && typeof ad.attrs === "object"
    ? Object.entries(ad.attrs).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="container-x py-6 space-y-6">
      <div className="card p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="badge">Объявление №{ad._id || ad.id}</div>
            <h1 className="text-2xl font-bold">{ad.title}</h1>
          </div>

          <button
            className={`btn ${isFav ? "btn-primary" : ""}`}
            onClick={toggleFav}
            title={isFav ? "Убрать из избранного" : "В избранное"}
          >
            ♥ {isFav ? "В избранном" : "В избранное"}
          </button>
        </div>

        <div className="text-slate-600 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          {ad.location || "—"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-3">
          <div className="w-full h-80 bg-slate-100 rounded-card overflow-hidden">
            <img
              src={images[0]}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {images.slice(1).map((src, index) => (
                <img
                  key={`${src}-${index}`}
                  src={src}
                  alt={ad.title}
                  className="w-full h-20 object-cover rounded-lg border bg-slate-100"
                />
              ))}
            </div>
          )}
        </div>

        <aside className="card p-4 space-y-4">
          <div>
            <div className="text-slate-500 text-sm">Цена</div>
            <div className="text-2xl font-extrabold">{price}</div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="text-slate-500 text-sm mb-1">Продавец</div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User2 className="w-5 h-5 text-slate-500" />
              </div>

              <div>
                <div className="font-semibold">
                  {ad.sellerName || "Пользователь Oriyon"}
                </div>

                <div className="text-xs text-slate-500">На сайте недавно</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {ad.phone ? (
              <a href={`tel:${ad.phone}`} className="btn btn-primary w-full">
                <Phone className="w-4 h-4" /> Позвонить: {ad.phone}
              </a>
            ) : (
              <button className="btn btn-primary w-full">
                Показать телефон
              </button>
            )}

            <button className="btn w-full">Написать сообщение</button>
          </div>
        </aside>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Описание</h2>

        <p className="text-slate-700 whitespace-pre-wrap">
          {ad.description || "Описание отсутствует."}
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Характеристики</h2>

        {specs.length > 0 ? (
          <ul className="text-slate-700 text-sm divide-y divide-slate-100">
            {specs.map((spec, index) => (
              <li
                key={`${spec.name}-${index}`}
                className="flex justify-between gap-4 py-1"
              >
                <span className="text-slate-500">{spec.name}</span>
                <span className="font-medium">{String(spec.value)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-slate-500 text-sm">
            Характеристики не указаны.
          </div>
        )}
      </div>
    </div>
  );
}