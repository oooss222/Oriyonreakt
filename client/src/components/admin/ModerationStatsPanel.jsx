import React from "react";
import { AlertTriangle, Clock3, Flag, Layers3 } from "lucide-react";
import { api } from "../../lib/api";
import { Alert, Card, Skeleton } from "../../ui";
import { useI18n } from "../../i18n";
import { DataTable, StatTile, Td, Th } from "./AdminUI";

export default function ModerationStatsPanel({ token }) {
  const { t } = useI18n();
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const data = await api.moderationStats(token);
      setStats(data || null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card className="space-y-3">
        <p className="sr-only" role="status">
          {t("common.loading")}
        </p>
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20" rounded="rounded-2xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-base font-bold text-ink-900">
          SLA и очередь
        </h2>
        <p className="mt-0.5 text-sm text-ink-400">
          Среднее время модерации за 30 дней: {stats.avgModerationHours} ч
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="В очереди" value={stats.pending} />
        <StatTile
          icon={Clock3}
          tone={Number(stats.pendingOver24h || 0) > 0 ? "warning" : "neutral"}
          label="Старше 24 ч"
          value={stats.pendingOver24h}
        />
        <StatTile
          icon={Flag}
          tone={Number(stats.pendingReports || 0) > 0 ? "danger" : "neutral"}
          label="Жалобы"
          value={stats.pendingReports}
        />
        <StatTile
          icon={Layers3}
          tone={Number(stats.appealsPending || 0) > 0 ? "info" : "neutral"}
          label="Апелляции"
          value={stats.appealsPending}
        />
      </div>

      {stats.flagged > 0 && (
        <Alert tone="warning" icon={AlertTriangle}>
          {stats.flagged} объявлений с автоматическими флагами
        </Alert>
      )}

      {stats.byCategory?.length > 0 && (
        <DataTable label={t("admin.tableCategories")} minWidth="24rem">
          <thead>
            <tr>
              <Th>Категория</Th>
              <Th align="right">Одобрено</Th>
              <Th align="right">Отклонено</Th>
            </tr>
          </thead>
          <tbody>
            {stats.byCategory.map((row) => (
              <tr key={row.cat}>
                <Td className="font-medium text-ink-800">{row.cat}</Td>
                <Td className="text-right font-semibold text-success-700">
                  {row.approved}
                </Td>
                <Td className="text-right font-semibold text-danger-700">
                  {row.rejected}
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </Card>
  );
}
