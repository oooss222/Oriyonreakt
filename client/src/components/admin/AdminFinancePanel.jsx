import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { api } from "../../lib/api";
import { WALLET_TYPE_LABELS } from "../../lib/adminUtils";
import AdminFinanceUsersSection from "./AdminFinanceUsersSection";

const PAGE_SIZE = 25;

const TX_TYPES = [
  { value: "all", label: "Все типы" },
  { value: "top_up", label: "Пополнение" },
  { value: "payment", label: "Списание" },
  { value: "refund", label: "Возврат" },
  { value: "manual_adjustment", label: "Корректировка" },
];

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-br from-ink-700 to-ink-900 p-6 text-white">
        <div className="text-sm text-white/70">Суммарный баланс на платформе</div>
        <div className="text-3xl font-bold mt-2">
          {Number(summary.totalBalance || 0).toLocaleString("ru-RU")} TJS
        </div>
        <div className="text-sm text-white/70 mt-2">
          Пользователей с балансом: {summary.usersWithBalance || 0} из{" "}
          {summary.usersTotal || 0}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-slate-500">Сегодня</div>
          <div className="mt-2 flex items-center gap-2 text-emerald-700 font-semibold">
            <ArrowDownLeft size={16} />
            +{Number(summary.today?.credits || 0).toLocaleString("ru-RU")} TJS
          </div>
          <div className="mt-1 flex items-center gap-2 text-red-700 font-semibold">
            <ArrowUpRight size={16} />
            {Number(summary.today?.debits || 0).toLocaleString("ru-RU")} TJS
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {summary.today?.creditCount || 0} начислений ·{" "}
            {summary.today?.debitCount || 0} списаний
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-slate-500">7 дней</div>
          <div className="text-2xl font-bold mt-2">{summary.week?.transactions || 0}</div>
          <div className="text-xs text-slate-400 mt-1">операций</div>
          <div className="text-sm mt-2">
            <span className="text-emerald-700">
              +{Number(summary.week?.credits || 0).toLocaleString("ru-RU")}
            </span>
            {" · "}
            <span className="text-red-700">
              {Number(summary.week?.debits || 0).toLocaleString("ru-RU")}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-slate-500">30 дней</div>
          <div className="text-2xl font-bold mt-2">{summary.month?.transactions || 0}</div>
          <div className="text-xs text-slate-400 mt-1">операций</div>
          <div className="text-sm mt-2 text-slate-600">
            Корректировок: {summary.month?.manualAdjustments || 0} (
            {Number(summary.month?.manualAdjustmentsSum || 0).toLocaleString("ru-RU")} TJS)
          </div>
        </div>
      </div>

      {Array.isArray(summary.topBalances) && summary.topBalances.length > 0 && (
        <div className="rounded-2xl border p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-sun-700" />
            <h4 className="font-semibold">Топ балансов</h4>
          </div>
          <div className="space-y-2">
            {summary.topBalances.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{item.name || item.email}</div>
                  <div className="text-xs text-slate-500">{item.email}</div>
                </div>
                <div className="font-bold text-sun-700">
                  {Number(item.walletBalance || 0).toLocaleString("ru-RU")} TJS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionsTable({ token }) {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [typeFilter, setTypeFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);

  const debouncedQuery = useDebouncedValue(query);

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminFinanceTransactions(token, {
        type: typeFilter,
        q: debouncedQuery,
        from,
        to,
        page,
        limit: PAGE_SIZE,
      });

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
      setTotalPages(Math.max(1, Number(data.totalPages || 1)));
    } catch (e) {
      setError(e.message || "Не удалось загрузить операции");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, typeFilter, debouncedQuery, from, to, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [typeFilter, debouncedQuery, from, to]);

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 animate-pulse h-48" />;
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: email, имя, комментарий"
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        >
          {TX_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        />

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500">
        <div>
          Показано: {items.length} из {total}
          {query !== debouncedQuery ? " · ищем..." : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || refreshing}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Назад
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || refreshing}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            Вперёд
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-500">
          Операции не найдены.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm border-collapse bg-white">
            <thead className="bg-slate-50">
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 px-3">Дата</th>
                <th className="py-3 px-3">Пользователь</th>
                <th className="py-3 px-3">Тип</th>
                <th className="py-3 px-3">Сумма</th>
                <th className="py-3 px-3">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium">{tx.userName || "—"}</div>
                    <div className="text-xs text-slate-500">{tx.userEmail || "—"}</div>
                  </td>
                  <td className="py-3 px-3">
                    {WALLET_TYPE_LABELS[tx.type] || tx.type}
                  </td>
                  <td
                    className={`py-3 px-3 font-bold whitespace-nowrap ${
                      Number(tx.amount) >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {Number(tx.amount) >= 0 ? "+" : ""}
                    {Number(tx.amount).toLocaleString("ru-RU")} TJS
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                    {tx.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Сводка" },
  { id: "transactions", label: "Операции" },
  { id: "wallets", label: "Кошельки" },
];

export default function AdminFinancePanel({ token, currentUser, isSuperAdmin }) {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("overview");
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api
      .adminFinanceSummary(token)
      .then((data) => {
        if (alive) setSummary(data);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Не удалось загрузить сводку");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
          <Wallet className="w-4 h-4" />
          Финансы
        </div>
        <h2 className="text-xl font-bold">Кошельки системы</h2>
        <p className="text-sm text-slate-500 mt-1">
          {isSuperAdmin ? (
            <>
              Сводка, операции и балансы пользователей. Корректировка баланса — в разделе{" "}
              <button
                type="button"
                onClick={() => navigate("/admin?section=users")}
                className="text-sun-700 underline hover:text-sun-800"
              >
                Пользователи
              </button>
              .
            </>
          ) : (
            "Сводка, операции и балансы пользователей. Корректировки баланса выполняет супер-админ."
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              tab === item.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {loading && (
            <div className="rounded-2xl border bg-white p-6 animate-pulse h-40" />
          )}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
              {error}
            </div>
          )}
          {!loading && !error && <SummaryCards summary={summary} />}
        </>
      )}

      {tab === "transactions" && <TransactionsTable token={token} />}

      {tab === "wallets" && (
        <AdminFinanceUsersSection token={token} currentUser={currentUser} />
      )}
    </div>
  );
}
