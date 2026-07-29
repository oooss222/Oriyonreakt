import React from "react";
import { Link } from "react-router-dom";
import { Scale, Trash2 } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import RealEstateListingCard from "../components/RealEstateListingCard";
import { api } from "../lib/api";
import { clearCompare, readCompareIds } from "../lib/compareListings";
import { enrichRealEstateListing, getSpecValue } from "../lib/realEstate";
import { formatPrice } from "../lib/format";
import { usePageMeta } from "../lib/usePageMeta";

function CompareRow({ label, values }) {
  return (
    <tr className="border-t">
      <td className="p-3 text-sm font-medium text-slate-500 bg-slate-50">{label}</td>
      {values.map((value, index) => (
        <td key={index} className="p-3 text-sm text-slate-900 align-top">
          {value || "—"}
        </td>
      ))}
    </tr>
  );
}

export default function RealEstateCompare() {
  const [ids, setIds] = React.useState(() => readCompareIds());
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  usePageMeta({
    title: "Сравнение объявлений — Недвижимость | Oriyon.store",
    description: "Сравните до 3 объявлений недвижимости по цене, площади, этажу и району.",
  });

  React.useEffect(() => {
    const sync = () => setIds(readCompareIds());
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, []);

  React.useEffect(() => {
    let active = true;

    async function load() {
      if (!ids.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const rows = await Promise.all(
          ids.map((id) => api.listingById(id).catch(() => null))
        );

        if (active) {
          setItems(rows.filter(Boolean));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [ids]);

  const enriched = items.map((item) => enrichRealEstateListing(item));

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Недвижимость", to: "/realestate" },
          { label: "Сравнение" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale size={22} className="text-sun" />
            Сравнение объявлений
          </h1>
          <p className="text-sm text-slate-500 mt-1">До 3 объектов одновременно</p>
        </div>

        {ids.length > 0 && (
          <button
            type="button"
            onClick={() => clearCompare()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50"
          >
            <Trash2 size={16} />
            Очистить
          </button>
        )}
      </div>

      {loading && <div className="text-sm text-slate-500">Загрузка...</div>}

      {!loading && enriched.length === 0 && (
        <div className="rounded-2xl border bg-white p-8 text-center space-y-3">
          <p className="text-slate-600">Добавьте объявления через кнопку «Сравнить» в каталоге.</p>
          <Link to="/realestate/dushanbe/kvartiry" className="btn rounded-xl">
            Перейти в каталог
          </Link>
        </div>
      )}

      {!loading && enriched.length > 0 && (
        <>
          <div className="grid md:grid-cols-3 gap-3">
            {enriched.map((item) => (
              <RealEstateListingCard key={item.id || item._id} item={item} />
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 text-left text-sm font-semibold text-slate-600">Параметр</th>
                  {enriched.map((item) => (
                    <th key={item.id || item._id} className="p-3 text-left text-sm font-semibold">
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label="Цена"
                  values={enriched.map((item) => formatPrice(item.price))}
                />
                <CompareRow
                  label="Цена за м²"
                  values={enriched.map((item) => item.realEstateSummary?.pricePerSqm || "—")}
                />
                <CompareRow
                  label="Комнат"
                  values={enriched.map((item) => item.realEstateSummary?.rooms || "—")}
                />
                <CompareRow
                  label="Площадь"
                  values={enriched.map((item) => item.realEstateSummary?.area || "—")}
                />
                <CompareRow
                  label="Этаж"
                  values={enriched.map((item) => {
                    const s = item.realEstateSummary || {};
                    return s.floor
                      ? s.floorsTotal
                        ? `${s.floor}/${s.floorsTotal}`
                        : s.floor
                      : "—";
                  })}
                />
                <CompareRow
                  label="Район"
                  values={enriched.map((item) => item.realEstateSummary?.district || "—")}
                />
                <CompareRow
                  label="Ремонт"
                  values={enriched.map((item) => getSpecValue(item.specs, "Ремонт") || "—")}
                />
                <CompareRow
                  label="ЖК"
                  values={enriched.map((item) => getSpecValue(item.specs, "ЖК") || "—")}
                />
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
