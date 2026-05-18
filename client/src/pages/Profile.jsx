import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, API_BASE } from "../lib/api";
import {
  User as UserIcon,
  LogOut,
  PlusCircle,
  Pencil,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  FolderHeart,
  Wallet,
  Users,
  Shield,
  ClipboardCheck,
  Ban,
  Unlock,
} from "lucide-react";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const ROLES = ["user", "moderator", "accountant", "admin", "super_admin"];

const normalizeTab = (value) => {
  if (value === "favorites") return "fav";
  if (
    ["fav", "profile", "wallet", "admin", "moderation", "my"].includes(value)
  ) {
    return value;
  }
  return "my";
};

const getId = (item) => item?.id || item?._id;

const getThumb = (ad) => {
  let src = "";

  if (ad?.images?.length) {
    const f = ad.images[0];
    src =
      typeof f === "string"
        ? f
        : f?.url || f?.src || f?.path || f?.secure_url || f?.preview || "";
  }

  if (!src) src = ad?.img || ad?.image || "/img/placeholder.jpg";

  if (src.startsWith("http") || src.startsWith("/img/")) return src;

  return API_BASE.replace("/api", "") + src;
};

const fmtPrice = (v) => {
  if (v == null || v === "") return "—";
  if (typeof v === "number") return `${v.toLocaleString("ru-RU")} TJS`;

  const n = Number(v);
  return Number.isFinite(n) ? `${n.toLocaleString("ru-RU")} TJS` : `${v}`;
};

const EmailBadge = React.memo(function EmailBadge({ status }) {
  if (status === "verified") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
        <CheckCircle2 size={14} />
        Верифицирован
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        <ShieldAlert size={14} />
        Письмо отправлено
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-50 text-slate-700 border inline-flex items-center gap-1">
      <ShieldCheck size={14} />
      Не подтверждён
    </span>
  );
});

const WalletTopUp = React.memo(function WalletTopUp({ token, onSuccess }) {
  const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

  const [amount, setAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const value = React.useMemo(() => {
    return Number(String(amount).replace(",", "."));
  }, [amount]);

  const isValid = Number.isFinite(value) && value > 0;

  const submit = React.useCallback(
    async (e) => {
      e.preventDefault();

      setError("");
      setSuccess("");

      if (!isValid) {
        setError("Введите корректную сумму");
        return;
      }

      if (value < 1) {
        setError("Минимальная сумма пополнения — 1 TJS");
        return;
      }

      if (value > 10000) {
        setError("Максимальная сумма пополнения — 10 000 TJS");
        return;
      }

      try {
        setLoading(true);

        const user = await api.topUpWallet(token, value);

        onSuccess?.(user, {
          amount: value,
          type: "top_up",
          createdAt: new Date().toISOString(),
        });

        setSuccess(`Баланс пополнен на ${value.toLocaleString("ru-RU")} TJS`);
        setAmount("");
      } catch (e) {
        setError(e.message || "Ошибка пополнения");
      } finally {
        setLoading(false);
      }
    },
    [token, value, isValid, onSuccess]
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Быстрый выбор суммы</div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_AMOUNTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setAmount(String(item));
                setError("");
                setSuccess("");
              }}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                Number(amount) === item
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {item} TJS
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="text-sm font-medium mb-1">Сумма пополнения</div>

        <div className="relative">
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.,]/g, ""));
              setError("");
              setSuccess("");
            }}
            placeholder="Например: 100"
            className="input w-full pr-14"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            TJS
          </span>
        </div>

        <div className="text-xs text-slate-500 mt-1">
          Минимум 1 TJS, максимум 10 000 TJS.
        </div>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 text-sm">
          {success}
        </div>
      )}

      <button
        disabled={loading || !isValid}
        className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Пополняем..." : "Пополнить баланс"}
      </button>
    </form>
  );
});

