import React from "react";
import { Link } from "react-router-dom";
import { Scale, Trash2, X, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import CompareExternalForm from "../components/CompareExternalForm";
import CompareSourceBadge from "../components/CompareSourceBadge";
import ComparePriceInsights from "../components/ComparePriceInsights";
import { api } from "../lib/api";
import {
  clearCompare,
  readCompareEntries,
  readCompareCount,
  removeCompareEntry,
  updateExternalCompareEntry,
  COMPARE_MAX,
} from "../lib/compareListings";
import { getCompareConfig } from "../lib/compareConfig";
import {
  resolveCompareEntries,
  getCompareItemKey,
  isExternalCompareItem,
} from "../lib/compareResolve";
import { buildComparePriceInsights } from "../lib/comparePriceInsights";
import { formatPrice } from "../lib/format";
import { usePageMeta } from "../lib/usePageMeta";
import { getPlatformLabel } from "../lib/comparePlatforms";

function formatFetchedAt(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CompareRow({ label, values, highlights = [] }) {
  return (
    <tr className="border-t">
      <td className="p-3 text-sm font-medium text-slate-500 bg-slate-50">{label}</td>
      {values.map((value, index) => {
        const hint = highlights[index];
        return (
          <td
            key={index}
            className={`p-3 text-sm text-slate-900 align-top ${
              hint?.cheapest ? "bg-emerald-50 font-semibold text-emerald-900" : ""
            }`}
          >
            <div>{value || "—"}</div>
            {hint?.diffLabel && (
              <div
                className={`text-[11px] mt-1 ${
                  hint.cheapest ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {hint.diffLabel}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function CompareItemTitle({ item, onRemove, onRefresh, refreshing }) {
  const itemKey = getCompareItemKey(item);
  const external = isExternalCompareItem(item);
  const canRefresh = external && item._compareUrl;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <CompareSourceBadge item={item} />
          {external && item._compareUrl ? (
            <a
              href={item._compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold hover:text-sun transition line-clamp-2"
            >
              {item.title}
            </a>
          ) : external ? (
            <div className="font-semibold line-clamp-2">{item.title}</div>
          ) : (
            <Link to={`/ad/${itemKey}`} className="block font-semibold hover:text-sun transition line-clamp-2">
              {item.title}
            </Link>
          )}
          {external && item._compareFetchedAt && (
            <div className="text-[11px] text-slate-400">
              Данные от {formatFetchedAt(item._compareFetchedAt)}
            </div>
          )}
          {canRefresh && (
            <button
              type="button"
              onClick={() => onRefresh?.(item)}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sun hover:text-sun-600 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Обновить данные
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="shrink-0 rounded-lg border p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Убрать из сравнения"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function ComparePreviewCard({ item, onRemove, onRefresh, refreshing, priceHint }) {
  const itemKey = getCompareItemKey(item);
  const external = isExternalCompareItem(item);

  return (
    <article
      className={`rounded-2xl border bg-white p-3 space-y-2 ${
        priceHint?.cheapest ? "border-emerald-200 ring-1 ring-emerald-100" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <CompareSourceBadge item={item} />
        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="rounded-lg border p-1 text-slate-400 hover:bg-slate-50"
          aria-label="Убрать из сравнения"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-price text-base">{formatPrice(item.price)}</div>
        {priceHint?.diffLabel && (
          <div
            className={`text-[11px] font-semibold ${
              priceHint.cheapest ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {priceHint.diffLabel}
          </div>
        )}
      </div>

      <div className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</div>

      {external && item._compareUrl && (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={item._compareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sun hover:text-sun-600"
          >
            Открыть на {getPlatformLabel(item._compareSource)}
            <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={() => onRefresh?.(item)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Обновить
          </button>
        </div>
      )}

      {!external && (
        <Link
          to={`/ad/${itemKey}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sun hover:text-sun-600"
        >
          Открыть объявление
        </Link>
      )}
    </article>
  );
}

function CompareMobileCard({ item, fields, onRemove, onRefresh, refreshing, priceHint }) {
  const itemKey = getCompareItemKey(item);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 space-y-3 ${
        priceHint?.cheapest ? "border-emerald-200 ring-1 ring-emerald-100" : ""
      }`}
    >
      <CompareItemTitle
        item={item}
        onRemove={onRemove}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <div className="space-y-1">
        <div className="text-price text-lg">{formatPrice(item.price)}</div>
        {priceHint?.diffLabel && (
          <div
            className={`text-[11px] font-semibold ${
              priceHint.cheapest ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {priceHint.diffLabel}
          </div>
        )}
      </div>

      <dl className="space-y-2">
        {fields.slice(1).map((field) => (
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

export default function ListingCompare({ cat }) {
  const config = getCompareConfig(cat);

  const [entries, setEntries] = React.useState(() => readCompareEntries(cat));
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshingKey, setRefreshingKey] = React.useState("");
  const [actionError, setActionError] = React.useState("");

  usePageMeta({
    title: config
      ? `Сравнение объявлений — ${config.label} | Oriyon.store`
      : "Сравнение объявлений | Oriyon.store",
    description: config
      ? `Сравните до 3 объявлений в категории «${config.label}» по ключевым характеристикам.`
      : "Сравнение объявлений на Oriyon.store",
  });

  const syncEntries = React.useCallback(() => {
    setEntries(readCompareEntries(cat));
  }, [cat]);

  React.useEffect(() => {
    syncEntries();
    window.addEventListener("oriyon:compare-change", syncEntries);
    return () => window.removeEventListener("oriyon:compare-change", syncEntries);
  }, [syncEntries]);

  React.useEffect(() => {
    let active = true;

    async function load() {
      if (!entries.length) {
        if (active) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const rows = await resolveCompareEntries(entries, cat);
        if (active) setItems(rows);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [entries, cat]);

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState
          icon={Scale}
          title="Сравнение недоступно"
          description="Для этой категории сравнение пока не поддерживается."
          actionLabel="На главную"
          actionTo="/"
        />
      </div>
    );
  }

  const fields = config.fields;
  const count = readCompareCount(cat);
  const priceInsights = buildComparePriceInsights(items);

  const breadcrumbs = cat === "realestate"
    ? [
        { label: "Главная", to: "/" },
        { label: config.label, to: "/realestate" },
        { label: "Сравнение" },
      ]
    : [
        { label: "Главная", to: "/" },
        { label: config.label, to: config.catalogPath },
        { label: "Сравнение" },
      ];

  const handleRemove = (itemKey) => {
    setActionError("");
    removeCompareEntry(itemKey, cat);
  };

  const handleRefresh = async (item) => {
    const itemKey = getCompareItemKey(item);
    if (!item._compareUrl) return;

    setRefreshingKey(itemKey);
    setActionError("");

    try {
      const result = await api.compareImport({
        url: item._compareUrl,
        cat,
      });

      const snapshot = result?.snapshot || {};
      updateExternalCompareEntry(itemKey, cat, {
        platform: result?.platform || item._compareSource,
        url: result?.url || item._compareUrl,
        title: snapshot.title,
        price: snapshot.price,
        location: snapshot.location,
        image: snapshot.image,
        specs: snapshot.specs,
      });
      syncEntries();
    } catch (err) {
      setActionError(err?.message || "Не удалось обновить данные объявления");
    } finally {
      setRefreshingKey("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale size={22} className="text-sun" />
            Сравнение объявлений
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {config.label} · до {COMPARE_MAX} объектов · Oriyon и другие площадки
          </p>
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={() => clearCompare(cat)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50"
          >
            <Trash2 size={16} />
            Очистить
          </button>
        )}
      </div>

      <CompareExternalForm cat={cat} onAdded={syncEntries} />

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {actionError}
        </p>
      )}

      {loading && count > 0 && (
        <div className="text-sm text-slate-500">Загрузка...</div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={Scale}
          title="Список сравнения пуст"
          description="Добавьте объявления Oriyon через «Сравнить» в каталоге или вручную с другой площадки."
          actionLabel="Перейти в каталог"
          actionTo={config.catalogPath}
        />
      )}

      {!loading && items.length > 0 && (
        <>
          <ComparePriceInsights insights={priceInsights} />

          <div className="grid md:grid-cols-3 gap-3">
            {items.map((item, index) => (
              <ComparePreviewCard
                key={getCompareItemKey(item)}
                item={item}
                onRemove={handleRemove}
                onRefresh={handleRefresh}
                refreshing={refreshingKey === getCompareItemKey(item)}
                priceHint={priceInsights?.priceHighlights?.[index]}
              />
            ))}
          </div>

          <div className="md:hidden space-y-3">
            {items.map((item, index) => (
              <CompareMobileCard
                key={getCompareItemKey(item)}
                item={item}
                fields={fields}
                onRemove={handleRemove}
                onRefresh={handleRefresh}
                refreshing={refreshingKey === getCompareItemKey(item)}
                priceHint={priceInsights?.priceHighlights?.[index]}
              />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border bg-white">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 text-left text-sm font-semibold text-slate-600">
                    Параметр
                  </th>
                  {items.map((item) => (
                    <th
                      key={getCompareItemKey(item)}
                      className="p-3 text-left text-sm font-semibold align-top min-w-[180px]"
                    >
                      <CompareItemTitle
                        item={item}
                        onRemove={handleRemove}
                        onRefresh={handleRefresh}
                        refreshing={refreshingKey === getCompareItemKey(item)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <CompareRow
                    key={field.key}
                    label={field.label}
                    values={items.map((item) => field.get(item))}
                    highlights={
                      field.key === "price" ? priceInsights?.priceHighlights : []
                    }
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
