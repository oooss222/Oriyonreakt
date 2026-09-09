import React from "react";
import { Users, Search, RotateCw } from "lucide-react";
import { api } from "../../lib/api";
import { getId, roleLabel } from "../../lib/adminUtils";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  SimplePagination,
} from "../../ui";
import { useI18n } from "../../i18n";
import UserDetailModal from "./UserDetailModal";
import {
  DataTable,
  FilterBar,
  ResultsBar,
  SectionHeader,
  TableRow,
  TableSkeleton,
  Td,
  Th,
  roleTone,
} from "./AdminUI";

const PAGE_SIZE = 25;

const SORT_OPTIONS = [
  { value: "balance_desc", label: "Баланс ↓" },
  { value: "balance_asc", label: "Баланс ↑" },
  { value: "created_desc", label: "Дата регистрации ↓" },
  { value: "name_asc", label: "Имя A→Z" },
];

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function AdminFinanceUsersSection({ token, currentUser }) {
  const { t } = useI18n();

  const [users, setUsers] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState("balance_desc");
  const [page, setPage] = React.useState(1);
  const [selectedUserId, setSelectedUserId] = React.useState(null);

  const debouncedQuery = useDebouncedValue(query);

  const loadUsers = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminUsers(token, {
        q: debouncedQuery,
        sort: sortKey,
        page,
        limit: PAGE_SIZE,
      });

      setUsers(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
      setTotalPages(Math.max(1, Number(data.totalPages || 1)));
    } catch (e) {
      setError(e.message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, debouncedQuery, sortKey, page]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortKey]);

  const filtersActive = Boolean(query) || sortKey !== "balance_desc";

  const resetFilters = () => {
    setQuery("");
    setSortKey("balance_desc");
  };

  return (
    <>
      <Card className="space-y-4">
        <SectionHeader
          eyebrow="Кошельки пользователей"
          icon={Users}
          title="Балансы"
          description="Просмотр балансов и истории операций. Режим только для чтения."
          action={
            <Button icon={RotateCw} loading={refreshing} onClick={loadUsers}>
              Обновить
            </Button>
          }
        />

        {error && <Alert tone="danger">{error}</Alert>}

        <FilterBar
          gridClassName="grid-cols-1 sm:grid-cols-3"
          onReset={resetFilters}
          resetDisabled={!filtersActive}
        >
          <Field
            label={t("admin.searchLabel")}
            labelClassName="sr-only"
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                type="search"
                iconLeft={Search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: имя, email, телефон"
              />
            )}
          </Field>

          <Field label={t("admin.sortLabel")} labelClassName="sr-only">
            {(props) => (
              <Select
                {...props}
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                options={SORT_OPTIONS}
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
          Показано: {users.length} из {total}
          {query !== debouncedQuery ? " · ищем…" : ""}
        </ResultsBar>

        {loading ? (
          <TableSkeleton label={t("admin.tableWallets")} rows={8} columns={5} />
        ) : users.length === 0 ? (
          <EmptyState
            bare
            icon={Users}
            title="Пользователи не найдены"
            description={t("admin.emptyFiltersHint")}
            secondaryAction={
              filtersActive ? (
                <Button onClick={resetFilters}>{t("admin.reset")}</Button>
              ) : null
            }
          />
        ) : (
          <DataTable
            label={t("admin.tableWallets")}
            minWidth="46rem"
            scrollHeight="70vh"
          >
            <thead>
              <tr>
                <Th>Пользователь</Th>
                <Th>Email</Th>
                <Th>Роль</Th>
                <Th align="right">Баланс</Th>
                <Th>Статус</Th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const id = getId(user);
                const role = user.role || "user";

                return (
                  <TableRow
                    key={id}
                    className="cursor-pointer"
                    onClick={() => setSelectedUserId(id)}
                  >
                    <Td>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(id)}
                        className="rounded text-left font-semibold text-ink-900 hover:text-sun-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun/50"
                      >
                        {user.name || "Без имени"}
                        <span className="sr-only">
                          {" "}
                          — {t("admin.openUserCard")}
                        </span>
                      </button>
                    </Td>

                    <Td className="text-ink-700 break-anywhere">{user.email}</Td>

                    <Td>
                      <Badge tone={roleTone(role)}>{roleLabel(role)}</Badge>
                    </Td>

                    <Td className="whitespace-nowrap text-right font-semibold text-ink-800">
                      {Number(user.walletBalance || 0).toLocaleString("ru-RU")} TJS
                    </Td>

                    <Td>
                      {user.isBlocked ? (
                        <Badge tone="danger">Заблокирован</Badge>
                      ) : (
                        <Badge tone="success">Активен</Badge>
                      )}
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>

      {selectedUserId && (
        <UserDetailModal
          token={token}
          userId={selectedUserId}
          currentUser={currentUser}
          readOnly
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}
