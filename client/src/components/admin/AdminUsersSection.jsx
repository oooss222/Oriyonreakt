import React from "react";
import { Shield, Ban, Unlock, Search, RotateCw, Users } from "lucide-react";
import { api } from "../../lib/api";
import {
  ROLES,
  getId,
  roleLabel,
  canManageUser,
  formatRegistrationDevice,
} from "../../lib/adminUtils";
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
  useConfirm,
  useToast,
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
  { value: "created_desc", label: "Дата регистрации ↓" },
  { value: "created_asc", label: "Дата регистрации ↑" },
  { value: "balance_desc", label: "Баланс ↓" },
  { value: "balance_asc", label: "Баланс ↑" },
  { value: "role_asc", label: "Роль A→Z" },
  { value: "name_asc", label: "Имя A→Z" },
];

const ROLE_OPTIONS = [
  { value: "all", label: "Все роли" },
  ...ROLES.map((role) => ({ value: role, label: roleLabel(role) })),
];

const BUSINESS_OPTIONS = [
  { value: "all", label: "Все аккаунты" },
  { value: "company", label: "Премиум" },
  { value: "unverified", label: "Ждут верификации" },
  { value: "verified", label: "Проверенный премиум" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Активные" },
  { value: "blocked", label: "Заблокированные" },
];

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function userDisplayName(user) {
  if (user.sellerType === "company" && user.companyName) {
    return user.companyName;
  }

  return user.name || "Без имени";
}

export default function AdminUsersSection({
  token,
  currentUser,
  initialBusinessFilter = "all",
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [users, setUsers] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [businessFilter, setBusinessFilter] = React.useState(
    initialBusinessFilter || "all"
  );
  const [sortKey, setSortKey] = React.useState("created_desc");
  const [page, setPage] = React.useState(1);
  const [selectedUserId, setSelectedUserId] = React.useState(null);

  const debouncedQuery = useDebouncedValue(query);

  React.useEffect(() => {
    setBusinessFilter(initialBusinessFilter || "all");
  }, [initialBusinessFilter]);

  const currentRole = currentUser?.role || "user";
  const isSuperAdmin = currentRole === "super_admin";

  const loadUsers = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminUsers(token, {
        q: debouncedQuery,
        role: roleFilter,
        status: statusFilter,
        business: businessFilter,
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
  }, [token, debouncedQuery, roleFilter, statusFilter, businessFilter, sortKey, page]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQuery, roleFilter, statusFilter, businessFilter, sortKey]);

  const filtersActive =
    Boolean(query) ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    businessFilter !== "all" ||
    sortKey !== "created_desc";

  const resetFilters = () => {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setBusinessFilter("all");
    setSortKey("created_desc");
  };

  const changeRole = async (userId, nextRole) => {
    if (!isSuperAdmin) {
      showToast("Только супер-админ может менять роли", "error");
      return;
    }

    try {
      await api.adminSetUserRole(token, userId, nextRole);
      await loadUsers();
      showToast(t("admin.toastRoleChanged"), "success");
    } catch (e) {
      showToast(e.message || "Ошибка изменения роли", "error");
    }
  };

  const toggleBlock = async (user) => {
    if (!canManageUser(currentUser, user)) {
      showToast("Недостаточно прав для управления этим пользователем", "error");
      return;
    }

    const userId = getId(user);
    const blocking = !user.isBlocked;

    const ok = await confirm({
      title: blocking ? t("admin.blockUserTitle") : t("admin.unblockUserTitle"),
      message: blocking
        ? t("admin.blockUserMessage", { email: user.email })
        : t("admin.unblockUserMessage", { email: user.email }),
      confirmLabel: blocking
        ? t("admin.blockConfirm")
        : t("admin.unblockConfirm"),
      tone: blocking ? "danger" : undefined,
    });

    if (!ok) return;

    try {
      if (user.isBlocked) {
        await api.adminUnblockUser(token, userId);
      } else {
        await api.adminBlockUser(token, userId);
      }

      await loadUsers();
      showToast(
        blocking ? t("admin.toastUserBlocked") : t("admin.toastUserUnblocked"),
        "success"
      );
    } catch (e) {
      showToast(e.message || "Ошибка блокировки", "error");
    }
  };

  const handleUserUpdated = () => {
    loadUsers();
  };

  return (
    <>
      <Card className="space-y-5">
        <SectionHeader
          eyebrow={isSuperAdmin ? "Панель супер-админа" : "Панель администратора"}
          icon={Shield}
          title="Пользователи"
          description="Нажмите на строку, чтобы открыть карточку пользователя."
          action={
            <Button icon={RotateCw} loading={refreshing} onClick={loadUsers}>
              Обновить
            </Button>
          }
        />

        {error && <Alert tone="danger">{error}</Alert>}

        <FilterBar
          gridClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-6"
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
                placeholder="Поиск: имя, email, телефон, компания"
              />
            )}
          </Field>

          <Field label={t("admin.roleFilterLabel")} labelClassName="sr-only">
            {(props) => (
              <Select
                {...props}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={ROLE_OPTIONS}
              />
            )}
          </Field>

          <Field label={t("admin.accountFilterLabel")} labelClassName="sr-only">
            {(props) => (
              <Select
                {...props}
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                options={BUSINESS_OPTIONS}
              />
            )}
          </Field>

          <Field label={t("admin.statusLabel")} labelClassName="sr-only">
            {(props) => (
              <Select
                {...props}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
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
          <TableSkeleton
            label={t("admin.tableUsers")}
            rows={8}
            columns={isSuperAdmin ? 6 : 5}
          />
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
            label={t("admin.tableUsers")}
            minWidth={isSuperAdmin ? "68rem" : "58rem"}
            scrollHeight="70vh"
          >
            <thead>
              <tr>
                <Th>Пользователь</Th>
                <Th>Контакты</Th>
                <Th>Тип</Th>
                <Th>Роль</Th>
                <Th align="right">Баланс</Th>
                <Th>Статус</Th>
                {isSuperAdmin ? <Th>Устройство</Th> : null}
                <Th>Дата</Th>
                <Th align="right">Действия</Th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const id = getId(user);
                const role = user.role || "user";
                const manageable = canManageUser(currentUser, user);

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
                        {userDisplayName(user)}
                        <span className="sr-only">
                          {" "}
                          — {t("admin.openUserCard")}
                        </span>
                      </button>

                      <div className="text-xs text-ink-400">
                        {user.sellerType === "company" && user.companyName
                          ? user.name
                          : `ID: ${String(id).slice(0, 8)}`}
                      </div>
                    </Td>

                    <Td>
                      <div className="text-ink-800 break-anywhere">
                        {user.email}
                      </div>
                      <div className="text-xs text-ink-400">
                        {user.phone || "Телефон не указан"}
                      </div>
                    </Td>

                    <Td>
                      {user.sellerType === "company" ? (
                        <Badge tone={user.businessVerified ? "success" : "info"}>
                          {user.businessVerified ? "Проверен" : "Премиум"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-ink-400">Частник</span>
                      )}
                    </Td>

                    <Td onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-2">
                        <Badge tone={roleTone(role)} className="w-max">
                          {roleLabel(role)}
                        </Badge>

                        {isSuperAdmin ? (
                          <Select
                            value={role}
                            onChange={(e) => changeRole(id, e.target.value)}
                            options={ROLES.map((item) => ({
                              value: item,
                              label: roleLabel(item),
                            }))}
                            className="h-9 min-w-[9rem] text-xs"
                            aria-label={t("admin.changeRoleFor", {
                              name: userDisplayName(user),
                            })}
                          />
                        ) : null}
                      </div>
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

                    {isSuperAdmin ? (
                      <Td className="text-xs text-ink-500">
                        {formatRegistrationDevice(user)}
                      </Td>
                    ) : null}

                    <Td className="whitespace-nowrap text-ink-400">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("ru-RU")
                        : "—"}
                    </Td>

                    <Td
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant={user.isBlocked ? "secondary" : "danger"}
                        icon={user.isBlocked ? Unlock : Ban}
                        disabled={!manageable}
                        onClick={() => toggleBlock(user)}
                      >
                        {user.isBlocked ? "Разблокировать" : "Заблокировать"}
                      </Button>
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
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}
