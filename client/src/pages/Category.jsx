import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AdSlot from "../components/AdSlot";

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

  if (!cat) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-slate-500 mb-2">
            <button onClick={() => nav(-1)} className="hover:underline">
              Назад
            </button>
            <span className="mx-2">/</span>
            <Link to="/" className="hover:underline">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">Не найдено</span>
          </div>

          <h1 className="text-xl font-bold">Категория не найдена</h1>

          <p className="text-slate-600 mt-1">
            Проверьте адрес или выберите категорию на главной.
          </p>

          <Link
            to="/"
            className="mt-3 inline-flex px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            На главную
          </Link>
        </div>
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

      <header className="rounded-2xl border bg-white p-4 md:p-5 flex items-center gap-4">
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl border bg-slate-50 grid place-items-center overflow-hidden">
          <img
            src={cat.img}
            alt={cat.title}
            className="w-12 h-12 md:w-14 md:h-14 object-contain"
          />
        </div>

        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100">
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
            className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
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
            className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="rounded-2xl border bg-white p-6 text-center">
            <div className="text-slate-700 mb-2">
              Ничего не найдено по запросу «{q}».
            </div>

            <button
              onClick={() => setQ("")}
              className="inline-flex px-4 py-2 rounded-lg border hover:bg-slate-50"
            >
              Сбросить поиск
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {subs.map((sub) => (
              <Link
                key={sub}
                to={`/listing?cat=${slug}&subcategory=${encodeURIComponent(
                  sub
                )}`}
                className="rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-slate-50 to-white border grid place-items-center mb-2">
                  <span className="text-xl select-none">📁</span>
                </div>

                <div className="text-sm font-semibold line-clamp-2">
                  {sub}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="rounded-2xl overflow-hidden border bg-white shadow-sm">
          <AdSlot type="banner" id={`cat-${slug}-banner`} />
        </div>
      </section>
    </div>
  );
}