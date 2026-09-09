import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Search,
} from "lucide-react";
import { api } from "../../lib/api";
import { WALLET_TYPE_LABELS } from "../../lib/adminUtils";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  SimplePagination,
  Skeleton,
  Tabs,
} from "../../ui";
import { useI18n } from "../../i18n";
import AdminFinanceUsersSection from "./AdminFinanceUsersSection";
import {
  FinanceReportsTab,
  FinanceAuditTab,
  FinancePaymentsTab,
  FinanceAlifOrdersTab,
  FinancePromotionsTab,
} from "./AdminFinanceExtended";
import {
  DataTable,
  FilterBar,
  ResultsBar,
  SectionHeader,
  TableRow,
  TableSkeleton,
  Td,
  Th,
} from "./AdminUI";

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

function money(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} TJS`;
}

function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="hero-dark p-5 sm:p-6">
        <p className="text-sm text-white/70">Суммарный баланс на платформе</p>
        <p className="mt-2 font-display text-3xl font-bold">
          {money(summary.totalBalance)}
        </p>
        <p className="mt-2 text-sm text-white/70">
          Пользователей с балансом: {summary.usersWithBalance || 0} из{" "}
          {summary.usersTotal || 0}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <section className="surface-panel p-4">
          <h3 className="text-sm font-semibold text-ink-700">Сегодня</h3>

          <p className="mt-2 flex items-center gap-2 font-semibold text-success-700">
            <ArrowDownLeft size={16} aria-hidden="true" />+
            {money(summary.today?.credits)}
          </p>

          <p className="mt-1 flex items-center gap-2 font-semibold text-danger-700">
            <ArrowUpRight size={16} aria-hidden="true" />
            {money(summary.today?.debits)}
          </p>

          <p className="mt-2 text-xs text-ink-400">
            {summary.today?.creditCount || 0} начислений ·{" "}
            {summary.today?.debitCount || 0} списаний
          </p>
        </section>

        <section className="surface-panel p-4">
          <h3 className="text-sm font-semibold text-ink-700">7 дней</h3>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">
            {summary.week?.transactions || 0}
          </p>
          <p className="mt-1 text-xs text-ink-400">операций</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-success-700">
              +{Number(summary.week?.credits || 0).toLocaleString("ru-RU")}
            </span>
            {" · "}
            <span className="font-semibold text-danger-700">
              {Number(summary.week?.debits || 0).toLocaleString("ru-RU")}
            </span>
          </p>
        </section>

        <section className="surface-panel p-4">
          <h3 className="text-sm font-semibold text-ink-700">30 дней</h3>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">
            {summary.month?.transactions || 0}
          </p>
          <p className="mt-1 text-xs text-ink-400">операций</p>
          <p className="mt-2 text-sm text-ink-500">
            Корректировок: {summary.month?.manualAdjustments || 0} (
            {money(summary.month?.manualAdjustmentsSum)})
          </p>
        </section>
      </div>

      {Array.isArray(summary.topBalances) && summary.topBalances.length > 0 && (
        <section className="surface-panel p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-700">
            <TrendingUp size={16} className="text-sun-600" aria-hidden="true" />
            Топ балансов
          </h3>

          <ul className="space-y-2">
            {summary.topBalances.map((item) => (
              <li
                key={item.id}
                className="surface-muted flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink-800 break-anywhere">
                    {item.name || item.email}
                  </p>
                  <p className="text-xs text-ink-400 break-anywhere">
                    {item.email}
                  </p>
                </div>

                <p className="shrink-0 font-bold text-sun-700">
                  {money(item.walletBalance)}
                </p>
              </li>
            ))}
          </ul>
        </section>
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

  const filtersActive = Boolean(query || from || to) || typeFilter !== "all";

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setFrom("");
    setTo("");
  };

  return (
    <Card className="space-y-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <FilterBar
        gridClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-5"
        onReset={resetFilters}
        resetDisabled={!filtersActive}
      >
        <Field
          label={t("admin.searchLabel")}
          labelClassName="sr-only"
          className="xl:col-span-2"
        >
          {(props) => (
            <Input
              {...props}
              type="search"
              iconLeft={Search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: email, имя, комментарий"
            />
          )}
        </Field>

        <Field label={t("admin.typeLabel")} labelClassName="sr-only">
          {(props) => (
            <Select
              {...props}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={TX_TYPES}
            />
          )}
        </Field>

        <Field label="С даты" labelClassName="text-xs">
          {(props) => (
            <Input
              {...props}
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          )}
        </Field>

        <Field label="По дату" labelClassName="text-xs">
          {(props) => (
            <Input
              {...props}
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          )}
        </Field>
      </FilterBar>

      <ResultsBar
        pager={
          <SimplePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={refreshing}
          />
        }
      >
        Показано: {items.length} из {total}
        {query !== debouncedQuery ? " · ищем…" : ""}
      </ResultsBar>

      {loading ? (
        <TableSkeleton
          label={t("admin.tableTransactions")}
          rows={8}
          columns={5}
        />
      ) : items.length === 0 ? (
        <EmptyState
          bare
          icon={Wallet}
          title="Операции не найдены"
          description={t("admin.emptyFiltersHint")}
          secondaryAction={
            filtersActive ? (
              <Button onClick={resetFilters}>{t("admin.reset")}</Button>
            ) : null
          }
        />
      ) : (
        <DataTable
          label={t("admin.tableTransactions")}
          minWidth="52rem"
          scrollHeight="70vh"
        >
          <thead>
            <tr>
              <Th>Дата</Th>
              <Th>Пользователь</Th>
              <Th>Тип</Th>
              <Th align="right">Сумма</Th>
              <Th>Комментарий</Th>
            </tr>
          </thead>

          <tbody>
            {items.map((tx) => (
              <TableRow key={tx.id}>
                <Td className="whitespace-nowrap text-ink-400">
                  {tx.createdAt
                    ? new Date(tx.createdAt).toLocaleString("ru-RU")
                    : "—"}
                </Td>

                <Td>
                  <div className="font-medium text-ink-800">
                    {tx.userName || "—"}
                  </div>
                  <div className="text-xs text-ink-400 break-anywhere">
                    {tx.userEmail || "—"}
                  </div>
                </Td>

                <Td className="text-ink-700">
                  {WALLET_TYPE_LABELS[tx.type] || tx.type}
                </Td>

                <Td
                  className={`whitespace-nowrap text-right font-bold ${
                    Number(tx.amount) >= 0
                      ? "text-success-700"
                      : "text-danger-700"
                  }`}
                >
                  {Number(tx.amount) >= 0 ? "+" : ""}
                  {money(tx.amount)}
                </Td>

                <Td className="max-w-xs text-ink-500 break-anywhere">
                  {tx.description || "—"}
                </Td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </Card>
  );
}

const TABS = [
  { id: "overview", label: "Сводка" },
  { id: "reports", label: "Отчёты" },
  { id: "transactions", label: "Операции" },
  { id: "wallets", label: "Кошельки" },
  { id: "audit", label: "Журнал" },
  { id: "payments", label: "Платежи" },
  { id: "alif", label: "Alif" },
  { id: "promotions", label: "VIP/TOP" },
];

const FINANCE_PANEL_ID = "admin-finance-panel";

export default function AdminFinancePanel({ token, currentUser, isSuperAdmin }) {
  const navigate = useNavigate();
  const { t } = useI18n();
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

  const activeTab = TABS.find((item) => item.id === tab);

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          eyebrow="Финансы"
          icon={Wallet}
          title="Кошельки системы"
          description={
            isSuperAdmin ? (
              <>
                Сводка, операции и балансы пользователей. Корректировка баланса —
                в разделе{" "}
                <button
                  type="button"
                  onClick={() => navigate("/admin?section=users")}
                  className="font-medium text-sun-700 underline hover:text-sun-800"
                >
                  Пользователи
                </button>
                .
              </>
            ) : (
              "Сводка, операции и балансы пользователей. Корректировки баланса выполняет супер-админ."
            )
          }
        />
      </Card>

      <Tabs
        items={TABS.map((item) => ({
          value: item.id,
          label: item.label,
          panelId: FINANCE_PANEL_ID,
        }))}
        value={tab}
        onChange={setTab}
        label={t("admin.financeNav")}
      />

      <div
        id={FINANCE_PANEL_ID}
        role="tabpanel"
        aria-label={activeTab?.label}
        tabIndex={-1}
        className="outline-none"
      >
        {tab === "overview" && (
          <>
            {loading && (
              <Card className="space-y-3">
                <p className="sr-only" role="status">
                  {t("common.loading")}
                </p>
                <Skeleton className="h-28" rounded="rounded-3xl" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-28" rounded="rounded-2xl" />
                  ))}
                </div>
              </Card>
            )}

            {error && (
              <Card>
                <Alert tone="danger">{error}</Alert>
              </Card>
            )}

            {!loading && !error && <SummaryCards summary={summary} />}
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
    </div>
  );
}
