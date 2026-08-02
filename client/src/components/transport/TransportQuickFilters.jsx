import React from "react";
import { Link } from "react-router-dom";

const TRANSPORT_QUICK_FILTERS = [
  {
    label: "Легковые",
    to: "/listing?cat=transport&subcategory=Легковые%20авто",
  },
  {
    label: "До 50 000 км",
    to: "/listing?cat=transport&subcategory=Легковые%20авто&mileageTo=50000",
  },
  {
    label: "2020+",
    to: "/listing?cat=transport&subcategory=Легковые%20авто&yearFrom=2020",
  },
  {
    label: "Новые",
    to: '/listing?cat=transport&subcategory=Легковые%20авто&specs={"Состояние":"Новый"}',
  },
  {
    label: "Запчасти",
    to: "/listing?cat=transport&subcategory=Запчасти",
  },
  {
    label: "Грузовики",
    to: "/listing?cat=transport&subcategory=Грузовики",
  },
];

export default function TransportQuickFilters() {
  return (
    <div className="rounded-2xl border bg-white p-3 md:p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
        Быстрый поиск
      </div>
      <div className="flex flex-wrap gap-2">
        {TRANSPORT_QUICK_FILTERS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-900 hover:text-white transition"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
