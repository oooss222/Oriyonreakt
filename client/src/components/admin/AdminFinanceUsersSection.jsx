import React from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { getId, roleLabel, roleBadgeClass } from "../../lib/adminUtils";
import UserDetailModal from "./UserDetailModal";

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

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 space-y-4 animate-pulse">
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
      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-2">
              <Users className="w-4 h-4" />
              Кошельки пользователей
            </div>
            <p className="text-sm text-slate-500">
              Просмотр балансов и истории операций. Режим только для чтения.
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

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: имя, email, телефон"
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40 md:col-span-2"
          />

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
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Роль</th>
                  <th className="py-3 px-3">Баланс</th>
                  <th className="py-3 px-3">Статус</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const id = getId(user);
                  const role = user.role || "user";

                  return (
                    <tr
                      key={id}
                      className="border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedUserId(id)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold">{user.name || "Без имени"}</div>
                      </td>
                      <td className="py-3 px-3">{user.email}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${roleBadgeClass(
                            role
                          )}`}
                        >
                          {roleLabel(role)}
                        </span>
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
          readOnly
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}
