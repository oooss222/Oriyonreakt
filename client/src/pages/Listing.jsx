import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import FavoriteButton from "../components/FavoriteButton";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import EmptyState from "../components/EmptyState";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  PackageSearch,
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

export default function Listing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const cat = searchParams.get("cat") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const search =
  searchParams.get("search") ||
  searchParams.get("q") ||
  "";
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
          setItems(Array.isArray(data) ? data.filter(Boolean) : []);
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
  const suggestions = React.useMemo(() => {
  const q = draft.search.trim().toLowerCase();

  if (q.length < 2) return [];

  const fromListings = items
    .filter((item) =>
      String(item.title || "").toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((item) => ({
      type: "Объявление",
      label: item.title,
      value: item.title,
    }));

  const fromCategories = CATEGORIES
    .filter((item) =>
      item.value && item.label.toLowerCase().includes(q)
    )
    .slice(0, 3)
    .map((item) => ({
      type: "Категория",
      label: item.label,
      value: item.label,
      cat: item.value,
    }));

  return [...fromListings, ...fromCategories].slice(0, 8);
}, [draft.search, items]);
 

const specFilters = React.useMemo(() => {
  return activeCat ? SPEC_FILTERS[activeCat] || [] : [];
}, [activeCat]);

  const applyFilters = () => {
    const next = {};

    const normalizedSearch = draft.search.trim();

  if (normalizedSearch) {
    next.search = normalizedSearch;
    next.q = normalizedSearch;
  }
    if (draft.cat) next.cat = draft.cat;
    if (draft.subcategory) next.subcategory = draft.subcategory;
    if (draft.priceFrom) next.priceFrom = draft.priceFrom;
    if (draft.priceTo) next.priceTo = draft.priceTo;
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
  sort !== "new";

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
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
    onFocus={() => setShowSuggestions(true)}
    onChange={(e) => {
      setDraft((v) => ({
        ...v,
        search: e.target.value,
      }));
      setShowSuggestions(true);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        setShowSuggestions(false);
        applyFilters();
      }

      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    }}
    placeholder="Поиск по названию или описанию"
    className="h-11 w-full rounded-xl border pl-10 pr-3 outline-none focus:ring-2 focus:ring-sun/40"
  />

  {showSuggestions && suggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl border bg-white shadow-xl overflow-hidden">
      {suggestions.map((item, index) => (
        <button
          key={`${item.type}-${item.label}-${index}`}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();

            if (item.cat) {
              setDraft((v) => ({
                ...v,
                cat: item.cat,
                subcategory: "",
                search: "",
                specs: {},
              }));

              setSearchParams({
                cat: item.cat,
              });
            } else {
              setDraft((v) => ({
                ...v,
                search: item.value,
              }));
            }

            setShowSuggestions(false);
          }}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0"
        >
          <div className="text-sm font-medium text-slate-900">
            {item.label}
          </div>

          <div className="text-xs text-slate-500">
            {item.type}
          </div>
        </button>
      ))}
    </div>
  )}
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
    className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
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
            className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 disabled:bg-slate-100 disabled:text-slate-400"
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
            className="md:col-span-1 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
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
            className="md:col-span-1 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          />

          <select
            value={draft.sort}
            onChange={(e) =>
              setDraft((v) => ({
                ...v,
                sort: e.target.value,
              }))
            }
            className="md:col-span-2 h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
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
            className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-sun text-white hover:bg-sun-600 transition"
          >
            <Search size={18} />
            Применить фильтры
          </button>
        </div>
      </div>

      {loading && <ListingGridSkeleton />}

      {!loading && error && (
        <EmptyState
          icon={PackageSearch}
          title="Не удалось загрузить объявления"
          description={error}
          actionLabel="Попробовать снова"
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Search}
          title="По выбранным фильтрам ничего не найдено"
          description="Попробуйте изменить цену, категорию или поисковый запрос."
          actionLabel="Сбросить фильтры"
          onAction={resetFilters}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((ad, idx) => {
            const id = ad._id || ad.id;
            const imgUrl = getListingThumb(ad);
            const more = Math.max(0, (ad.images?.length || 0) - 1);

            return (
              <div
                key={id}
                role="link"
                tabIndex={0}
                onClick={() => {
                  if (!id) return;
                  sessionStorage.setItem("ad_preview", JSON.stringify(ad));
                  nav(`/ad/${id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!id) return;
                    sessionStorage.setItem("ad_preview", JSON.stringify(ad));
                    nav(`/ad/${id}`);
                  }
                }}
                className="group relative flex flex-col rounded-2xl border bg-white p-2 transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sun/40 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
                aria-label={`Объявление: ${ad.title || "Без названия"}`}
              >
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
                        <span className="px-2 py-0.5 text-[11px] rounded-full bg-lagoon text-white shadow">
                          TOP
                        </span>
                      )}
                    </div>
                  )}

                  {more > 0 && (
                    <span className="absolute right-2 bottom-2 text-[11px] bg-black/70 text-white rounded px-1">
                      +{more}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex-1 flex flex-col gap-1">
                  <div className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-sun transition">
                    {ad.title || "Без названия"}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-price text-sm">
                      {formatPrice(ad.price)}
                    </div>

                    <FavoriteButton id={id} defaultActive={ad.isFavorite} compact />
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}