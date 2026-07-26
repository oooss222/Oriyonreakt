import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { usePageMeta } from "../lib/usePageMeta";
import { Search, FolderOpen } from "lucide-react";

const CATS = {
  transport: {
    title: "Авто",
    img: "/img/car.png",
    subs: [
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
  },
  furniture: {
    title: "Мебель",
    img: "/img/furniture.png",
    subs: [
      "Мебель для спальни",
      "Офисная мебель",
      "Мебель для гостиной",
      "Мебель для прихожей",
      "Мебель на заказ",
    ],
  },
  phones: {
    title: "Телефоны",
    img: "/img/phone.png",
    subs: [
      "Мобильные телефоны",
      "Планшеты",
      "Мобильные аксессуары",
      "Ремонт и сервис телефонов",
    ],
  },
  electronics: {
    title: "Бытовая техника",
    img: "/img/electronics.png",
    subs: [
      "Техника для дома и кухни",
      "Видеонаблюдение и камеры",
      "Климатическая техника",
      "Обогреватели",
    ],
  },
  computers: {
    title: "Компьютеры и оргтехника",
    img: "/img/computers.png",
    subs: ["Ноутбуки", "ПК", "Приставки", "Принтеры и сканеры"],
  },
  repair: {
    title: "Ремонт",
    img: "/img/repair.png",
    subs: [
      "Окна и двери",
      "Дома, срубы и снаряжения",
      "Средства индивидуальной защиты",
      "Ворота и заборы",
      "Стройматериалы",
      "Инструменты",
      "Прочее для ремонта",
    ],
  },
};

export default function Category() {
  const { slug } = useParams();
  const nav = useNavigate();
  const cat = CATS[slug];

  const [q, setQ] = React.useState("");

  const subs = React.useMemo(() => {
    if (!cat) return [];

    const t = q.trim().toLowerCase();

    if (!t) return cat.subs;

    return cat.subs.filter((s) => s.toLowerCase().includes(t));
  }, [q, cat]);

  usePageMeta({
    title: cat ? cat.title : "Категория не найдена",
    description: cat
      ? `Объявления в категории «${cat.title}» на Oriyon.store. ${cat.subs.length} подкатегорий.`
      : "Запрошенная категория не существует на Oriyon.store.",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  if (!cat) {
    return (
      <div className="page-container py-6">
        <EmptyState
          icon={FolderOpen}
          title="Категория не найдена"
          description="Проверьте адрес или выберите категорию на главной."
          actionLabel="На главную"
          actionTo="/"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <nav className="text-sm text-slate-500">
        <button onClick={() => nav(-1)} className="hover:underline">
          Назад
        </button>
        <span className="mx-2">/</span>
        <Link to="/" className="hover:underline">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{cat.title}</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 md:p-6 flex items-center gap-4 shadow-sm">
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl border bg-slate-50 grid place-items-center overflow-hidden">
          <img
            src={cat.img}
            alt={cat.title}
            className="w-12 h-12 md:w-14 md:h-14 object-contain"
          />
        </div>

        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-sun-50 text-sun-700 border border-sun-100">
              Категория
            </span>

            <span className="text-xs text-slate-500">
              Подкатегорий:{" "}
              <span className="font-medium text-slate-700">
                {cat.subs.length}
              </span>
            </span>
          </div>

          <h1 className="text-2xl font-bold leading-tight">{cat.title}</h1>

          <p className="text-slate-600 text-sm mt-1">
            Выберите подкатегорию или посмотрите все объявления.
          </p>
        </div>

        <div className="ml-auto flex gap-2">
          <Link
            to={`/listing?cat=${slug}`}
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-sun text-white hover:bg-sun-600 transition shadow-sm"
          >
            Все объявления
          </Link>

          <Link
            to="/"
            className="inline-flex px-4 py-2 rounded-xl border hover:bg-slate-50 transition"
          >
            На главную
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border bg-white p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Быстрый поиск по подкатегориям…"
            className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          />

          <div className="text-xs text-slate-500 md:w-56">
            Найдено:{" "}
            <span className="font-medium text-slate-700">
              {subs.length}
            </span>
          </div>
        </div>
      </div>

      <section>
        {subs.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`Ничего не найдено по запросу «${q}»`}
            description="Попробуйте другой запрос или посмотрите все объявления категории."
            actionLabel="Сбросить поиск"
            onAction={() => setQ("")}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
  <Link
    to={`/listing?cat=${slug}`}
    className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-medium"
  >
    Все
  </Link>

  {subs.map((sub) => (
    <Link
      key={sub}
      to={`/listing?cat=${slug}&subcategory=${encodeURIComponent(sub)}`}
      className="px-5 py-2 rounded-full border bg-white text-slate-800 text-sm font-medium hover:bg-slate-900 hover:text-white transition"
    >
      {sub}
    </Link>
  ))}
</div>
        )}
      </section>

    </div>
  );
}