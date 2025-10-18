import React from "react";
import { useParams, Link } from "react-router-dom";
import AdSlot from "../components/AdSlot";

// === Категории и подкатегории ===
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
  const cat = CATS[slug];

  if (!cat) {
    return (
      <div className="container-x py-6">
        <div className="card p-4">
          <h1 className="text-xl font-bold">Категория не найдена</h1>
          <p className="text-slate-600 mt-1">
            Проверьте адрес или выберите категорию на главной.
          </p>
          <Link to="/" className="btn mt-3">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-6 space-y-6">
      {/* === 1️⃣ Заголовок категории === */}
      <header className="card p-4 flex items-center gap-3">
        <img
          src={cat.img}
          alt={cat.title}
          className="w-16 h-16 object-contain"
        />
        <div>
          <div className="badge">Категория</div>
          <h1 className="text-2xl font-bold">{cat.title}</h1>
          <p className="text-slate-600 text-sm">
            {cat.subs.length} подкатегорий
          </p>
        </div>
        <div className="ml-auto">
          <Link to={`/listing?cat=${slug}`} className="btn">
            Все объявления
          </Link>
        </div>
      </header>

      {/* === 2️⃣ Подкатегории (карточки) === */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cat.subs.map((sub) => (
            <Link
              key={sub}
              to={`/listing?cat=${slug}&sub=${encodeURIComponent(sub)}`}
              className="card p-4 hover:shadow transition flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-card bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                <span className="text-xl">📁</span>
              </div>
              <div className="text-sm font-semibold">{sub}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* === 3️⃣ Реклама === */}
      <section>
        <AdSlot type="banner" id={`cat-${slug}-banner`} />
      </section>

      {/* === 4️⃣ Безопасность === */}
      
    </div>
  );
}
