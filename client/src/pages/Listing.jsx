import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import FavoriteButton from "../components/FavoriteButton";
import { api, API_BASE } from "../lib/api";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Все категории" },
  { value: "transport", label: "Авто" },
  { value: "furniture", label: "Мебель" },
  { value: "phones", label: "Телефоны" },
  { value: "electronics", label: "Бытовая техника" },
  { value: "computers", label: "Компьютеры" },
  { value: "repair", label: "Ремонт" },
];

const SUBCATEGORIES = {
  transport: [
    "Легковые авто",
    "Запчасти",
    "Услуги для авто",
    "Грузовики и автобусы",
    "Мототранспорт",
    "Сельхозтехника",
    "Спецтехника",
    "Прицепы",
    "Шины и диски",
    "Автохимия и автомасла",
  ],
  furniture: [
    "Мебель для спальни",
    "Офисная мебель",
    "Мебель для гостиной",
    "Мебель для прихожей",
    "Мебель на заказ",
  ],
  phones: [
    "Мобильные телефоны",
    "Планшеты",
    "Мобильные аксессуары",
    "Ремонт и сервис телефонов",
  ],
  electronics: [
    "Техника для дома и кухни",
    "Видеонаблюдение и камеры",
    "Климатическая техника",
    "Обогреватели",
  ],
  computers: [
    "Ноутбуки",
    "ПК",
    "Приставки",
    "Принтеры и сканеры",
  ],
  repair: [
    "Окна и двери",
    "Дома, срубы и снаряжения",
    "Средства индивидуальной защиты",
    "Ворота и заборы",
    "Стройматериалы",
    "Инструменты",
    "Прочее для ремонта",
  ],
};

const SPEC_FILTERS = {
  phones: [
    {
      name: "Производитель",
      options: ["Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "Realme"],
    },
    {
      name: "Память",
      options: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
    },
    {
      name: "Состояние",
      options: ["Новый", "Б/у", "Требует ремонта"],
    },
    {
      name: "Гарантия",
      options: ["Да", "Нет"],
    },
  ],
  transport: [
    {
      name: "КПП",
      options: ["Автомат", "Механика", "Робот", "Вариатор"],
    },
    {
      name: "Топливо",
      options: ["Бензин", "Дизель", "Газ", "Гибрид", "Электро"],
    },
    {
      name: "Состояние",
      options: ["Новый", "Б/у", "Требует ремонта"],
    },
  ],
};

const getThumb = (ad) => {
  if (ad?.images?.length) {
    const f = ad.images[0];

    let src = "";

    if (typeof f === "string") {
      src = f;
    } else {
      src = f?.url || f?.src || f?.path || f?.secure_url || f?.preview || "";
    }

    if (!src) return "/img/placeholder.jpg";

    if (src.startsWith("http") || src.startsWith("/img/")) {
      return src;
    }

    const server = API_BASE.replace(/\/api$/, "");
    const clean = String(src).replace(/^\/+/, "");

    return `${server}/${clean}`;
  }

  return ad?.img || ad?.image || "/img/placeholder.jpg";
};

const getPriceNumber = (value) => {
  if (value == null || value === "") return null;

  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));

  return Number.isFinite(n) ? n : null;
};

const formatPrice = (value) => {
  const n = getPriceNumber(value);

  if (n == null) {
    return value || "Цена не указана";
  }

  return `${n.toLocaleString("ru-RU")} TJS`;
};



export default function Listing() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const cat = searchParams.get("cat") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const search = searchParams.get("search") || "";
  const priceFrom = searchParams.get("priceFrom") || "";
  const priceTo = searchParams.get("priceTo") || "";
  const sort = searchParams.get("sort") || "new";

  const [draft, setDraft] = React.useState({
  search,
  cat,
  subcategory,
  priceFrom,
  priceTo,
  sort,
  specs: {},
});

  React.useEffect(() => {
    setDraft({
      search,
      cat,
      subcategory,
      priceFrom,
      priceTo,
      sort,
      specs: {},
    });
  }, [search, cat, subcategory, priceFrom, priceTo, sort]);

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const data = await api.listings({
          cat: cat || undefined,
          subcategory: subcategory || undefined,
          search: search || undefined,
          priceFrom: priceFrom || undefined,
          priceTo: priceTo || undefined,
          sort: sort || "new",
          limit: 100,
        });

        if (active) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Не удалось загрузить объявления");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      active = false;
    };
  }, [cat, subcategory, search, priceFrom, priceTo, sort]);

  const activeCat = draft.cat || cat;
  const availableSubcategories = React.useMemo(() => {
  return activeCat ? SUBCATEGORIES[activeCat] || [] : [];
}, [activeCat]);

