import React from "react";
import { Link } from "react-router-dom";
import AdSlot from "../components/AdSlot";

const categories = [
  { slug: "transport", title: "Авто", img: "/img/car.png" },
  { slug: "furniture", title: "Мебель", img: "/img/furniture.png" },
  { slug: "phones", title: "Телефоны", img: "/img/phone.png" },
  { slug: "electronics", title: "Бытовая техника", img: "/img/electronics.png" },
  { slug: "computers", title: "Компьютеры и оргтехника", img: "/img/computers.png" },
  { slug: "repair", title: "Ремонт", img: "/img/repair.png" },
];

const listings = [
  { id: 1, title: "Toyota Camry 2018, 2.5 л", price: "155 000 TJS", location: "Душанбе", img: "/img/sample/car1.jpg", cat: "transport", description: "Отличное состояние" },
  { id: 2, title: "iPhone 13 Pro Max 256GB",  price: "13 500 TJS",  location: "Худжанд",  img: "/img/sample/phone1.jpg", cat: "phones",    description: "Полный комплект" },
  { id: 3, title: "Диван угловой, как новый",  price: "3 000 TJS",   location: "Куляб",   img: "/img/sample/furniture1.jpg", cat: "furniture", description: "Чистый, без пятен" },
  { id: 4, title: "Ноутбук ASUS Vivobook 15",  price: "6 800 TJS",   location: "Душанбе", img: "/img/sample/laptop1.jpg",    cat: "computers", description: "i5 / 8GB / 512GB" },
  { id: 5, title: "Отбойный молоток Bosch",    price: "1 200 TJS",   location: "Бохтар",  img: "/img/sample/tools1.jpg",     cat: "repair",    description: "Почти новый" },
];

export default function Home() {
  return (
    <div className="container-x space-y-8 py-6">
      {/* Категории */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Популярные категории</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/c/${cat.slug}`} className="card p-4 text-center hover:shadow transition flex flex-col items-center justify-center">
              <img src={cat.img} alt={cat.title} className="w-20 h-20 md:w-24 md:h-24 object-contain mb-3" />
              <div className="font-semibold text-base md:text-lg">{cat.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Баннер */}
      <section><AdSlot type="banner" id="home-banner" /></section>

      {/* Свежие объявления */}
      <section>
        <h2 className="text-xl font-bold mb-3">Свежие объявления</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {listings.map((ad) => (
            <Link
              key={ad.id}
              to={`/ad/${ad.id}`}
              onClick={() => {
                sessionStorage.setItem("ad_preview", JSON.stringify(ad));
                sessionStorage.setItem("ad_list", JSON.stringify(listings));
              }}
              className="card p-2 hover:shadow transition flex flex-col"
            >
              <img src={ad.img} alt={ad.title} className="w-full h-36 object-cover rounded-md mb-2" />
              <div className="font-semibold text-sm line-clamp-2">{ad.title}</div>
              <div className="text-accent font-bold">{ad.price}</div>
              <div className="text-xs text-slate-500">{ad.location}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
