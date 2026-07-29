import React from "react";
import {
  FileBarChart,
  ScrollText,
  CreditCard,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { AUDIT_ACTION_LABELS, WALLET_TYPE_LABELS } from "../../lib/adminUtils";

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
  return (
    <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
      <label className="text-sm">
        <span className="text-slate-500 block mb-1">С даты</span>
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="h-11 w-full rounded-xl border px-3 bg-white"
        />
      </label>
      <label className="text-sm">
        <span className="text-slate-500 block mb-1">По дату</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="h-11 w-full rounded-xl border px-3 bg-white"
        />
      </label>
      <div className="md:col-span-2 flex items-end">
        <button
          type="button"
          disabled={loading}
          onClick={onApply}
          className="h-11 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Считаем..." : "Построить отчёт"}
        </button>
      </div>
    </div>
  );
}

export function FinanceReportsTab({ token }) {
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
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
          <FileBarChart className="w-4 h-4" />
          Отчёты
        </div>
        <p className="text-sm text-slate-500">
          Оборот за период: пополнения, списания и корректировки.
        </p>
      </div>

      <PeriodFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-xl border p-4 bg-slate-50">
              <div className="text-sm text-slate-500">Операций</div>
              <div className="text-2xl font-bold mt-1">{report.totalTransactions}</div>
            </div>
            <div className="rounded-xl border p-4 bg-emerald-50">
              <div className="text-sm text-emerald-700">Пополнения</div>
              <div className="text-2xl font-bold mt-1 text-emerald-800">
                +{Number(report.credits || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-red-50">
              <div className="text-sm text-red-700">Списания</div>
              <div className="text-2xl font-bold mt-1 text-red-800">
                {Number(report.debits || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-amber-50">
              <div className="text-sm text-amber-700">Корректировки</div>
              <div className="text-2xl font-bold mt-1 text-amber-800">
                {report.manualAdjustments}
              </div>
              <div className="text-xs text-amber-700 mt-1">
                {Number(report.manualAdjustmentsSum || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
          </div>

          {Array.isArray(report.byType) && report.byType.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-3 px-3">Тип</th>
                    <th className="py-3 px-3">Кол-во</th>
                    <th className="py-3 px-3">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byType.map((row) => (
                    <tr key={row.type} className="border-b last:border-b-0">
                      <td className="py-3 px-3">
                        {WALLET_TYPE_LABELS[row.type] || row.type}
                      </td>
                      <td className="py-3 px-3">{row.count}</td>
                      <td className="py-3 px-3 font-medium">
                        {Number(row.sum || 0).toLocaleString("ru-RU")} TJS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function FinanceAuditTab({ token }) {
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
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-2">
          <ScrollText className="w-4 h-4" />
          Финансовый журнал
        </div>
        <p className="text-sm text-slate-500">
          Корректировки баланса супер-админом. Полная история операций — во вкладке «Операции».
        </p>
      </div>

      <PeriodFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Назад
        </button>
        <span>{page}</span>
        <button
          type="button"
          disabled={items.length < PAGE_SIZE || loading}
          onClick={() => setPage((p) => p + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
        >
          Вперёд
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse h-32 rounded-xl bg-slate-100" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-500">
          Записей не найдено.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm border-collapse bg-white">
            <thead className="bg-slate-50">
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 px-3">Когда</th>
                <th className="py-3 px-3">Кто</th>
                <th className="py-3 px-3">Действие</th>
                <th className="py-3 px-3">Детали</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium">{item.actorName || "—"}</div>
                    <div className="text-xs text-slate-500">{item.actorEmail}</div>
                  </td>
                  <td className="py-3 px-3">
                    {AUDIT_ACTION_LABELS[item.action] || item.action}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{formatAuditDetails(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function FinanceAlifOrdersTab({ token }) {
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
    } catch (e) {
      setError(e.message || "Не удалось синхронизировать заказ");
    } finally {
      setSyncingId("");
    }
  };

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 animate-pulse h-40" />;
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-3 py-1 mb-2">
          <CreditCard className="w-4 h-4" />
          Alif orders
        </div>
        <p className="text-sm text-slate-500">
          Сверка платежей Alif Acquiring и статусов пополнения кошелька.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(data.byStatus || []).map((row) => (
              <div key={row.status} className="rounded-xl border p-4 bg-slate-50">
                <div className="text-sm text-slate-500 capitalize">{row.status}</div>
                <div className="text-2xl font-bold mt-1">{row.count}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {Number(row.sum || 0).toLocaleString("ru-RU")} TJS
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left py-3 px-3">Order ID</th>
                  <th className="text-left py-3 px-3">Пользователь</th>
                  <th className="text-left py-3 px-3">Сумма</th>
                  <th className="text-left py-3 px-3">Статус</th>
                  <th className="text-left py-3 px-3">Provider</th>
                  <th className="text-left py-3 px-3">Дата</th>
                  <th className="text-left py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {(data.items || []).map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="py-3 px-3 font-mono text-xs">{order.orderId}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{order.userName || "—"}</div>
                      <div className="text-xs text-slate-500">{order.userEmail}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {Number(order.amount || 0).toLocaleString("ru-RU")} TJS
                    </td>
                    <td className="py-3 px-3 capitalize">{order.status}</td>
                    <td className="py-3 px-3">{order.providerStatus || "—"}</td>
                    <td className="py-3 px-3">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("ru-RU")
                        : "—"}
                    </td>
                    <td className="py-3 px-3">
                      {order.status !== "paid" && (
                        <button
                          type="button"
                          className="text-sun-700 hover:underline"
                          disabled={syncingId === order.orderId}
                          onClick={() => syncOrder(order.orderId)}
                        >
                          {syncingId === order.orderId ? "..." : "Sync"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function FinancePaymentsTab({ token }) {
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

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 animate-pulse h-40" />;
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-3 py-1 mb-2">
          <CreditCard className="w-4 h-4" />
          Платежи
        </div>
        <p className="text-sm text-slate-500">
          Статусы транзакций кошелька. После подключения платёжного шлюза здесь появятся
          pending и failed операции для сверки.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(data.byStatus || []).map((row) => (
              <div key={row.status} className="rounded-xl border p-4 bg-slate-50">
                <div className="text-sm text-slate-500 capitalize">{row.status}</div>
                <div className="text-2xl font-bold mt-1">{row.count}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {Number(row.sum || 0).toLocaleString("ru-RU")} TJS
                </div>
              </div>
            ))}
          </div>

          {!data.gatewayConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 p-3 text-sm">
              Alif не активен в конфигурации сервера — проверьте переменные окружения.
            </div>
          )}

          {Array.isArray(data.attention) && data.attention.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Требуют внимания</div>
              {data.attention.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{tx.userEmail || "—"}</div>
                    <div className="text-xs text-slate-500">
                      {WALLET_TYPE_LABELS[tx.type] || tx.type} · {tx.status}
                    </div>
                  </div>
                  <div className="font-bold">
                    {Number(tx.amount || 0).toLocaleString("ru-RU")} TJS
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
              Нет pending, failed или cancelled операций.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function FinancePromotionsTab({ token }) {
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
    <div className="rounded-2xl border bg-white p-4 space-y-4">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
          <Sparkles className="w-4 h-4" />
          VIP / TOP
        </div>
        <p className="text-sm text-slate-500">
          Доход от продвижения объявлений (списания с описанием VIP/TOP).
        </p>
      </div>

      <PeriodFilters
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={load}
        loading={loading}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border p-4 bg-slate-50">
              <div className="text-sm text-slate-500">Покупок продвижения</div>
              <div className="text-2xl font-bold mt-1">{data.count || 0}</div>
            </div>
            <div className="rounded-xl border p-4 bg-sun-50">
              <div className="text-sm text-sun-700">Выручка</div>
              <div className="text-2xl font-bold mt-1 text-sun-800">
                {Number(data.revenue || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
            <div className="rounded-xl border p-4 bg-white">
              <div className="text-sm text-slate-500">Тарифы</div>
              <div className="text-sm mt-2">
                VIP: {Number(data.vipPrice || 0).toLocaleString("ru-RU")} TJS
              </div>
              <div className="text-sm">
                TOP: {Number(data.topPrice || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
          </div>

          {Array.isArray(data.recent) && data.recent.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm border-collapse bg-white">
                <thead className="bg-slate-50">
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-3 px-3">Дата</th>
                    <th className="py-3 px-3">Пользователь</th>
                    <th className="py-3 px-3">Сумма</th>
                    <th className="py-3 px-3">Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-b-0">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleString("ru-RU")
                          : "—"}
                      </td>
                      <td className="py-3 px-3">{tx.userEmail || "—"}</td>
                      <td className="py-3 px-3 font-bold text-red-700">
                        {Number(tx.amount || 0).toLocaleString("ru-RU")} TJS
                      </td>
                      <td className="py-3 px-3 text-slate-500">{tx.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
              За выбранный период покупок VIP/TOP не найдено.
            </div>
          )}
        </>
      )}
    </div>
  );
}
