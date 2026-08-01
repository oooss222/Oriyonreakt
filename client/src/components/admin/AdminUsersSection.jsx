import React from "react";
import { Shield, Ban, Unlock, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import {
  ROLES,
  getId,
  roleLabel,
  roleBadgeClass,
  canManageUser,
} from "../../lib/adminUtils";
import UserDetailModal from "./UserDetailModal";

const PAGE_SIZE = 25;

const SORT_OPTIONS = [
  { value: "created_desc", label: "Дата регистрации ↓" },
  { value: "created_asc", label: "Дата регистрации ↑" },
  { value: "balance_desc", label: "Баланс ↓" },
  { value: "balance_asc", label: "Баланс ↑" },
  { value: "role_asc", label: "Роль A→Z" },
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

export default function AdminUsersSection({
  token,
  currentUser,
  initialBusinessFilter = "all",
}) {
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

  const changeRole = async (userId, nextRole) => {
    if (!isSuperAdmin) {
      alert("Только супер-админ может менять роли");
      return;
    }

    try {
      await api.adminSetUserRole(token, userId, nextRole);
      await loadUsers();
    } catch (e) {
      alert(e.message || "Ошибка изменения роли");
    }
  };

  const toggleBlock = async (user) => {
    if (!canManageUser(currentUser, user)) {
      alert("Недостаточно прав для управления этим пользователем");
      return;
    }

    const userId = getId(user);
    const action = user.isBlocked ? "разблокировать" : "заблокировать";
    const ok = confirm(`Вы действительно хотите ${action} пользователя ${user.email}?`);
    if (!ok) return;

    try {
      if (user.isBlocked) {
        await api.adminUnblockUser(token, userId);
      } else {
        await api.adminBlockUser(token, userId);
      }

      await loadUsers();
    } catch (e) {
      alert(e.message || "Ошибка блокировки");
    }
  };

  const handleUserUpdated = () => {
    loadUsers();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4 animate-pulse">
        <div className="h-7 bg-mist-200 rounded w-48" />
        <div className="h-12 bg-mist-200 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-mist-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
              <Shield className="w-4 h-4" />
              {isSuperAdmin ? "Панель супер-админа" : "Панель администратора"}
            </div>

            <h2 className="text-xl font-bold">Пользователи</h2>
            <p className="text-sm text-slate-500 mt-1">
              Нажмите на строку, чтобы открыть карточку пользователя.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl border hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? "Обновляем..." : "Обновить"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
            {error}
          </div>
        )}

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: имя, email, телефон, компания"
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 xl:col-span-2"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="all">Все роли</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>

          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="all">Все аккаунты</option>
            <option value="company">Премиум</option>
            <option value="unverified">Ждут верификации</option>
            <option value="verified">Проверенный премиум</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
          </select>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500">
          <div>
            Показано: {users.length} из {total}
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

        {users.length === 0 ? (
          <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-500">
            Пользователи не найдены.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr className="border-b text-left text-slate-500">
                  <th className="py-3 px-3">Пользователь</th>
                  <th className="py-3 px-3">Контакты</th>
                  <th className="py-3 px-3">Тип</th>
                  <th className="py-3 px-3">Роль</th>
                  <th className="py-3 px-3">Баланс</th>
                  <th className="py-3 px-3">Статус</th>
                  <th className="py-3 px-3">Дата</th>
                  <th className="py-3 px-3">Действия</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const id = getId(user);
                  const role = user.role || "user";
                  const manageable = canManageUser(currentUser, user);

                  return (
                    <tr
                      key={id}
                      className="border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedUserId(id)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold">
                          {user.sellerType === "company" && user.companyName
                            ? user.companyName
                            : user.name || "Без имени"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.sellerType === "company" && user.companyName
                            ? user.name
                            : `ID: ${String(id).slice(0, 8)}...`}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div>{user.email}</div>
                        <div className="text-xs text-slate-500">
                          {user.phone || "Телефон не указан"}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {user.sellerType === "company" ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${
                              user.businessVerified
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {user.businessVerified ? "Проверен" : "Премиум"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Частник</span>
                        )}
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-max px-2 py-0.5 text-xs rounded-full border ${roleBadgeClass(
                              role
                            )}`}
                          >
                            {roleLabel(role)}
                          </span>

                          {isSuperAdmin ? (
                            <select
                              value={role}
                              onChange={(e) => changeRole(id, e.target.value)}
                              className="h-9 rounded-lg border px-2 bg-white"
                            >
                              {ROLES.map((item) => (
                                <option key={item} value={item}>
                                  {roleLabel(item)}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium">
                        {Number(user.walletBalance || 0).toLocaleString("ru-RU")} TJS
                      </td>

                      <td className="py-3 px-3">
                        {user.isBlocked ? (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-700 border border-red-200">
                            Заблокирован
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Активен
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("ru-RU")
                          : "—"}
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!manageable}
                          onClick={() => toggleBlock(user)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.isBlocked
                              ? "hover:bg-emerald-50 text-emerald-700"
                              : "hover:bg-red-50 text-red-700"
                          }`}
                        >
                          {user.isBlocked ? (
                            <>
                              <Unlock size={16} />
                              Разблокировать
                            </>
                          ) : (
                            <>
                              <Ban size={16} />
                              Заблокировать
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
