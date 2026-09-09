import React from "react";
import { ScrollText, RotateCw } from "lucide-react";
import { api } from "../../lib/api";
import { AUDIT_ACTION_LABELS } from "../../lib/adminUtils";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Select,
  SimplePagination,
} from "../../ui";
import { useI18n } from "../../i18n";
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

const PAGE_SIZE = 50;

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "Все действия" },
  ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

function formatDetails(item) {
  const details = item.details || {};
  const parts = [];

  if (details.email) parts.push(details.email);
  if (details.title) parts.push(`«${details.title}»`);
  if (details.status) parts.push(`статус: ${details.status}`);
  if (details.role) parts.push(`роль: ${details.role}`);
  if (details.amount !== undefined) {
    parts.push(`${Number(details.amount).toLocaleString("ru-RU")} TJS`);
  }
  if (details.reason) parts.push(details.reason);
  if (details.ownerEmail) parts.push(`продавец: ${details.ownerEmail}`);

  return parts.join(" · ") || "—";
}

export default function AdminAuditSection({ token }) {
  const { t } = useI18n();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminAuditLog(token, {
        action: actionFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Не удалось загрузить журнал");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, actionFilter, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [actionFilter]);

  return (
    <Card className="space-y-5">
      <SectionHeader
        eyebrow="Audit log"
        icon={ScrollText}
        title="Журнал действий"
        description="Блокировки, смена ролей, удаления объявлений и решения по жалобам."
        action={
          <Button icon={RotateCw} loading={refreshing} onClick={load}>
            Обновить
          </Button>
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <FilterBar
        gridClassName="grid-cols-1 sm:max-w-md"
        onReset={() => setActionFilter("")}
        resetDisabled={!actionFilter}
      >
        <Field label={t("admin.actionFilterLabel")}>
          {(props) => (
            <Select
              {...props}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={ACTION_FILTER_OPTIONS}
            />
          )}
        </Field>
      </FilterBar>

      <ResultsBar
        pager={
          <SimplePagination
            page={page}
            totalPages={items.length < PAGE_SIZE ? page : page + 1}
            onPageChange={setPage}
            disabled={refreshing}
          />
        }
      >
        Показано: {items.length}
      </ResultsBar>

      {loading ? (
        <TableSkeleton label={t("admin.tableAudit")} rows={8} columns={4} />
      ) : items.length === 0 ? (
        <EmptyState
          bare
          icon={ScrollText}
          title="Записей пока нет"
          description={t("admin.auditEmptyDescription")}
        />
      ) : (
        <DataTable
          label={t("admin.tableAudit")}
          minWidth="52rem"
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
                  {formatDetails(item)}
                </Td>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </Card>
  );
}
