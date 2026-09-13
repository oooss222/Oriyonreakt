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
import { getWalletTypeLabels } from "../../lib/adminUtils";
import { useI18n } from "../../i18n";
import AdminFinanceUsersSection from "./AdminFinanceUsersSection";
import {
  FinanceReportsTab,
  FinanceAuditTab,
  FinancePaymentsTab,
  FinanceAlifOrdersTab,
  FinancePromotionsTab,
} from "./AdminFinanceExtended";

const PAGE_SIZE = 25;

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function SummaryCards({ summary, t }) {
  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-br from-ink-700 to-ink-900 p-6 text-white">
        <div className="text-sm text-white/70">{t("admin.finance.summary.totalBalance")}</div>
        <div className="text-3xl font-bold mt-2">
          {Number(summary.totalBalance || 0).toLocaleString("ru-RU")} TJS
        </div>
        <div className="text-sm text-white/70 mt-2">
          {t("admin.finance.summary.usersWithBalance", {
            withBalance: summary.usersWithBalance || 0,
            total: summary.usersTotal || 0,
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-ink-500">{t("admin.finance.summary.today")}</div>
          <div className="mt-2 flex items-center gap-2 text-emerald-700 font-semibold">
            <ArrowDownLeft size={16} />
            +{Number(summary.today?.credits || 0).toLocaleString("ru-RU")} TJS
          </div>
          <div className="mt-1 flex items-center gap-2 text-red-700 font-semibold">
            <ArrowUpRight size={16} />
            {Number(summary.today?.debits || 0).toLocaleString("ru-RU")} TJS
          </div>
          <div className="text-xs text-ink-400 mt-2">
            {t("admin.finance.summary.creditsDebitsCount", {
              creditCount: summary.today?.creditCount || 0,
              debitCount: summary.today?.debitCount || 0,
            })}
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-ink-500">{t("admin.finance.summary.days7")}</div>
          <div className="text-2xl font-bold mt-2">{summary.week?.transactions || 0}</div>
          <div className="text-xs text-ink-400 mt-1">{t("admin.finance.summary.operations")}</div>
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
          <div className="text-sm text-ink-500">{t("admin.finance.summary.days30")}</div>
          <div className="text-2xl font-bold mt-2">{summary.month?.transactions || 0}</div>
          <div className="text-xs text-ink-400 mt-1">{t("admin.finance.summary.operations")}</div>
          <div className="text-sm mt-2 text-ink-600">
            {t("admin.finance.summary.adjustments", {
              count: summary.month?.manualAdjustments || 0,
              sum: Number(summary.month?.manualAdjustmentsSum || 0).toLocaleString("ru-RU"),
            })}
          </div>
        </div>
      </div>

      {Array.isArray(summary.topBalances) && summary.topBalances.length > 0 && (
        <div className="rounded-2xl border p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-sun-700" />
            <h4 className="font-semibold">{t("admin.finance.summary.topBalances")}</h4>
          </div>
          <div className="space-y-2">
            {summary.topBalances.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-mist-50 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{item.name || item.email}</div>
                  <div className="text-xs text-ink-500">{item.email}</div>
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
  const { t } = useI18n();
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

  const TX_TYPES = [
    { value: "all", label: t("admin.finance.tx.typeAll") },
    { value: "top_up", label: t("admin.finance.tx.typeTopUp") },
    { value: "payment", label: t("admin.finance.tx.typePayment") },
    { value: "refund", label: t("admin.finance.tx.typeRefund") },
    { value: "manual_adjustment", label: t("admin.finance.tx.typeAdjustment") },
  ];

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
      setError(e.message || t("admin.finance.tx.loadError"));
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
    return <div className="admin-panel p-6 animate-pulse h-48" />;
  }

  return (
    <div className="admin-panel p-4 space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="rounded-2xl border bg-mist-50 p-3 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.finance.tx.searchPlaceholder")}
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-ink-500">
        <div>
          {t("admin.pagination.shownOf", { shown: items.length, total })}
          {query !== debouncedQuery ? t("admin.pagination.searchingSuffix") : ""}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || refreshing}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            {t("admin.pagination.back")}
          </button>
          <span>
            {t("admin.pagination.pageOf", { page, totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || refreshing}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
          >
            {t("admin.pagination.next")}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-mist-50 p-8 text-center text-ink-500">
          {t("admin.finance.tx.empty")}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr className="border-b text-left text-ink-500">
                <th className="py-3 px-3">{t("admin.finance.col.date")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.user")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.type")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.amount")}</th>
                <th className="py-3 px-3">{t("admin.finance.col.comment")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} className="border-b last:border-b-0 hover:bg-mist-50">
                  <td className="py-3 px-3 text-ink-500 whitespace-nowrap">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium">{tx.userName || "—"}</div>
                    <div className="text-xs text-ink-500">{tx.userEmail || "—"}</div>
                  </td>
                  <td className="py-3 px-3">
                    {getWalletTypeLabels()[tx.type] || tx.type}
                  </td>
                  <td
                    className={`py-3 px-3 font-bold whitespace-nowrap ${
                      Number(tx.amount) >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {Number(tx.amount) >= 0 ? "+" : ""}
                    {Number(tx.amount).toLocaleString("ru-RU")} TJS
                  </td>
                  <td className="py-3 px-3 text-ink-500 max-w-xs truncate">
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

export default function AdminFinancePanel({ token, currentUser, isSuperAdmin }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("overview");
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const TABS = [
    { id: "overview", label: t("admin.finance.tabs.overview") },
    { id: "reports", label: t("admin.finance.tabs.reports") },
    { id: "transactions", label: t("admin.finance.tabs.transactions") },
    { id: "wallets", label: t("admin.finance.tabs.wallets") },
    { id: "audit", label: t("admin.finance.tabs.audit") },
    { id: "payments", label: t("admin.finance.tabs.payments") },
    { id: "alif", label: "Alif" },
    { id: "promotions", label: "VIP/TOP" },
  ];

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
        if (alive) setError(e.message || t("admin.finance.loadSummaryError"));
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
      <div className="admin-panel p-4 md:p-5">
        <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
          <Wallet className="w-4 h-4" />
          {t("admin.finance.badge")}
        </div>
        <h2 className="text-xl font-bold">{t("admin.finance.title")}</h2>
        <p className="text-sm text-ink-500 mt-1">
          {isSuperAdmin ? (
            <>
              {t("admin.finance.subtitleSuperPrefix")}{" "}
              <button
                type="button"
                onClick={() => navigate("/admin?section=users")}
                className="text-sun-700 underline hover:text-sun-800"
              >
                {t("admin.finance.usersLink")}
              </button>
              .
            </>
          ) : (
            t("admin.finance.subtitleNonSuper")
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
                ? "bg-ink-900 text-white border-ink-900"
                : "bg-white text-ink-700 hover:bg-mist-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {loading && (
            <div className="admin-panel p-6 animate-pulse h-40" />
          )}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
              {error}
            </div>
          )}
          {!loading && !error && <SummaryCards summary={summary} t={t} />}
        </>
      )}

      {tab === "reports" && <FinanceReportsTab token={token} />}

      {tab === "transactions" && <TransactionsTable token={token} />}

      {tab === "wallets" && (
        <AdminFinanceUsersSection token={token} currentUser={currentUser} />
      )}

      {tab === "audit" && <FinanceAuditTab token={token} />}

      {tab === "payments" && <FinancePaymentsTab token={token} />}

      {tab === "alif" && <FinanceAlifOrdersTab token={token} />}

      {tab === "promotions" && <FinancePromotionsTab token={token} />}
    </div>
  );
}
