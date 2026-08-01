import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ExternalLink,
  Ban,
  Unlock,
  Mail,
  Phone,
  Clock,
  Wallet,
  BadgeCheck,
  Building2,
} from "lucide-react";
import { api } from "../../lib/api";
import {
  ROLES,
  WALLET_TYPE_LABELS,
  getId,
  roleLabel,
  roleBadgeClass,
  canManageUser,
} from "../../lib/adminUtils";

export default function UserDetailModal({
  token,
  userId,
  currentUser,
  readOnly = false,
  onClose,
  onUserUpdated,
}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [detail, setDetail] = React.useState(null);
  const [adjustAmount, setAdjustAmount] = React.useState("");
  const [adjustDescription, setAdjustDescription] = React.useState("");
  const [adjustLoading, setAdjustLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const isSuperAdmin = (currentUser?.role || "user") === "super_admin";

  const load = React.useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      const data = await api.adminGetUser(token, userId);
      setDetail(data);
    } catch (e) {
      setError(e.message || "Не удалось загрузить пользователя");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const user = detail?.user;
  const listings = detail?.listings || {};
  const transactions = detail?.transactions || [];
  const manageable = user ? canManageUser(currentUser, user) : false;

  const changeRole = async (nextRole) => {
    if (!isSuperAdmin || !user) return;

    try {
      setActionLoading(true);
      const updated = await api.adminSetUserRole(token, getId(user), nextRole);
      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
    } catch (e) {
      alert(e.message || "Ошибка изменения роли");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (!user || !manageable) return;

    const action = user.isBlocked ? "разблокировать" : "заблокировать";
    const ok = confirm(`Вы действительно хотите ${action} пользователя ${user.email}?`);
    if (!ok) return;

    try {
      setActionLoading(true);
      const updated = user.isBlocked
        ? await api.adminUnblockUser(token, getId(user))
        : await api.adminBlockUser(token, getId(user));

      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
    } catch (e) {
      alert(e.message || "Ошибка блокировки");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBusinessVerify = async () => {
    if (!user || user.sellerType !== "company" || readOnly) return;

    const nextVerified = !user.businessVerified;
    const action = nextVerified ? "верифицировать" : "снять верификацию";

    const ok = confirm(
      `${action.charAt(0).toUpperCase()}${action.slice(1)} компанию «${user.companyName || user.name}»?`
    );

    if (!ok) return;

    try {
      setActionLoading(true);
      const updated = await api.adminVerifyBusiness(
        token,
        getId(user),
        nextVerified
      );

      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
    } catch (e) {
      alert(e.message || "Ошибка верификации");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBusinessAccount = async () => {
    if (!user || readOnly) return;

    if (user.sellerType === "company") {
      const ok = confirm(
        `Отключить премиум-аккаунт у «${user.companyName || user.name}»? Пользователь станет частным лицом.`
      );
      if (!ok) return;

      try {
        setActionLoading(true);
        const updated = await api.adminSetBusinessAccount(token, getId(user), {
          sellerType: "private",
        });
        setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
        onUserUpdated?.(updated);
      } catch (e) {
        alert(e.message || "Не удалось отключить премиум-аккаунт");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const companyName = prompt(
      "Название компании для премиум-аккаунта:",
      user.companyName || user.name || ""
    );

    if (companyName === null) return;

    if (!String(companyName).trim()) {
      alert("Укажите название компании");
      return;
    }

    try {
      setActionLoading(true);
      const updated = await api.adminSetBusinessAccount(token, getId(user), {
        sellerType: "company",
        companyName: String(companyName).trim(),
      });
      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
    } catch (e) {
      alert(e.message || "Не удалось подключить премиум-аккаунт");
    } finally {
      setActionLoading(false);
    }
  };

  const adjustWallet = async (sign) => {
    if (!isSuperAdmin || !user) return;

    const value = Number(String(adjustAmount).replace(",", "."));

    if (!Number.isFinite(value) || value <= 0) {
      alert("Введите корректную сумму");
      return;
    }

    const amount = sign * value;

    try {
      setAdjustLoading(true);
      const result = await api.adminAdjustUserWallet(
        token,
        getId(user),
        amount,
        adjustDescription.trim()
      );

      setDetail((prev) => ({
        ...prev,
        user: { ...prev.user, ...result.user },
        transactions: result.transactions,
      }));
      onUserUpdated?.(result.user);
      setAdjustAmount("");
      setAdjustDescription("");
    } catch (e) {
      alert(e.message || "Не удалось изменить баланс");
    } finally {
      setAdjustLoading(false);
    }
  };

  const listingStatusLabel = {
    approved: "Опубликованы",
    pending: "На модерации",
    rejected: "Отклонены",
    sold: "Продано",
    archived: "Сняты",
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full md:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-2xl bg-white shadow-xl border">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-4 md:px-5 py-4">
          <div>
            <h3 className="text-lg font-bold">Карточка пользователя</h3>
            <p className="text-sm text-slate-500">
              {readOnly
                ? "Просмотр баланса и истории операций"
                : "Подробная информация и управление"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border hover:bg-slate-50"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-5">
          {loading && (
            <div className="text-sm text-slate-500 animate-pulse">Загрузка...</div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
              {error}
            </div>
          )}

          {!loading && user && (
            <>
              <div className="rounded-2xl border bg-slate-50 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold">{user.name || "Без имени"}</div>
                    <div className="text-sm text-slate-500 mt-1">ID: {getId(user)}</div>
                  </div>

                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${roleBadgeClass(
                      user.role
                    )}`}
                  >
                    {roleLabel(user.role)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    {user.phone || "Телефон не указан"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Регистрация:{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString("ru-RU")
                      : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Был онлайн:{" "}
                    {user.lastSeen
                      ? new Date(user.lastSeen).toLocaleString("ru-RU")
                      : "—"}
                  </div>
                  {user.sellerType === "company" && (
                    <div className="rounded-xl border bg-blue-50 p-3 text-sm space-y-1">
                      <div className="inline-flex items-center gap-1 font-semibold text-blue-800">
                        <Building2 size={15} />
                        {user.companyName || "Премиум"}
                      </div>
                      {user.companyDescription && (
                        <p className="text-slate-600">{user.companyDescription}</p>
                      )}
                      <div className="text-xs text-slate-500">
                        {user.businessVerified
                          ? "Проверенный премиум"
                          : "Ожидает верификации"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/seller/${getId(user)}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-white text-sm"
                  >
                    <ExternalLink size={16} />
                    Публичная страница
                  </Link>

                  {!readOnly && (
                    <button
                      type="button"
                      disabled={!manageable || actionLoading}
                      onClick={toggleBlock}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40 ${
                        user.isBlocked
                          ? "hover:bg-emerald-50 text-emerald-700"
                          : "hover:bg-red-50 text-red-700"
                      }`}
                    >
                      {user.isBlocked ? <Unlock size={16} /> : <Ban size={16} />}
                      {user.isBlocked ? "Разблокировать" : "Заблокировать"}
                    </button>
                  )}

                  {!readOnly && user.sellerType === "company" && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={toggleBusinessVerify}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40 ${
                        user.businessVerified
                          ? "hover:bg-amber-50 text-amber-700"
                          : "hover:bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <BadgeCheck size={16} />
                      {user.businessVerified
                        ? "Снять верификацию"
                        : "Верифицировать премиум"}
                    </button>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={toggleBusinessAccount}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40 ${
                        user.sellerType === "company"
                          ? "hover:bg-red-50 text-red-700"
                          : "hover:bg-blue-50 text-blue-700"
                      }`}
                    >
                      <Building2 size={16} />
                      {user.sellerType === "company"
                        ? "Отключить премиум-аккаунт"
                        : "Подключить премиум-аккаунт"}
                    </button>
                  )}
                </div>

                {isSuperAdmin && !readOnly && (
                  <div>
                    <div className="text-sm font-medium mb-1">Роль</div>
                    <select
                      value={user.role || "user"}
                      disabled={actionLoading}
                      onChange={(e) => changeRole(e.target.value)}
                      className="h-10 rounded-xl border px-3 bg-white"
                    >
                      {ROLES.map((item) => (
                        <option key={item} value={item}>
                          {roleLabel(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Объявления</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl border p-3 bg-white">
                    <div className="text-slate-500">Всего</div>
                    <div className="text-xl font-bold">{listings.total || 0}</div>
                  </div>
                  {Object.entries(listingStatusLabel).map(([key, label]) => (
                    <div key={key} className="rounded-xl border p-3 bg-white">
                      <div className="text-slate-500">{label}</div>
                      <div className="text-xl font-bold">{listings[key] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-sun-700" />
                  <h4 className="font-semibold">Кошелёк</h4>
                </div>

                <div className="text-2xl font-bold text-sun-700">
                  {Number(user.walletBalance || 0).toLocaleString("ru-RU")} TJS
                </div>

                {isSuperAdmin && !readOnly && (
                  <div className="rounded-xl border bg-slate-50 p-3 space-y-3">
                    <div className="text-sm font-medium">Корректировка баланса</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={adjustAmount}
                        onChange={(e) =>
                          setAdjustAmount(e.target.value.replace(/[^\d.,]/g, ""))
                        }
                        placeholder="Сумма"
                        className="h-10 rounded-xl border px-3 bg-white"
                      />
                      <input
                        value={adjustDescription}
                        onChange={(e) => setAdjustDescription(e.target.value)}
                        placeholder="Комментарий (необязательно)"
                        className="h-10 rounded-xl border px-3 bg-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={adjustLoading}
                        onClick={() => adjustWallet(1)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Начислить
                      </button>
                      <button
                        type="button"
                        disabled={adjustLoading}
                        onClick={() => adjustWallet(-1)}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Списать
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">История операций</div>
                  {transactions.length === 0 ? (
                    <div className="text-sm text-slate-500">Операций пока нет.</div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-start justify-between gap-3 rounded-xl border bg-white p-3 text-sm"
                        >
                          <div>
                            <div className="font-medium">
                              {WALLET_TYPE_LABELS[tx.type] || tx.type}
                            </div>
                            {tx.description && (
                              <div className="text-slate-500">{tx.description}</div>
                            )}
                            <div className="text-xs text-slate-400 mt-1">
                              {tx.createdAt
                                ? new Date(tx.createdAt).toLocaleString("ru-RU")
                                : "—"}
                            </div>
                          </div>
                          <div
                            className={`font-bold whitespace-nowrap ${
                              Number(tx.amount) >= 0
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                          >
                            {Number(tx.amount) >= 0 ? "+" : ""}
                            {Number(tx.amount).toLocaleString("ru-RU")} TJS
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
