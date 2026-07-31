import React from "react";
import { Scale, Trash2 } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import RealEstateListingCard from "../components/RealEstateListingCard";
import { api } from "../lib/api";
import { clearCompare, readCompareIds } from "../lib/compareListings";
import { enrichRealEstateListing, getSpecValue } from "../lib/realEstate";
import { formatPrice } from "../lib/format";
import { usePageMeta } from "../lib/usePageMeta";

const COMPARE_FIELDS = [
  { key: "price", label: "Цена", get: (item) => formatPrice(item.price) },
  {
    key: "pricePerSqm",
    label: "Цена за м²",
    get: (item) => item.realEstateSummary?.pricePerSqm || "—",
  },
  {
    key: "rooms",
    label: "Комнат",
    get: (item) => item.realEstateSummary?.rooms || "—",
  },
  {
    key: "area",
    label: "Площадь",
    get: (item) => item.realEstateSummary?.area || "—",
  },
  {
    key: "floor",
    label: "Этаж",
    get: (item) => {
      const s = item.realEstateSummary || {};
      if (!s.floor) return "—";
      return s.floorsTotal ? `${s.floor}/${s.floorsTotal}` : s.floor;
    },
  },
  {
    key: "district",
    label: "Район",
    get: (item) => item.realEstateSummary?.district || "—",
  },
  {
    key: "repair",
    label: "Ремонт",
    get: (item) => getSpecValue(item.specs, "Ремонт") || "—",
  },
  {
    key: "development",
    label: "ЖК",
    get: (item) => getSpecValue(item.specs, "ЖК") || "—",
  },
];

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

function CompareMobileCard({ item }) {
  return (
    <article className="rounded-2xl border bg-white p-4 space-y-3">
      <div>
        <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
        <div className="text-lg font-extrabold text-lagoon-700 mt-1">
          {formatPrice(item.price)}
        </div>
      </div>

      <dl className="space-y-2">
        {COMPARE_FIELDS.slice(1).map((field) => (
          <div
            key={field.key}
            className="flex items-start justify-between gap-3 text-sm border-t border-slate-100 pt-2 first:border-t-0 first:pt-0"
          >
            <dt className="text-slate-500 shrink-0">{field.label}</dt>
            <dd className="font-medium text-slate-900 text-right">{field.get(item)}</dd>
          </div>
        ))}
      </dl>
    </article>
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
        <EmptyState
          icon={Scale}
          title="Список сравнения пуст"
          description="Добавьте до 3 объявлений через кнопку «Сравнить» в каталоге недвижимости."
          actionLabel="Перейти в каталог"
          actionTo="/realestate/dushanbe/kvartiry"
        />
      )}

      {!loading && enriched.length > 0 && (
        <>
          <div className="grid md:grid-cols-3 gap-3">
            {enriched.map((item) => (
              <RealEstateListingCard key={item.id || item._id} item={item} />
            ))}
          </div>

          <div className="md:hidden space-y-3">
            {enriched.map((item) => (
              <CompareMobileCard key={item.id || item._id} item={item} />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 text-left text-sm font-semibold text-slate-600">
                    Параметр
                  </th>
                  {enriched.map((item) => (
                    <th key={item.id || item._id} className="p-3 text-left text-sm font-semibold">
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_FIELDS.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={enriched.map((item) => field.get(item))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
