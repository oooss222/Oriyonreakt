import React from "react";
import { Link } from "react-router-dom";

const TRANSPORT_QUICK_FILTERS = [
  {
    label: "Легковые",
    to: "/c/transport?subcategory=Легковые%20авто",
  },
  {
    label: "До 50 000 км",
    to: "/c/transport?subcategory=Легковые%20авто&mileageTo=50000",
  },
  {
    label: "2020+",
    to: "/c/transport?subcategory=Легковые%20авто&yearFrom=2020",
  },
  {
    label: "Новые",
    to: '/c/transport?subcategory=Легковые%20авто&specs={"Состояние":"Новый"}',
  },
  {
    label: "Запчасти",
    to: "/c/transport?subcategory=Запчасти",
  },
  {
    label: "Грузовики",
    to: "/c/transport?subcategory=Грузовики",
  },
];

export default function TransportQuickFilters() {
  return (
    <div className="filter-panel p-3 md:p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">
        Быстрый поиск
      </div>
      <div className="flex flex-wrap gap-2">
        {TRANSPORT_QUICK_FILTERS.map((item) => (
          <Link key={item.label} to={item.to} className="chip">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