const specFilters = React.useMemo(() => {
  return activeCat ? SPEC_FILTERS[activeCat] || [] : [];
}, [activeCat]);

  const applyFilters = () => {
    const next = {};

    if (draft.search.trim()) next.search = draft.search.trim();
    if (draft.cat) next.cat = draft.cat;
    if (draft.subcategory) next.subcategory = draft.subcategory;
    if (draft.priceFrom) next.priceFrom = draft.priceFrom;
    if (draft.priceTo) next.priceTo = draft.priceTo;
    if (draft.photo) next.photo = draft.photo;
    if (draft.sort && draft.sort !== "new") next.sort = draft.sort;

    setSearchParams(next);
  };

  const resetFilters = () => {
    setDraft({
      search: "",
      cat: "",
      subcategory: "",
      priceFrom: "",
      priceTo: "",
      photo: "",
      sort: "new",
    });

    setSearchParams({});
  };

  const hasActiveFilters =
    search ||
    cat ||
    subcategory ||
    priceFrom ||
    priceTo ||
    photo ||
    sort !== "new";

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
              <SlidersHorizontal size={16} />
              Фильтры поиска
            </div>

            <h1 className="text-2xl font-bold">Объявления в Душанбе</h1>

            <p className="text-sm text-slate-500 mt-1">
              Найдено: {items.length}
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-slate-50"
            >
              <X size={18} />
              Сбросить фильтры
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={draft.search}
              onChange={(e) =>
                setDraft((v) => ({
                  ...v,
                  search: e.target.value,
                }))
              }
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Поиск по названию или описанию"
              className="h-11 w-full rounded-xl border pl-10 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!cat && (
  <select
    value={draft.cat}
    onChange={(e) =>
      setDraft((v) => ({
        ...v,
        cat: e.target.value,
        subcategory: "",
        specs: {},
      }))
    }
    className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
  >
    {CATEGORIES.map((item) => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))}
  </select>
)}

          <select
            value={draft.subcategory}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                subcategory: e.target.value,
              }))
            }
            disabled={!draft.cat}
            className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Все подкатегории</option>

            {availableSubcategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            value={draft.priceFrom}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                priceFrom: e.target.value.replace(/[^\d.,]/g, ""),
              }))
            }
            placeholder="Цена от"
            className="md:col-span-1 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            value={draft.priceTo}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                priceTo: e.target.value.replace(/[^\d.,]/g, ""),
              }))
            }
            placeholder="Цена до"
            className="md:col-span-1 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={draft.sort}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                sort: e.target.value,
              }))
            }
            className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="new">Сначала новые</option>
            <option value="price_asc">Цена по возрастанию</option>
            <option value="price_desc">Цена по убыванию</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          

          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Search size={18} />
            Применить фильтры
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border bg-white p-8 text-center text-slate-500">
          Загрузка объявлений...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border bg-red-50 text-red-700 p-8 text-center">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-3xl border bg-white p-10 text-center">
          <div className="text-slate-800 font-semibold">
            По выбранным фильтрам ничего не найдено
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Попробуйте изменить цену, категорию или поисковый запрос.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-5 py-2.5 rounded-xl border hover:bg-slate-50"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((ad, idx) => {
            const id = ad._id || ad.id;
            const imgUrl = getThumb(ad);
            const more = Math.max(0, (ad.images?.length || 0) - 1);

            return (
              <Link
                key={id}
                to={`/ad/${id}`}
                onClick={() =>
                  sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                }
                className="group relative flex flex-col rounded-2xl border bg-white p-2 transition hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
                aria-label={`Объявление: ${ad.title || "Без названия"}`}
              >
                <div className="absolute z-10 right-2 top-2">
                  <FavoriteButton id={id} defaultActive={ad.isFavorite} />
                </div>

                <div className="relative">
                  <img
                    src={imgUrl}
                    alt={ad.title || "Фото"}
                    loading="lazy"
                    className="w-full h-40 object-cover rounded-xl bg-slate-100"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />

                  {(ad.vip || ad.top) && (
                    <div className="absolute left-2 top-2 flex gap-2">
                      {ad.vip && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-500 text-white shadow">
                          VIP
                        </span>
                      )}

                      {ad.top && (
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-indigo-600 text-white shadow">
                          TOP
                        </span>
                      )}
                    </div>
                  )}

                  {ad.price != null && ad.price !== "" && (
                    <div className="absolute left-2 bottom-2 rounded-full bg-black/65 text-white text-xs px-2 py-1 shadow-sm">
                      {formatPrice(ad.price)}
                    </div>
                  )}

                  {more > 0 && (
                    <span className="absolute right-2 bottom-2 text-[11px] bg-black/70 text-white rounded px-1">
                      +{more}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex-1 flex flex-col gap-1">
                  <div className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-blue-600 transition">
                    {ad.title || "Без названия"}
                  </div>

                  <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                    <MapPin size={13} />
                    {ad.location || ad.city || "Душанбе"}
                  </div>

                  <div className="text-xs text-slate-400">
                  {ad.createdAt && !Number.isNaN(Date.parse(ad.createdAt))
                    ? new Date(ad.createdAt).toLocaleDateString("ru-RU")
                    : ""}
                </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}