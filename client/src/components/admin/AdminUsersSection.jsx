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

function sortUsers(list, sortKey) {
  const items = [...list];

  items.sort((a, b) => {
    if (sortKey === "created_desc") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortKey === "created_asc") {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    if (sortKey === "balance_desc") {
      return Number(b.walletBalance || 0) - Number(a.walletBalance || 0);
    }
    if (sortKey === "balance_asc") {
      return Number(a.walletBalance || 0) - Number(b.walletBalance || 0);
    }
    if (sortKey === "role_asc") {
      return String(a.role || "").localeCompare(String(b.role || ""), "ru");
    }
    if (sortKey === "name_asc") {
      return String(a.name || "").localeCompare(String(b.name || ""), "ru");
    }
    return 0;
  });

  return items;
}

export default function AdminUsersSection({ token, currentUser }) {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState("created_desc");
  const [page, setPage] = React.useState(1);
  const [selectedUserId, setSelectedUserId] = React.useState(null);

  const currentRole = currentUser?.role || "user";
  const isSuperAdmin = currentRole === "super_admin";

  const loadUsers = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.adminUsers(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  React.useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter, sortKey]);

  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (statusFilter === "active" && user.isBlocked) {
        return false;
      }

      if (statusFilter === "blocked" && !user.isBlocked) {
        return false;
      }

      if (!q) {
        return true;
      }

      const name = String(user.name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const phone = String(user.phone || "").toLowerCase();

      return name.includes(q) || email.includes(q) || phone.includes(q);
    });

    return sortUsers(filtered, sortKey);
  }, [users, query, roleFilter, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const changeRole = async (userId, nextRole) => {
    if (!isSuperAdmin) {
      alert("Только супер-админ может менять роли");
      return;
    }

    try {
      const updated = await api.adminSetUserRole(token, userId, nextRole);
      setUsers((arr) =>
        arr.map((u) => (String(getId(u)) === String(userId) ? updated : u))
      );
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
      const updated = user.isBlocked
        ? await api.adminUnblockUser(token, userId)
        : await api.adminBlockUser(token, userId);

      setUsers((arr) =>
        arr.map((u) => (String(getId(u)) === String(userId) ? updated : u))
      );
    } catch (e) {
      alert(e.message || "Ошибка блокировки");
    }
  };

  const handleUserUpdated = (updated) => {
    if (!updated) return;
    setUsers((arr) =>
      arr.map((u) => (String(getId(u)) === String(getId(updated)) ? updated : u))
    );
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

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: имя, email, телефон"
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
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
            Показано: {pageUsers.length} из {filteredUsers.length} (всего {users.length})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Назад
            </button>
            <span>
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              Вперёд
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {pageUsers.length === 0 ? (
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
                  <th className="py-3 px-3">Роль</th>
                  <th className="py-3 px-3">Баланс</th>
                  <th className="py-3 px-3">Статус</th>
                  <th className="py-3 px-3">Дата</th>
                  <th className="py-3 px-3">Действия</th>
                </tr>
              </thead>

              <tbody>
                {pageUsers.map((user) => {
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
                        <div className="font-semibold">{user.name || "Без имени"}</div>
                        <div className="text-xs text-slate-500">
                          ID: {String(id).slice(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div>{user.email}</div>
                        <div className="text-xs text-slate-500">
                          {user.phone || "Телефон не указан"}
                        </div>
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