const ListingCard = React.memo(function ListingCard({
  ad,
  canManage,
  onRemove,
  compact = false,
}) {
  const id = getId(ad);
  const imgUrl = getThumb(ad);
  const more = Math.max(0, (ad.images?.length || 0) - 1);

  const status = ad.status || "pending";

  const statusMap = {
    pending: {
      label: "На модерации",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    approved: {
      label: "Опубликовано",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Отклонено",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const statusInfo = statusMap[status] || statusMap.pending;

  return (
    <div className="group rounded-3xl border bg-white p-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <Link
        to={`/ad/${id}`}
        onClick={() => sessionStorage.setItem("ad_preview", JSON.stringify(ad))}
        className="block"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={imgUrl}
            alt={ad.title || "Объявление"}
            className={`w-full object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-105 ${
              compact ? "h-36" : "h-44"
            }`}
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <span
              className={`inline-flex px-2 py-0.5 text-[11px] rounded-full border bg-white/90 backdrop-blur ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {more > 0 && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white rounded-full px-2 py-0.5">
              +{more}
            </span>
          )}
        </div>

        <div className="p-2">
          <div className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition">
            {ad.title || "Без названия"}
          </div>

          <div className="text-blue-700 font-extrabold mt-1">
            {fmtPrice(ad.price)}
          </div>

          <div className="text-xs text-slate-500 line-clamp-1 mt-1">
            {ad.location || ad.city || "Локация не указана"}
          </div>

          <div className="text-xs text-slate-400 mt-1">
            {ad.createdAt
              ? new Date(ad.createdAt).toLocaleDateString("ru-RU")
              : "Дата не указана"}
          </div>
        </div>
      </Link>

      {ad.rejectionReason && (
        <div className="mx-2 mb-2 rounded-xl border border-red-200 bg-red-50 text-red-700 p-2 text-xs">
          <b>Причина:</b> {ad.rejectionReason}
        </div>
      )}

      {canManage && (
        <div className="px-2 pb-2 flex flex-wrap items-center gap-2">
          <Link
            to={`/edit/${id}`}
            className="inline-flex flex-1 justify-center items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
          >
            <Pencil size={16} />
            Редактировать
          </Link>

          <button
            type="button"
            className="inline-flex justify-center items-center gap-1 px-3 py-2 rounded-xl border text-red-600 hover:bg-red-50 transition text-sm"
            onClick={() => onRemove(id)}
          >
            <Trash2 size={16} />
            Удалить
          </button>
        </div>
      )}
    </div>
  );
});

const ListingsGrid = React.memo(function ListingsGrid({
  items,
  tab,
  canManage,
  onRemove,
  compact = false,
}) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 grid place-items-center mb-3">
          <PlusCircle className="text-blue-600" size={26} />
        </div>

        <div className="text-slate-800 font-semibold mb-1">
          {tab === "fav" ? "В избранном пока пусто" : "Пока нет объявлений"}
        </div>

        <div className="text-sm text-slate-500 mb-4">
          {tab === "fav"
            ? "Добавляйте объявления в избранное, чтобы быстро вернуться к ним."
            : "Создайте первое объявление, и после модерации оно появится на сайте."}
        </div>

        {tab === "my" ? (
          <Link
            to="/add"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <PlusCircle size={18} />
            Подать объявление
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border hover:bg-slate-50 transition"
          >
            На главную
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        compact
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      }`}
    >
      {items.map((ad) => (
        <ListingCard
          key={getId(ad)}
          ad={ad}
          canManage={canManage}
          onRemove={onRemove}
          compact={compact}
        />
      ))}
    </div>
  );
});

const SkeletonGrid = React.memo(function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-2 animate-pulse">
          <div className="w-full h-40 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 bg-slate-200 rounded w-4/5 mb-1" />
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-1" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
});

function AdminPanel({ token, currentUser }) {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const currentRole = currentUser?.role || "user";
  const isSuperAdmin = currentRole === "super_admin";

  const roleLabel = (role) => {
    const labels = {
      user: "Пользователь",
      moderator: "Модератор",
      accountant: "Бухгалтер",
      admin: "Администратор",
      super_admin: "Супер-админ",
    };

    return labels[role] || role;
  };

  const roleBadgeClass = (role) => {
    if (role === "super_admin") return "bg-purple-50 text-purple-700 border-purple-200";
    if (role === "admin") return "bg-blue-50 text-blue-700 border-blue-200";
    if (role === "moderator") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (role === "accountant") return "bg-amber-50 text-amber-700 border-amber-200";

    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const canManageUser = React.useCallback(
    (targetUser) => {
      if (!targetUser || !currentUser) return false;

      const targetRole = targetUser.role || "user";

      if (String(getId(targetUser)) === String(getId(currentUser))) {
        return false;
      }

      if (isSuperAdmin) {
        return true;
      }

      if (currentRole === "admin") {
        return ["user", "moderator"].includes(targetRole);
      }

      return false;
    },
    [currentUser, currentRole, isSuperAdmin]
  );

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
    let alive = true;

    setLoading(true);
    setError("");

    api
      .adminUsers(token)
      .then((data) => {
        if (alive) {
          setUsers(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message || "Ошибка загрузки пользователей");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [token]);

  const stats = React.useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const role = user.role || "user";

        acc.total += 1;

        if (user.isBlocked) {
          acc.blocked += 1;
        } else {
          acc.active += 1;
        }

        acc.roles[role] = (acc.roles[role] || 0) + 1;

        return acc;
      },
      {
        total: 0,
        active: 0,
        blocked: 0,
        roles: {},
      }
    );
  }, [users]);

  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return users
      .filter((user) => {
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
      })
      .slice(0, 200);
  }, [users, query, roleFilter, statusFilter]);

  const changeRole = React.useCallback(
    async (userId, nextRole) => {
      if (!isSuperAdmin) {
        alert("Только супер-админ может менять роли");
        return;
      }

      try {
        const current = users.find((u) => String(getId(u)) === String(userId));

        if (current?.role === "super_admin" && nextRole !== "super_admin") {
          const ok = confirm("Вы меняете роль супер-админа. Продолжить?");
          if (!ok) return;
        }

        const updated = await api.adminSetUserRole(token, userId, nextRole);

        setUsers((arr) =>
          arr.map((u) => (String(getId(u)) === String(userId) ? updated : u))
        );
      } catch (e) {
        alert(e.message || "Ошибка изменения роли");
      }
    },
    [token, users, isSuperAdmin]
  );

  const toggleBlock = React.useCallback(
    async (user) => {
      if (!canManageUser(user)) {
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
    },
    [token, canManageUser]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5">
        Загрузка пользователей...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
            <Shield className="w-4 h-4" />
            {isSuperAdmin ? "Панель супер-админа" : "Панель администратора"}
          </div>

          <h2 className="text-xl font-bold">Управление пользователями</h2>

          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin
              ? "Полный доступ к ролям, блокировкам и пользователям."
              : "Администратор может управлять только пользователями и модераторами."}
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-xs text-slate-500">Всего</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="rounded-2xl border bg-emerald-50 p-4">
          <div className="text-xs text-emerald-700">Активные</div>
          <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
        </div>

        <div className="rounded-2xl border bg-red-50 p-4">
          <div className="text-xs text-red-700">Заблокированы</div>
          <div className="text-2xl font-bold text-red-700">{stats.blocked}</div>
        </div>

        <div className="rounded-2xl border bg-purple-50 p-4">
          <div className="text-xs text-purple-700">Супер-админы</div>
          <div className="text-2xl font-bold text-purple-700">
            {stats.roles.super_admin || 0}
          </div>
        </div>

        <div className="rounded-2xl border bg-indigo-50 p-4">
          <div className="text-xs text-indigo-700">Модераторы</div>
          <div className="text-2xl font-bold text-indigo-700">
            {stats.roles.moderator || 0}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: имя, email, телефон"
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
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
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="blocked">Заблокированные</option>
        </select>
      </div>

      <div className="text-sm text-slate-500">
        Показано: {filteredUsers.length} из {users.length}
      </div>

      {filteredUsers.length === 0 ? (
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
              {filteredUsers.map((user) => {
                const id = getId(user);
                const role = user.role || "user";
                const manageable = canManageUser(user);

                return (
                  <tr key={id} className="border-b last:border-b-0 hover:bg-slate-50">
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

                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex w-max px-2 py-0.5 text-xs rounded-full border ${roleBadgeClass(role)}`}
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
                        ) : (
                          <div className="text-xs text-slate-400">
                            Изменение роли недоступно
                          </div>
                        )}
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

                    <td className="py-3 px-3">
                      <button
                        type="button"
                        disabled={!manageable}
                        onClick={() => toggleBlock(user)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          user.isBlocked
                            ? "hover:bg-emerald-50 text-emerald-700"
                            : "hover:bg-red-50 text-red-700"
                        }`}
                        title={
                          manageable
                            ? ""
                            : "Недостаточно прав для управления этим пользователем"
                        }
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
  );
}

function ModerationPanel({ token }) {
  const [items, setItems] = React.useState([]);
  const [status, setStatus] = React.useState("pending");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [rejectTarget, setRejectTarget] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [actionLoadingId, setActionLoadingId] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await api.moderationListings(token, status);

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Ошибка загрузки модерации");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, status]);

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    api
      .moderationListings(token, status)
      .then((data) => {
        if (alive) {
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message || "Ошибка загрузки модерации");
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [token, status]);

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return items;

    return items.filter((ad) => {
      const title = String(ad.title || "").toLowerCase();
      const description = String(ad.description || "").toLowerCase();
      const location = String(ad.location || "").toLowerCase();
      const cat = String(ad.cat || "").toLowerCase();
      const subcategory = String(ad.subcategory || "").toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        location.includes(q) ||
        cat.includes(q) ||
        subcategory.includes(q)
      );
    });
  }, [items, query]);

  const stats = React.useMemo(() => {
    return {
      loaded: items.length,
      filtered: filteredItems.length,
      withImages: items.filter((ad) => ad?.images?.length).length,
      withoutImages: items.filter((ad) => !ad?.images?.length).length,
    };
  }, [items, filteredItems]);

  const approve = React.useCallback(
    async (id) => {
      const ok = confirm("Принять это объявление и опубликовать его?");
      if (!ok) return;

      try {
        setActionLoadingId(id);

        await api.moderationApproveListing(token, id);

        setItems((arr) =>
          arr.filter((item) => String(getId(item)) !== String(id))
        );
      } catch (e) {
        alert(e.message || "Ошибка принятия объявления");
      } finally {
        setActionLoadingId("");
      }
    },
    [token]
  );

  const openReject = React.useCallback((ad) => {
    setRejectTarget(ad);
    setRejectReason("");
  }, []);

  const closeReject = React.useCallback(() => {
    setRejectTarget(null);
    setRejectReason("");
  }, []);

  const submitReject = React.useCallback(async () => {
    if (!rejectTarget) return;

    const id = getId(rejectTarget);
    const reason = rejectReason.trim();

    if (reason.length < 5) {
      alert("Причина должна быть не короче 5 символов");
      return;
    }

    try {
      setActionLoadingId(id);

      await api.moderationRejectListing(token, id, reason);

      setItems((arr) =>
        arr.filter((item) => String(getId(item)) !== String(id))
      );

      closeReject();
    } catch (e) {
      alert(e.message || "Ошибка отклонения объявления");
    } finally {
      setActionLoadingId("");
    }
  }, [token, rejectTarget, rejectReason, closeReject]);

  const statusLabel = {
    pending: "На проверке",
    approved: "Принятые",
    rejected: "Отклонённые",
  };

  const statusBadgeClass = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5">
        Загрузка объявлений...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
            <ClipboardCheck className="w-4 h-4" />
            Панель модератора
          </div>

          <h2 className="text-xl font-bold">Модерация объявлений</h2>

          <p className="text-sm text-slate-500 mt-1">
            Проверка, публикация и отклонение объявлений пользователей.
          </p>
        </div>

        <button
          onClick={load}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatus("pending")}
          className={`text-left rounded-2xl border p-4 transition ${
            status === "pending"
              ? "bg-amber-50 border-amber-200"
              : "bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <div className="text-xs text-slate-500">Текущий раздел</div>
          <div className="text-lg font-bold">На проверке</div>
        </button>

        <button
          type="button"
          onClick={() => setStatus("approved")}
          className={`text-left rounded-2xl border p-4 transition ${
            status === "approved"
              ? "bg-emerald-50 border-emerald-200"
              : "bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <div className="text-xs text-slate-500">Текущий раздел</div>
          <div className="text-lg font-bold">Принятые</div>
        </button>

        <button
          type="button"
          onClick={() => setStatus("rejected")}
          className={`text-left rounded-2xl border p-4 transition ${
            status === "rejected"
              ? "bg-red-50 border-red-200"
              : "bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <div className="text-xs text-slate-500">Текущий раздел</div>
          <div className="text-lg font-bold">Отклонённые</div>
        </button>

        <div className="rounded-2xl border bg-blue-50 p-4">
          <div className="text-xs text-blue-700">Показано</div>
          <div className="text-2xl font-bold text-blue-700">
            {stats.filtered}
          </div>
          <div className="text-xs text-blue-700">
            из {stats.loaded}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: название, описание, город, категория"
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending">На проверке</option>
          <option value="approved">Принятые</option>
          <option value="rejected">Отклонённые</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-slate-500">С фото</div>
          <div className="font-bold">{stats.withImages}</div>
        </div>

        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-slate-500">Без фото</div>
          <div className="font-bold">{stats.withoutImages}</div>
        </div>

        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="text-slate-500">Статус</div>
          <div
            className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full border ${
              statusBadgeClass[status]
            }`}
          >
            {statusLabel[status]}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border bg-slate-50 p-8 text-center text-slate-500">
          Объявления не найдены.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((ad) => {
            const id = getId(ad);
            const img = getThumb(ad);
            const isBusy = actionLoadingId === id;

            return (
              <article
                key={id}
                className="rounded-2xl border bg-white p-3 md:p-4 grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-4 hover:shadow-md transition"
              >
                <Link
                  to={`/ad/${id}`}
                  onClick={() =>
                    sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                  }
                  className="block"
                >
                  <img
                    src={img}
                    alt={ad.title || "Объявление"}
                    className="w-full md:w-40 h-36 md:h-28 rounded-xl object-cover bg-slate-100"
                    loading="lazy"
                  />
                </Link>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${
                        statusBadgeClass[ad.status || status]
                      }`}
                    >
                      {statusLabel[ad.status || status] || ad.status}
                    </span>

                    <span className="text-xs text-slate-500">
                      ID: {String(id).slice(0, 8)}...
                    </span>
                  </div>

                  <Link
                    to={`/ad/${id}`}
                    onClick={() =>
                      sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                    }
                    className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-2"
                  >
                    {ad.title || "Без названия"}
                  </Link>

                  <div className="text-sm text-slate-500 mt-1">
                    {ad.location || "Локация не указана"} · {ad.cat || "—"}
                    {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                  </div>

                  <div className="text-sm font-bold mt-1">
                    {fmtPrice(ad.price)}
                  </div>

                  {ad.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                      {ad.description}
                    </p>
                  )}

                  {ad.rejectionReason && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
                      <b>Причина отклонения:</b> {ad.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2 md:min-w-36">
                  <Link
                    to={`/ad/${id}`}
                    onClick={() =>
                      sessionStorage.setItem("ad_preview", JSON.stringify(ad))
                    }
                    className="inline-flex justify-center px-3 py-2 rounded-lg border hover:bg-slate-50"
                  >
                    Открыть
                  </Link>

                  {status === "pending" && (
                    <>
                      <button
                        onClick={() => approve(id)}
                        disabled={isBusy}
                        className="inline-flex justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {isBusy ? "..." : "Принять"}
                      </button>

                      <button
                        onClick={() => openReject(ad)}
                        disabled={isBusy}
                        className="inline-flex justify-center px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        Отклонить
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border p-5 space-y-4">
            <div>
              <h3 className="text-lg font-bold">Отклонить объявление</h3>
              <p className="text-sm text-slate-500 mt-1">
                Укажите понятную причину, чтобы пользователь мог исправить объявление.
              </p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-3">
              <div className="text-sm font-semibold">
                {rejectTarget.title || "Без названия"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ID: {String(getId(rejectTarget)).slice(0, 8)}...
              </div>
            </div>

            <label className="block">
              <div className="text-sm font-medium mb-1">
                Причина отклонения
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                placeholder="Например: недостаточно информации, запрещённый товар, некорректная категория..."
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </label>

            <div className="text-xs text-slate-500">
              Минимум 5 символов. Сейчас: {rejectReason.trim().length}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReject}
                className="px-4 py-2 rounded-xl border hover:bg-slate-50"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={submitReject}
                disabled={
                  rejectReason.trim().length < 5 ||
                  actionLoadingId === getId(rejectTarget)
                }
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoadingId === getId(rejectTarget)
                  ? "Отклоняем..."
                  : "Отклонить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyListingsPanel({ items, loading, canManage, onRemove }) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");

  const stats = React.useMemo(() => {
    return items.reduce(
      (acc, ad) => {
        const status = ad.status || "pending";

        acc.total += 1;
        acc[status] = (acc[status] || 0) + 1;

        return acc;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((ad) => {
      const status = ad.status || "pending";

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (!q) return true;

      const title = String(ad.title || "").toLowerCase();
      const description = String(ad.description || "").toLowerCase();
      const location = String(ad.location || ad.city || "").toLowerCase();
      const cat = String(ad.cat || "").toLowerCase();
      const subcategory = String(ad.subcategory || "").toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        location.includes(q) ||
        cat.includes(q) ||
        subcategory.includes(q)
      );
    });
  }, [items, query, statusFilter]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
              <PlusCircle size={16} />
              Личный кабинет
            </div>

            <h2 className="text-2xl font-bold">Мои объявления</h2>

            <p className="text-sm text-slate-500 mt-1">
              Управляйте объявлениями, отслеживайте модерацию и статус публикации.
            </p>
          </div>

          <Link
            to="/add"
            className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <PlusCircle size={18} />
            Подать объявление
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "all"
                ? "bg-blue-50 border-blue-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-slate-500">Всего</div>
            <div className="text-2xl font-extrabold">{stats.total}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "approved"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-emerald-700">Опубликовано</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {stats.approved}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "pending"
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-amber-700">На модерации</div>
            <div className="text-2xl font-extrabold text-amber-700">
              {stats.pending}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-red-700">Отклонено</div>
            <div className="text-2xl font-extrabold text-red-700">
              {stats.rejected}
            </div>
          </button>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, категории или городу"
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="approved">Опубликованные</option>
            <option value="pending">На модерации</option>
            <option value="rejected">Отклонённые</option>
          </select>

          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="grid">Сетка</option>
            <option value="compact">Компактно</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <div>
            Показано:{" "}
            <span className="font-medium text-slate-800">
              {filtered.length}
            </span>{" "}
            из{" "}
            <span className="font-medium text-slate-800">
              {items.length}
            </span>
          </div>

          {!canManage && (
            <div className="rounded-full bg-slate-100 border px-3 py-1">
              Редактирование доступно только модератору, администратору и супер-админу
            </div>
          )}
        </div>
      </div>

      <ListingsGrid
        items={filtered}
        tab="my"
        canManage={canManage}
        onRemove={onRemove}
        compact={view === "compact"}
      />
    </div>
  );
}

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [tab, setTabState] = React.useState(() =>
    normalizeTab(searchParams.get("tab"))
  );

  const [me, setMe] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });

  const [form, setForm] = React.useState({
    name: me?.name || "",
    email: me?.email || "",
    phone: me?.phone || "",
    whatsapp: me?.whatsapp || "",
    telegram: me?.telegram || "",
  });

  const [emailStatus, setEmailStatus] = React.useState(
    me?.emailVerified ? "verified" : "unknown"
  );

  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [myItems, setMyItems] = React.useState([]);
  const [favItems, setFavItems] = React.useState([]);
  const [loadingMy, setLoadingMy] = React.useState(false);
  const [loadingFav, setLoadingFav] = React.useState(false);
  const [walletHistory, setWalletHistory] = React.useState([]);

  const meRef = React.useRef(me);
  const firstProfileSave = React.useRef(true);

  React.useEffect(() => {
    meRef.current = me;
  }, [me]);

  const setTab = React.useCallback(
    (nextTab) => {
      setTabState(nextTab);
      setSearchParams({ tab: nextTab });
    },
    [setSearchParams]
  );

  React.useEffect(() => {
    const next = normalizeTab(searchParams.get("tab"));
    setTabState((current) => (current === next ? current : next));
  }, [searchParams]);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    api
      .me(token)
      .then((u) => {
        if (!alive || !u) return;

        setMe(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          whatsapp: u.whatsapp || "",
          telegram: u.telegram || "",
        });
        setEmailStatus(u.emailVerified ? "verified" : "unknown");
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token) return;

    if (firstProfileSave.current) {
      firstProfileSave.current = false;
      return;
    }

    const currentMe = meRef.current;
    if (!currentMe) return;

    const oldName = currentMe.name || "";
    const oldPhone = currentMe.phone || "";

    if (form.name === oldName && form.phone === oldPhone) return;

    const h = setTimeout(() => {
      api
        .updateMe(token, {
          name: form.name,
          phone: form.phone,
          whatsapp: form.whatsapp,
          telegram: form.telegram,
        })
        .then((u) => {
          if (!u) return;
          setMe(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {});
    }, 900);

    return () => clearTimeout(h);
  }, [form.name, form.phone, token]);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    api
      .getVerification(token)
      .then((res) => {
        if (!alive) return;

        if (res?.emailVerified) setEmailStatus("verified");
        else if (res?.pending) setEmailStatus("pending");
        else setEmailStatus("unknown");
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    if (tab === "my") {
      setLoadingMy(true);

      api
        .myListings(token)
        .then((items) => {
          if (alive) setMyItems(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          if (alive) setMyItems([]);
        })
        .finally(() => {
          if (alive) setLoadingMy(false);
        });
    }

    if (tab === "fav") {
      setLoadingFav(true);

      api
        .favorites(token)
        .then((items) => {
          if (alive) setFavItems(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          if (alive) setFavItems([]);
        })
        .finally(() => {
          if (alive) setLoadingFav(false);
        });
    }

    return () => {
      alive = false;
    };
  }, [tab, token]);

  const remove = React.useCallback(
    async (id) => {
      if (!confirm("Удалить объявление?")) return;

      try {
        await api.deleteListing(token, id);
        setMyItems((arr) =>
          arr.filter((x) => String(getId(x)) !== String(id))
        );
      } catch {}
    },
    [token]
  );

  const logout = React.useCallback(() => {
    if (!confirm("Выйти из аккаунта?")) return;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    window.location.href = "/auth";
  }, []);

  const requestVerifyEmail = React.useCallback(async () => {
    try {
      setSendingEmail(true);
      await api.requestEmailVerification(token);
      setEmailStatus("pending");
      alert("Письмо для подтверждения отправлено. Проверьте почту!");
    } catch (e) {
      alert("Ошибка: " + (e?.message || "не удалось отправить письмо"));
    } finally {
      setSendingEmail(false);
    }
  }, [token]);

  const onWalletSuccess = React.useCallback((user, operation) => {
  setMe(user);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (operation) {
    setWalletHistory((arr) => [operation, ...arr].slice(0, 5));
  }
}, []);

  const walletBalance = Number(me?.walletBalance || 0);
  const role = me?.role || "user";

  const canOpenAdmin = role === "admin" || role === "super_admin";
  const canOpenModeration =
    role === "moderator" || role === "admin" || role === "super_admin";
    const canEditListings =
  role === "moderator" || role === "admin" || role === "super_admin";

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="text-slate-600">Вы не авторизованы.</p>
          <Link to="/auth" className="btn btn-primary">
            Войти / Зарегистрироваться
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl border bg-white p-4 md:p-5 flex items-center gap-4">
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-slate-100 to-white border grid place-items-center overflow-hidden">
          <UserIcon className="text-slate-500" size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
              <ShieldCheck size={14} />
              Личный кабинет
            </span>

            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {role}
            </span>

            <EmailBadge status={emailStatus} />
          </div>

          <h1 className="text-2xl font-bold leading-tight truncate">
            {me?.name || "Без имени"}
          </h1>

          <div className="text-slate-600 text-sm flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            {me?.email && (
              <span className="inline-flex items-center gap-1">
                <Mail size={16} className="text-slate-400" />
                {me.email}
              </span>
            )}

            {me?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={16} className="text-slate-400" />
                {me.phone}
              </span>
            )}

            <span className="inline-flex items-center gap-1">
              <Wallet size={16} className="text-slate-400" />
              Баланс: {walletBalance.toLocaleString("ru-RU")} TJS
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/add"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            <PlusCircle size={18} />
            Добавить
          </Link>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50 transition"
            onClick={logout}
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-2">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
            <UserIcon size={18} />
            Профиль
          </TabButton>

          <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")}>
            <Wallet size={18} />
            Кошелёк
          </TabButton>

          {canOpenAdmin && (
            <TabButton active={tab === "admin"} onClick={() => setTab("admin")}>
              <Shield size={18} />
              Админка
            </TabButton>
          )}

          {canOpenModeration && (
            <TabButton
              active={tab === "moderation"}
              onClick={() => setTab("moderation")}
            >
              <ClipboardCheck size={18} />
              Модерация
            </TabButton>
          )}

          <TabButton active={tab === "my"} onClick={() => setTab("my")}>
            Мои объявления
            <span className="ml-1 rounded-full border px-2 py-0.5 text-xs bg-white text-slate-700">
              {myItems.length}
            </span>
          </TabButton>

          <TabButton active={tab === "fav"} onClick={() => setTab("fav")}>
            <FolderHeart size={18} />
            Избранное
            <span className="ml-1 rounded-full border px-2 py-0.5 text-xs bg-white text-slate-700">
              {favItems.length}
            </span>
          </TabButton>
        </div>
      </div>

      {tab === "admin" && canOpenAdmin && (
        <AdminPanel
        token={token}
        currentUser={me}
        />
      )}

      {tab === "moderation" && canOpenModeration && (
        <ModerationPanel token={token} />
      )}

     {tab === "wallet" && (
  <div className="space-y-6">
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
            <Wallet className="w-4 h-4" />
            Финансы
          </div>

          <h2 className="text-xl font-bold">Кошелёк</h2>

          <p className="text-sm text-slate-500 mt-1">
            Баланс используется для платных услуг и продвижения объявлений.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-sm overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute right-10 bottom-6 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative">
            <div className="text-sm text-blue-100">Текущий баланс</div>

            <div className="text-4xl font-extrabold mt-2">
              {walletBalance.toLocaleString("ru-RU")} TJS
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">
                Аккаунт: {me?.email || "—"}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1">
                Роль: {role}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-slate-50 p-5 space-y-3">
          <div className="text-sm text-slate-500">Статус кошелька</div>

          <div className="text-lg font-bold text-emerald-700">
            Активен
          </div>

          <div className="text-sm text-slate-600">
            Пополнения сейчас выполняются в тестовом режиме через внутренний API.
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border bg-white p-4 md:p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Пополнить баланс</h3>
          <p className="text-sm text-slate-500 mt-1">
            Выберите сумму или введите свою.
          </p>
        </div>

        <WalletTopUp token={token} onSuccess={onWalletSuccess} />
      </div>

      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
        <h3 className="text-lg font-semibold">Информация</h3>

        <div className="space-y-3 text-sm text-slate-600">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Платные услуги</div>
            <div className="mt-1">
              Баланс можно использовать для VIP, TOP и продвижения объявлений.
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Безопасность</div>
            <div className="mt-1">
              Никому не передавайте данные аккаунта. Операции выполняются только после авторизации.
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Валюта</div>
            <div className="mt-1">
              Все суммы отображаются в TJS.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Последние операции</h3>

        <span className="text-sm text-slate-500">
          Локальная история текущей сессии
        </span>
      </div>

      {walletHistory.length === 0 ? (
        <div className="rounded-xl border bg-slate-50 p-5 text-center text-slate-500">
          Операций пока нет.
        </div>
      ) : (
        <div className="space-y-2">
          {walletHistory.map((operation, index) => (
            <div
              key={`${operation.createdAt}-${index}`}
              className="rounded-xl border p-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium">
                  Пополнение баланса
                </div>

                <div className="text-xs text-slate-500">
                  {new Date(operation.createdAt).toLocaleString("ru-RU")}
                </div>
              </div>

              <div className="font-bold text-emerald-700">
                +{Number(operation.amount || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

     {tab === "profile" && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-5">
        <div className="rounded-3xl border bg-white overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-14 flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-28 h-28 rounded-3xl border-4 border-white bg-white shadow-lg overflow-hidden grid place-items-center">
                <UserIcon size={42} className="text-slate-400" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {me?.name || "Без имени"}
                  </h2>

                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {role}
                  </span>

                  <EmailBadge status={emailStatus} />
                </div>

                <div className="text-sm text-slate-500 mt-2 flex flex-wrap gap-4">
                  <div className="inline-flex items-center gap-1">
                    <Mail size={15} />
                    {me?.email || "Email не указан"}
                  </div>

                  <div className="inline-flex items-center gap-1">
                    <Phone size={15} />
                    {me?.phone || "Телефон не указан"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Объявлений
                </div>

                <div className="text-2xl font-bold mt-1">
                  {myItems.length}
                </div>
              </div>

              <div className="rounded-2xl border bg-emerald-50 p-4">
                <div className="text-xs text-emerald-700">
                  Избранное
                </div>

                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  {favItems.length}
                </div>
              </div>

              <div className="rounded-2xl border bg-blue-50 p-4">
                <div className="text-xs text-blue-700">
                  Баланс
                </div>

                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {walletBalance.toLocaleString("ru-RU")} TJS
                </div>
              </div>

              <div className="rounded-2xl border bg-purple-50 p-4">
                <div className="text-xs text-purple-700">
                  Статус
                </div>

                <div className="text-lg font-bold text-purple-700 mt-1">
                  {emailStatus === "verified"
                    ? "Подтверждён"
                    : "Ожидает"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Настройки профиля
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Информация обновляется автоматически.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              <CheckCircle2 size={16} />
              Автосохранение
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium mb-2">
                Имя пользователя
              </div>

              <input
                className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    name: e.target.value,
                  }))
                }
                placeholder="Введите имя"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-2">
                Email
              </div>

              <input
                className="h-12 rounded-2xl border px-4 w-full bg-slate-50"
                type="email"
                value={form.email}
                readOnly
              />
            </label>

            <label className="block md:col-span-2">
              <div className="text-sm font-medium mb-2">
                Телефон
              </div>

              <input
  className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="+992 ..."
  value={form.phone}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      phone: e.target.value,
    }))
  }
/>


                
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <label className="block">
    <div className="text-sm font-medium mb-1">
      WhatsApp
    </div>

    <input
      value={form.whatsapp}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          whatsapp: e.target.value,
        }))
      }
      placeholder="992900000000"
      className="input w-full"
    />

    <div className="text-xs text-slate-500 mt-1">
      Только номер без + и пробелов
    </div>
  </label>

  <label className="block">
    <div className="text-sm font-medium mb-1">
      Telegram
    </div>

    <input
      value={form.telegram}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          telegram: e.target.value,
        }))
      }
      placeholder="@username"
      className="input w-full"
    />

    <div className="text-xs text-slate-500 mt-1">
      username или ссылка t.me
    </div>
  </label>
</div>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">
                Безопасность аккаунта
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Подтверждение электронной почты и защита аккаунта.
              </p>
            </div>

            <EmailBadge status={emailStatus} />
          </div>

          {emailStatus === "verified" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center">
                <ShieldCheck className="text-emerald-600" />
              </div>

              <div>
                <div className="font-semibold text-emerald-700">
                  Почта подтверждена
                </div>

                <div className="text-sm text-emerald-600">
                  Ваш аккаунт успешно защищён.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center border">
                  <Mail className="text-blue-600" />
                </div>

                <div className="flex-1">
                  <div className="font-semibold">
                    Подтвердите адрес электронной почты
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    После подтверждения аккаунт станет более защищённым.
                  </p>

                  <button
                    onClick={requestVerifyEmail}
                    disabled={
                      sendingEmail ||
                      emailStatus === "pending"
                    }
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    <Mail size={18} />

                    {emailStatus === "pending"
                      ? "Письмо отправлено"
                      : sendingEmail
                      ? "Отправляем..."
                      : "Отправить письмо"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border bg-white p-5">
          <h3 className="font-bold text-lg mb-4">
            Активность аккаунта
          </h3>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Мои объявления
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Управление публикациями
                </div>
              </div>

              <div className="text-xl font-bold">
                {myItems.length}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Избранные товары
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Сохранённые объявления
                </div>
              </div>

              <div className="text-xl font-bold">
                {favItems.length}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Статус аккаунта
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Текущая роль
                </div>
              </div>

              <div className="text-sm font-bold text-blue-700 uppercase">
                {role}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-5 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/10" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 text-sm bg-white/10 border border-white/20 rounded-full px-3 py-1">
              <ShieldCheck size={15} />
              Oriyon Security
            </div>

            <h3 className="text-xl font-bold mt-4">
              Безопасный аккаунт
            </h3>

            <p className="text-sm text-blue-100 mt-2">
              Все объявления проходят модерацию для защиты пользователей.
            </p>

            <Link
              to="/add"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition"
            >
              <PlusCircle size={18} />
              Подать объявление
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {tab === "my" && (
  <MyListingsPanel
    items={myItems}
    loading={loadingMy}
    canManage={canEditListings}
    onRemove={remove}
  />
)}

      {tab === "fav" && (
        <div className="rounded-2xl border bg-white p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Избранное</h2>
            <div className="text-sm text-slate-500">Всего: {favItems.length}</div>
          </div>

          {loadingFav ? (
            <SkeletonGrid />
          ) : (
            <ListingsGrid
              items={favItems}
              tab={tab}
              canManage={false}
              onRemove={remove}
            />
          )}
        </div>
      )}
    </div>
  );
}

const TabButton = React.memo(function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "hover:bg-slate-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
});