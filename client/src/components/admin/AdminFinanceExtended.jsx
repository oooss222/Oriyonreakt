import React from "react";
import {
  FileBarChart,
  ScrollText,
  CreditCard,
  Crown,
  RefreshCw,
} from "lucide-react";
import { api } from "../../lib/api";
import { AUDIT_ACTION_LABELS, WALLET_TYPE_LABELS } from "../../lib/adminUtils";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SimplePagination,
  Skeleton,
  useToast,
} from "../../ui";
import { useI18n } from "../../i18n";
import {
  DataTable,
  ResultsBar,
  SectionHeader,
  StatTile,
  TableRow,
  TableSkeleton,
  Td,
  Th,
} from "./AdminUI";

function money(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} TJS`;
}

function formatAuditDetails(item) {
  const details = item.details || {};
  const parts = [];

  if (details.email) parts.push(details.email);
  if (details.amount !== undefined) {
    parts.push(`${Number(details.amount).toLocaleString("ru-RU")} TJS`);
  }
  if (details.description) parts.push(details.description);

  return parts.join(" · ") || "—";
}

function PeriodFilters({ from, to, onFrom, onTo, onApply, loading }) {
  const { t } = useI18n();

  return (
    <section
      aria-label={t("admin.periodLabel")}
      className="surface-muted grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="С даты">
        {(props) => (
          <Input
            {...props}
            type="date"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
          />
        )}
      </Field>

      <Field label="По дату">
        {(props) => (
          <Input
            {...props}
            type="date"
            value={to}
            onChange={(e) => onTo(e.target.value)}
          />
        )}
      </Field>

      <div className="flex items-end gap-2 lg:col-span-2">
        <Button variant="accent" loading={loading} onClick={onApply}>
          Построить отчёт
        </Button>

        {(from || to) && (
          <Button
            variant="ghost"
            onClick={() => {
              onFrom("");
              onTo("");
            }}
          >
            {t("admin.reset")}
          </Button>
        )}
      </div>
    </section>
  );
}

export function FinanceReportsTab({ token }) {
  const { t } = useI18n();
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [report, setReport] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.adminFinanceReports(token, { from, to });
      setReport(data);
    } catch (e) {
      setError(e.message || "Не удалось построить отчёт");
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="space-y-4">
      <SectionHeader
        eyebrow="Отчёты"
        icon={FileBarChart}
        title="Оборот за период"
        description="Пополнения, списания и корректировки за выбранные даты."
      />

      <PeriodFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Операций" value={report.totalTransactions} />
            <StatTile
              label="Пополнения"
              value={`+${money(report.credits)}`}
              tone="success"
            />
            <StatTile
              label="Списания"
              value={money(report.debits)}
              tone="danger"
            />
            <StatTile
              label="Корректировки"
              value={report.manualAdjustments}
              hint={money(report.manualAdjustmentsSum)}
              tone="warning"
            />
          </div>

          {Array.isArray(report.byType) && report.byType.length > 0 && (
            <DataTable label={t("admin.tableReportTypes")} minWidth="32rem">
              <thead>
                <tr>
                  <Th>Тип</Th>
                  <Th align="right">Кол-во</Th>
                  <Th align="right">Сумма</Th>
                </tr>
              </thead>

              <tbody>
                {report.byType.map((row) => (
                  <TableRow key={row.type}>
                    <Td className="text-ink-700">
                      {WALLET_TYPE_LABELS[row.type] || row.type}
                    </Td>
                    <Td className="text-right text-ink-700">{row.count}</Td>
                    <Td className="whitespace-nowrap text-right font-semibold text-ink-900">
                      {money(row.sum)}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </>
      )}
    </Card>
  );
}

export function FinanceAuditTab({ token }) {
  const { t } = useI18n();
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);

  const PAGE_SIZE = 50;

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.adminFinanceAudit(token, {
        from,
        to,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Не удалось загрузить журнал");
    } finally {
      setLoading(false);
    }
  }, [token, from, to, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [from, to]);

  return (
    <Card className="space-y-4">
      <SectionHeader
        eyebrow="Финансовый журнал"
        icon={ScrollText}
        title="Корректировки баланса"
        description="Ручные корректировки супер-админом. Полная история операций — во вкладке «Операции»."
      />

      <PeriodFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <ResultsBar
        pager={
          <SimplePagination
            page={page}
            totalPages={items.length < PAGE_SIZE ? page : page + 1}
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        Показано: {items.length}
      </ResultsBar>

      {loading ? (
        <TableSkeleton label={t("admin.tableFinanceAudit")} rows={6} columns={4} />
      ) : items.length === 0 ? (
        <EmptyState
          bare
          icon={ScrollText}
          title="Записей не найдено"
          description={t("admin.auditEmptyDescription")}
        />
      ) : (
        <DataTable
          label={t("admin.tableFinanceAudit")}
          minWidth="48rem"
          scrollHeight="70vh"
        >
          <thead>
            <tr>
              <Th>Когда</Th>
              <Th>Кто</Th>
              <Th>Действие</Th>
              <Th>Детали</Th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <Td className="whitespace-nowrap text-ink-400">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("ru-RU")
                    : "—"}
                </Td>

                <Td>
                  <div className="font-medium text-ink-800">
                    {item.actorName || "—"}
                  </div>
                  <div className="text-xs text-ink-400 break-anywhere">
                    {item.actorEmail}
                  </div>
                </Td>

                <Td className="text-ink-700">
                  {AUDIT_ACTION_LABELS[item.action] || item.action}
                </Td>

                <Td className="text-ink-500 break-anywhere">
                  {formatAuditDetails(item)}
                </Td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </Card>
  );
}

export function FinanceAlifOrdersTab({ token }) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [syncingId, setSyncingId] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    setError("");

    api
      .adminFinanceAlifOrders(token)
      .then((result) => setData(result))
      .catch((e) => setError(e.message || "Не удалось загрузить заказы Alif"))
      .finally(() => setLoading(false));
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const syncOrder = async (orderId) => {
    try {
      setSyncingId(orderId);
      await api.adminSyncAlifOrder(token, orderId);
      load();
      showToast(t("admin.toastAlifSynced"), "success");
    } catch (e) {
      setError(e.message || "Не удалось синхронизировать заказ");
    } finally {
      setSyncingId("");
    }
  };

  return (
    <Card className="space-y-4">
      <SectionHeader
        eyebrow="Alif orders"
        icon={CreditCard}
        title="Сверка платежей"
        description="Заказы Alif Acquiring и статусы пополнения кошелька."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <TableSkeleton label={t("admin.tableAlif")} rows={6} columns={5} />
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(data.byStatus || []).map((row) => (
                <StatTile
                  key={row.status}
                  label={<span className="capitalize">{row.status}</span>}
                  value={row.count}
                  hint={money(row.sum)}
                />
              ))}
            </div>

            {(data.items || []).length === 0 ? (
              <EmptyState
                bare
                icon={CreditCard}
                title="Заказов пока нет"
                description={t("admin.alifEmptyDescription")}
              />
            ) : (
              <DataTable
                label={t("admin.tableAlif")}
                minWidth="60rem"
                scrollHeight="70vh"
              >
                <thead>
                  <tr>
                    <Th>Order ID</Th>
                    <Th>Пользователь</Th>
                    <Th align="right">Сумма</Th>
                    <Th>Статус</Th>
                    <Th>Provider</Th>
                    <Th>Дата</Th>
                    <Th align="right">Действия</Th>
                  </tr>
                </thead>

                <tbody>
                  {(data.items || []).map((order) => (
                    <TableRow key={order.id}>
                      <Td className="font-mono text-xs text-ink-600">
                        {order.orderId}
                      </Td>

                      <Td>
                        <div className="font-medium text-ink-800">
                          {order.userName || "—"}
                        </div>
                        <div className="text-xs text-ink-400 break-anywhere">
                          {order.userEmail}
                        </div>
                      </Td>

                      <Td className="whitespace-nowrap text-right font-semibold text-ink-900">
                        {money(order.amount)}
                      </Td>

                      <Td className="capitalize text-ink-700">{order.status}</Td>

                      <Td className="text-ink-500">
                        {order.providerStatus || "—"}
                      </Td>

                      <Td className="whitespace-nowrap text-ink-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("ru-RU")
                          : "—"}
                      </Td>

                      <Td className="text-right">
                        {order.status !== "paid" && (
                          <Button
                            size="sm"
                            icon={RefreshCw}
                            loading={syncingId === order.orderId}
                            onClick={() => syncOrder(order.orderId)}
                          >
                            {t("admin.syncOrder")}
                          </Button>
                        )}
                      </Td>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )
      )}
    </Card>
  );
}

export function FinancePaymentsTab({ token }) {
  const { t } = useI18n();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    api
      .adminFinancePayments(token)
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Не удалось загрузить статусы");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <Card className="space-y-4">
      <SectionHeader
        eyebrow="Платежи"
        icon={CreditCard}
        title="Статусы транзакций"
        description="Pending, failed и cancelled операции кошелька для сверки."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <p className="sr-only" role="status">
            {t("common.loading")}
          </p>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20" rounded="rounded-2xl" />
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(data.byStatus || []).map((row) => (
                <StatTile
                  key={row.status}
                  label={<span className="capitalize">{row.status}</span>}
                  value={row.count}
                  hint={money(row.sum)}
                />
              ))}
            </div>

            {!data.gatewayConfigured && (
              <Alert tone="warning">
                Alif не активен в конфигурации сервера — проверьте переменные
                окружения.
              </Alert>
            )}

            {Array.isArray(data.attention) && data.attention.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-ink-700">
                  Требуют внимания
                </h3>

                <ul className="space-y-2">
                  {data.attention.map((tx) => (
                    <li
                      key={tx.id}
                      className="surface-panel flex items-center justify-between gap-3 p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-800 break-anywhere">
                          {tx.userEmail || "—"}
                        </p>
                        <p className="text-xs text-ink-400">
                          {WALLET_TYPE_LABELS[tx.type] || tx.type} · {tx.status}
                        </p>
                      </div>

                      <p className="shrink-0 font-bold text-ink-900">
                        {money(tx.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <EmptyState
                bare
                icon={CreditCard}
                title="Всё сходится"
                description="Нет pending, failed или cancelled операций."
              />
            )}
          </>
        )
      )}
    </Card>
  );
}

export function FinancePromotionsTab({ token }) {
  const { t } = useI18n();
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await api.adminFinancePromotions(token, { from, to });
      setData(result);
    } catch (e) {
      setError(e.message || "Не удалось загрузить доход");
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="space-y-4">
      <SectionHeader
        eyebrow="VIP / TOP"
        icon={Crown}
        title="Доход от продвижения"
        description="Списания с описанием VIP/TOP за выбранный период."
      />

      <PeriodFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatTile label="Покупок продвижения" value={data.count || 0} />
            <StatTile label="Выручка" value={money(data.revenue)} tone="sun" />
            <div className="surface-panel p-4">
              <p className="text-xs font-medium text-ink-400">Тарифы</p>
              <p className="mt-1 text-sm text-ink-700">
                VIP: {money(data.vipPrice)}
              </p>
              <p className="text-sm text-ink-700">TOP: {money(data.topPrice)}</p>
            </div>
          </div>

          {Array.isArray(data.recent) && data.recent.length > 0 ? (
            <DataTable label={t("admin.tablePromotions")} minWidth="44rem">
              <thead>
                <tr>
                  <Th>Дата</Th>
                  <Th>Пользователь</Th>
                  <Th align="right">Сумма</Th>
                  <Th>Описание</Th>
                </tr>
              </thead>

              <tbody>
                {data.recent.map((tx) => (
                  <TableRow key={tx.id}>
                    <Td className="whitespace-nowrap text-ink-400">
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString("ru-RU")
                        : "—"}
                    </Td>
                    <Td className="text-ink-700 break-anywhere">
                      {tx.userEmail || "—"}
                    </Td>
                    <Td className="whitespace-nowrap text-right font-bold text-danger-700">
                      {money(tx.amount)}
                    </Td>
                    <Td className="text-ink-500 break-anywhere">
                      {tx.description || "—"}
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState
              bare
              icon={Crown}
              title="Покупок VIP/TOP не найдено"
              description="За выбранный период продвижение не покупали."
            />
          )}
        </>
      )}
    </Card>
  );
}
