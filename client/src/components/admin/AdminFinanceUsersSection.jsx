import React from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { getId, roleLabel, roleBadgeClass } from "../../lib/adminUtils";
import { useI18n } from "../../i18n";
import UserDetailModal from "./UserDetailModal";

const PAGE_SIZE = 25;

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

  const SORT_OPTIONS = [
    { value: "balance_desc", label: t("admin.finance.users.sortBalanceDesc") },
    { value: "balance_asc", label: t("admin.finance.users.sortBalanceAsc") },
    { value: "created_desc", label: t("admin.finance.users.sortCreatedDesc") },
    { value: "name_asc", label: t("admin.finance.users.sortNameAsc") },
  ];

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
      setError(e.message || t("admin.finance.users.loadError"));
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
      <div className="admin-panel p-4 space-y-4 animate-pulse">
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
      <div className="admin-panel p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-2">
              <Users className="w-4 h-4" />
              {t("admin.finance.users.badge")}
            </div>
            <p className="text-sm text-ink-500">
              {t("admin.finance.users.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={refreshing}
            className="btn btn-secondary disabled:opacity-60"
          >
            {refreshing ? t("admin.common.refreshing") : t("admin.common.refresh")}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
            {error}
          </div>
        )}

        <div className="rounded-2xl border bg-mist-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.finance.users.searchPlaceholder")}
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-ink-500">
          <div>
            {t("admin.pagination.shownOf", { shown: users.length, total })}
            {query !== debouncedQuery ? t("admin.pagination.searchingSuffix") : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || refreshing}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              {t("admin.pagination.back")}
            </button>
            <span>
              {t("admin.pagination.pageOf", { page, totalPages })}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || refreshing}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border disabled:opacity-40"
            >
              {t("admin.pagination.next")}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border bg-mist-50 p-8 text-center text-ink-500">
            {t("admin.finance.users.empty")}
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr className="border-b text-left text-ink-500">
                  <th className="py-3 px-3">{t("admin.finance.col.user")}</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">{t("admin.finance.users.colRole")}</th>
                  <th className="py-3 px-3">{t("admin.finance.users.colBalance")}</th>
                  <th className="py-3 px-3">{t("admin.finance.col.status")}</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const id = getId(user);
                  const role = user.role || "user";

                  return (
                    <tr
                      key={id}
                      className="border-b last:border-b-0 hover:bg-mist-50 cursor-pointer"
                      onClick={() => setSelectedUserId(id)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold">{user.name || t("admin.finance.users.noName")}</div>
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
                            {t("admin.finance.users.blocked")}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t("admin.finance.users.active")}
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
