import React from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Phone, User2 } from "lucide-react";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";

export default function AdDetails() {
  const { id } = useParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [ad, setAd] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isFav, setIsFav] = React.useState(false);

  React.useEffect(() => {
    // 1) пробуем из sessionStorage
    try {
      const cached = JSON.parse(sessionStorage.getItem("ad_preview") || "null");
      if (cached && String(cached._id || cached.id) === String(id)) {
        setAd(cached);
        setLoading(false);
      } else {
        api
          .listingById(id)
          .then(setAd)
          .finally(() => setLoading(false));
      }
    } catch {
      api
        .listingById(id)
        .then(setAd)
        .finally(() => setLoading(false));
    }
  }, [id]);

  // проверим статус избранного
  React.useEffect(() => {
    if (!token || !ad) {
      setIsFav(false);
      return;
    }
    api
      .favorites(token)
      .then((list) => {
        const set = new Set(list.map((i) => String(i._id || i.id)));
        setIsFav(set.has(String(ad._id || ad.id)));
      })
      .catch(() => setIsFav(false));
  }, [token, ad]);

  const toggleFav = async () => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }
    const adId = ad._id || ad.id;
    try {
      if (isFav) {
        await api.removeFavorite(token, adId);
        setIsFav(false);
      } else {
        await api.addFavorite(token, adId);
        setIsFav(true);
      }
    } catch {
      /* ignore */
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
    ? ad.images.map((i) => i.url || i)
    : ad.img
    ? [ad.img]
    : [];
  const price = ad.price || "Договорная";

  return (
    <div className="container-x py-6 space-y-6">
      {/* Название и категория */}
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
          <MapPin className="w-4 h-4 text-accent" /> {ad.location || "—"}
        </div>
      </div>

      {/* Галерея и информация */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Галерея */}
        <div className="lg:col-span-2 card p-3">
          <div className="w-full h-80 bg-slate-100 rounded-card overflow-hidden">
            <img
              src={images[0] || "/img/placeholder.jpg"}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Боковая панель */}
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

      {/* Описание */}
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Описание</h2>
        <p className="text-slate-700">
          {ad.description || "Описание отсутствует."}
        </p>
      </div>

      {/* Характеристики */}
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Характеристики</h2>
        {ad.attrs && Object.keys(ad.attrs).length > 0 ? (
          <ul className="text-slate-700 text-sm divide-y divide-slate-100">
            {Object.entries(ad.attrs).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium">{String(v)}</span>
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
