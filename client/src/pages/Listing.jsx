import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";

// локальный запасной список — на случай, если API временно недоступен
const FALLBACK = [
  {
    id: 1,
    title: "Toyota Camry 2018, 2.5 л",
    price: "155 000 TJS",
    location: "Душанбе",
    img: "/img/car.png",
    cat: "transport",
    description: "Отличное состояние",
  },
  {
    id: 2,
    title: "iPhone 13 Pro Max 256GB",
    price: "13 500 TJS",
    location: "Худжанд",
    img: "/img/phone.png",
    cat: "phones",
    description: "Полный комплект",
  },
  {
    id: 3,
    title: "Диван угловой, как новый",
    price: "3 000 TJS",
    location: "Куляб",
    img: "/img/furniture.png",
    cat: "furniture",
    description: "Чистый, без пятен",
  },
  {
    id: 4,
    title: "Ноутбук ASUS Vivobook 15",
    price: "6 800 TJS",
    location: "Душанбе",
    img: "/img/computers.png",
    cat: "computers",
    description: "i5 / 8GB / 512GB",
  },
  {
    id: 5,
    title: "Отбойный молоток Bosch",
    price: "1 200 TJS",
    location: "Бохтар",
    img: "/img/repair.png",
    cat: "repair",
    description: "Почти новый",
  },
];

export default function Listing() {
  const [sp] = useSearchParams();
  const cat = (sp.get("cat") || "").toLowerCase();
  const q = (sp.get("q") || "").toLowerCase();

  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [favIds, setFavIds] = React.useState(() => new Set());

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // загрузка объявлений
  React.useEffect(() => {
    setLoading(true);
    api
      .listings({ cat, q, skip: 0, take: 40 })
      .then(({ items, total }) => {
        setItems(items || []);
        setTotal(total || (items?.length ?? 0));
      })
      .catch(() => {
        // мягкий фолбэк на локальные данные
        let list = [...FALLBACK];
        if (cat) list = list.filter((i) => (i.cat || "").toLowerCase() === cat);
        if (q)
          list = list.filter((i) => (i.title || "").toLowerCase().includes(q));
        setItems(list);
        setTotal(list.length);
      })
      .finally(() => setLoading(false));
  }, [cat, q]);

  // загрузка избранного
  React.useEffect(() => {
    if (!token) {
      setFavIds(new Set());
      return;
    }
    api
      .favorites(token)
      .then((list) => {
        const set = new Set(list.map((i) => String(i._id || i.id)));
        setFavIds(set);
      })
      .catch(() => setFavIds(new Set()));
  }, [token]);

  const toggleFav = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      window.location.href = "/auth";
      return;
    }
    const key = String(id);
    const isFav = favIds.has(key);
    try {
      if (isFav) {
        await api.removeFavorite(token, id);
        const next = new Set(favIds);
        next.delete(key);
        setFavIds(next);
      } else {
        await api.addFavorite(token, id);
        const next = new Set(favIds);
        next.add(key);
        setFavIds(next);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="container-x py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {cat
            ? `Объявления: ${cat[0]?.toUpperCase() + cat.slice(1)}`
            : "Все объявления"}
        </h1>
        <div className="text-slate-500 text-sm">Найдено: {total}</div>
      </div>

      {loading ? (
        <div className="card p-6 text-center text-slate-600">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="card p-6 text-center text-slate-600">
          Ничего не найдено.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((ad) => {
            const id = ad._id || ad.id;
            const imgUrl =
              ad.images?.[0]?.url || ad.img || "/img/placeholder.jpg";
            const isFav = favIds.has(String(id));
            return (
              <Link
                key={id}
                to={`/ad/${id}`}
                onClick={() => {
                  sessionStorage.setItem("ad_preview", JSON.stringify(ad));
                  sessionStorage.setItem("ad_list", JSON.stringify(items));
                }}
                className="card p-2 hover:shadow transition flex flex-col relative"
              >
                {/* Heart */}
                <button
                  className={`absolute top-2 right-2 rounded-full px-2 py-1 text-sm border ${
                    isFav
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white text-slate-700"
                  }`}
                  onClick={(e) => toggleFav(e, id)}
                  title={isFav ? "Убрать из избранного" : "В избранное"}
                >
                  ♥
                </button>

                <img
                  src={imgUrl}
                  alt={ad.title}
                  className="w-full h-36 object-contain rounded-md mb-2 bg-white"
                />
                <div className="font-semibold text-sm line-clamp-2">
                  {ad.title}
                </div>
                <div className="text-accent font-bold">{ad.price || "—"}</div>
                <div className="text-xs text-slate-500">
                  {ad.location || ""}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
