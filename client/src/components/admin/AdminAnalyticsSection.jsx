import React from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../../lib/api";
import { CAT_LABELS } from "../../data/categories";
import { Alert, Card, EmptyState, Field, Select, Skeleton } from "../../ui";
import { useI18n } from "../../i18n";
import { DataTable, SectionHeader, TableRow, Td, Th } from "./AdminUI";

const DAY_OPTIONS = [
  { value: "7", label: "7 дней" },
  { value: "14", label: "14 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
];

function BarChart({ items, labelKey, valueKey, emptyLabel = "Нет данных" }) {
  if (!items?.length) {
    return <p className="text-sm text-ink-400">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const value = Number(item[valueKey] || 0);
        const width = Math.max((value / max) * 100, value > 0 ? 4 : 0);

        return (
          <li
            key={String(item[labelKey])}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className="w-24 shrink-0 truncate text-ink-500 sm:w-28"
              title={item[labelKey]}
            >
              {item[labelKey]}
            </span>

            <span className="h-6 flex-1 overflow-hidden rounded-full bg-mist-200">
              <span
                className="block h-full rounded-full bg-sun-500"
                style={{ width: `${width}%` }}
              />
            </span>

            <span className="w-10 shrink-0 text-right font-semibold text-ink-700">
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminAnalyticsSection({ token }) {
  const { t } = useI18n();
  const [days, setDays] = React.useState(30);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api
      .adminAnalytics(token, days)
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Не удалось загрузить аналитику");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, days]);

  const categoryItems = React.useMemo(() => {
    return (data?.listingsByCategory || []).map((item) => ({
      label: CAT_LABELS[item.cat] || item.cat,
      count: item.count,
    }));
  }, [data]);

  const registrationItems = React.useMemo(() => {
    return (data?.registrationsByDay || []).map((item) => ({
      label: item.day.slice(5),
      count: item.count,
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className="space-y-4">
        <p className="sr-only" role="status">
          {t("common.loading")}
        </p>
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-64" rounded="rounded-2xl" />
          <Skeleton className="h-64" rounded="rounded-2xl" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert tone="danger">{error}</Alert>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <SectionHeader
        eyebrow="Аналитика"
        icon={BarChart3}
        title="Графики и активность"
        description="Регистрации, категории объявлений и работа модераторов."
        action={
          <Field label={t("admin.periodLabel")} labelClassName="sr-only">
            {(props) => (
              <Select
                {...props}
                value={String(days)}
                onChange={(e) => setDays(Number(e.target.value))}
                options={DAY_OPTIONS}
                className="w-auto"
              />
            )}
          </Field>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="surface-panel space-y-4 p-4">
          <h3 className="font-semibold text-ink-900">Регистрации по дням</h3>
          <BarChart
            items={registrationItems}
            labelKey="label"
            valueKey="count"
            emptyLabel="За период регистраций нет"
          />
        </section>

        <section className="surface-panel space-y-4 p-4">
          <h3 className="font-semibold text-ink-900">
            Опубликованные объявления по категориям
          </h3>
          <BarChart
            items={categoryItems}
            labelKey="label"
            valueKey="count"
            emptyLabel="Опубликованных объявлений нет"
          />
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold text-ink-900">
          Активность модераторов и админов
        </h3>

        {(data?.moderatorActivity || []).length === 0 ? (
          <EmptyState
            bare
            icon={BarChart3}
            title="Действий за период нет"
            description={t("admin.analyticsEmptyDescription")}
          />
        ) : (
          <DataTable label={t("admin.tableModerators")} minWidth="40rem">
            <thead>
              <tr>
                <Th>Сотрудник</Th>
                <Th align="right">Одобрено</Th>
                <Th align="right">Отклонено</Th>
                <Th align="right">Жалобы</Th>
                <Th align="right">Всего</Th>
              </tr>
            </thead>

            <tbody>
              {data.moderatorActivity.map((row) => (
                <TableRow key={row.actorId || row.email}>
                  <Td>
                    <div className="font-medium text-ink-800">{row.name}</div>
                    <div className="text-xs text-ink-400 break-anywhere">
                      {row.email}
                    </div>
                  </Td>
                  <Td className="text-right text-ink-700">{row.approvals}</Td>
                  <Td className="text-right text-ink-700">{row.rejections}</Td>
                  <Td className="text-right text-ink-700">
                    {row.reportActions}
                  </Td>
                  <Td className="text-right font-semibold text-ink-900">
                    {row.totalActions}
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </section>
    </Card>
  );
}
