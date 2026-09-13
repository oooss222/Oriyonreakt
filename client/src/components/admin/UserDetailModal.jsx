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
  Smartphone,
} from "lucide-react";
import { api } from "../../lib/api";
import { useI18n } from "../../i18n";
import {
  ROLES,
  getWalletTypeLabels,
  getId,
  roleLabel,
  roleBadgeClass,
  canManageUser,
  formatRegistrationDevice,
} from "../../lib/adminUtils";

export default function UserDetailModal({
  token,
  userId,
  currentUser,
  readOnly = false,
  onClose,
  onUserUpdated,
}) {
  const { t, lang } = useI18n();
  const numberLocale = lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
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
      setError(e.message || t("admin.userDetail.loadError"));
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

    const ok = confirm(
      t("admin.userDetail.roleChangeConfirm", {
        email: user.email,
        role: roleLabel(nextRole),
      })
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      const updated = await api.adminSetUserRole(token, getId(user), nextRole);
      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
    } catch (e) {
      alert(e.message || t("admin.userDetail.roleChangeError"));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (!user || !manageable) return;

    const ok = confirm(
      user.isBlocked
        ? t("admin.users.unblockConfirm", { email: user.email })
        : t("admin.users.blockConfirm", { email: user.email })
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      const updated = user.isBlocked
        ? await api.adminUnblockUser(token, getId(user))
        : await api.adminBlockUser(token, getId(user));

      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
    } catch (e) {
      alert(e.message || t("admin.userDetail.blockError"));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBusinessVerify = async () => {
    if (!user || user.sellerType !== "company" || readOnly) return;

    const nextVerified = !user.businessVerified;
    const companyName = user.companyName || user.name;

    const ok = confirm(
      nextVerified
        ? t("admin.userDetail.verifyConfirm", { company: companyName })
        : t("admin.userDetail.unverifyConfirm", { company: companyName })
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
      alert(e.message || t("admin.userDetail.verifyError"));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBusinessAccount = async () => {
    if (!user || readOnly) return;

    if (user.sellerType === "company") {
      const ok = confirm(
        t("admin.userDetail.disableBusinessConfirm", {
          company: user.companyName || user.name,
        })
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
        alert(e.message || t("admin.userDetail.disableBusinessError"));
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const companyName = prompt(
      t("admin.userDetail.companyNamePrompt"),
      user.companyName || user.name || ""
    );

    if (companyName === null) return;

    if (!String(companyName).trim()) {
      alert(t("admin.userDetail.companyNameRequired"));
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
      alert(e.message || t("admin.userDetail.enableBusinessError"));
    } finally {
      setActionLoading(false);
    }
  };

  const adjustWallet = async (sign) => {
    if (!isSuperAdmin || !user) return;

    const value = Number(String(adjustAmount).replace(",", "."));

    if (!Number.isFinite(value) || value <= 0) {
      alert(t("admin.userDetail.invalidAmount"));
      return;
    }

    const amount = sign * value;

    const ok = confirm(
      sign > 0
        ? t("admin.userDetail.creditConfirm", { amount: value, email: user.email })
        : t("admin.userDetail.debitConfirm", { amount: value, email: user.email })
    );
    if (!ok) return;

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
      alert(e.message || t("admin.userDetail.walletAdjustError"));
    } finally {
      setAdjustLoading(false);
    }
  };

  const listingStatusLabel = {
    approved: t("admin.userDetail.listingsApproved"),
    pending: t("admin.userDetail.listingsPending"),
    rejected: t("admin.userDetail.listingsRejected"),
    sold: t("admin.userDetail.listingsSold"),
    archived: t("admin.userDetail.listingsArchived"),
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-modal-title"
    >
      <div className="w-full md:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-2xl bg-white shadow-xl border">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-4 md:px-5 py-4">
          <div>
            <h3 id="user-detail-modal-title" className="text-lg font-bold">{t("admin.userDetail.title")}</h3>
            <p className="text-sm text-ink-500">
              {readOnly
                ? t("admin.userDetail.subtitleReadOnly")
                : t("admin.userDetail.subtitleFull")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border hover:bg-mist-50"
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-5">
          {loading && (
            <div className="text-sm text-ink-500 animate-pulse">{t("common.loading")}</div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
              {error}
            </div>
          )}

          {!loading && user && (
            <>
              <div className="admin-stat space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold">{user.name || t("admin.users.noName")}</div>
                    <div className="text-sm text-ink-500 mt-1">ID: {getId(user)}</div>
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
                    <Mail size={16} className="text-ink-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-ink-400" />
                    {user.phone || t("admin.users.noPhone")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-ink-400" />
                    {t("admin.userDetail.registeredAt")}:{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString(numberLocale)
                      : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-ink-400" />
                    {t("admin.userDetail.lastSeenAt")}:{" "}
                    {user.lastSeen
                      ? new Date(user.lastSeen).toLocaleString(numberLocale)
                      : "—"}
                  </div>
                  {isSuperAdmin ? (
                    <div className="sm:col-span-2 rounded-xl border bg-white p-3 text-sm space-y-1">
                      <div className="inline-flex items-center gap-1 font-semibold text-ink-800">
                        <Smartphone size={15} />
                        {t("admin.userDetail.registrationDevice")}
                      </div>
                      <div>{formatRegistrationDevice(user)}</div>
                      {user.registrationUserAgent ? (
                        <div className="text-xs text-ink-500 break-all">
                          {user.registrationUserAgent}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {user.sellerType === "company" && (
                    <div className="rounded-xl border bg-blue-50 p-3 text-sm space-y-1">
                      <div className="inline-flex items-center gap-1 font-semibold text-blue-800">
                        <Building2 size={15} />
                        {user.companyName || t("admin.users.accountBusiness")}
                      </div>
                      {user.companyDescription && (
                        <p className="text-ink-600">{user.companyDescription}</p>
                      )}
                      <div className="text-xs text-ink-500">
                        {user.businessVerified
                          ? t("admin.userDetail.verifiedBusiness")
                          : t("admin.userDetail.awaitingVerification")}
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
                    {t("admin.userDetail.publicPage")}
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
                      {user.isBlocked ? t("admin.users.unblock") : t("admin.users.block")}
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
                        ? t("admin.userDetail.removeVerification")
                        : t("admin.userDetail.verifyBusiness")}
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
                        ? t("admin.userDetail.disableBusiness")
                        : t("admin.userDetail.enableBusiness")}
                    </button>
                  )}
                </div>

                {isSuperAdmin && !readOnly && (
                  <div>
                    <div className="text-sm font-medium mb-1">{t("admin.userDetail.roleLabel")}</div>
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
                <h4 className="font-semibold mb-3">{t("admin.sections.listings")}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl border p-3 bg-white">
                    <div className="text-ink-500">{t("admin.userDetail.total")}</div>
                    <div className="text-xl font-bold">{listings.total || 0}</div>
                  </div>
                  {Object.entries(listingStatusLabel).map(([key, label]) => (
                    <div key={key} className="rounded-xl border p-3 bg-white">
                      <div className="text-ink-500">{label}</div>
                      <div className="text-xl font-bold">{listings[key] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-sun-700" />
                  <h4 className="font-semibold">{t("admin.userDetail.wallet")}</h4>
                </div>

                <div className="text-2xl font-bold text-sun-700">
                  {Number(user.walletBalance || 0).toLocaleString(numberLocale)} TJS
                </div>

                {isSuperAdmin && !readOnly && (
                  <div className="rounded-xl border bg-mist-50 p-3 space-y-3">
                    <div className="text-sm font-medium">{t("admin.userDetail.balanceAdjustment")}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={adjustAmount}
                        onChange={(e) =>
                          setAdjustAmount(e.target.value.replace(/[^\d.,]/g, ""))
                        }
                        placeholder={t("admin.userDetail.amountPlaceholder")}
                        className="h-10 rounded-xl border px-3 bg-white"
                      />
                      <input
                        value={adjustDescription}
                        onChange={(e) => setAdjustDescription(e.target.value)}
                        placeholder={t("admin.userDetail.commentPlaceholder")}
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
                        {t("admin.userDetail.credit")}
                      </button>
                      <button
                        type="button"
                        disabled={adjustLoading}
                        onClick={() => adjustWallet(-1)}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {t("admin.userDetail.debit")}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium mb-2">{t("admin.userDetail.transactionHistory")}</div>
                  {transactions.length === 0 ? (
                    <div className="text-sm text-ink-500">{t("admin.userDetail.noTransactions")}</div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-start justify-between gap-3 rounded-xl border bg-white p-3 text-sm"
                        >
                          <div>
                            <div className="font-medium">
                              {getWalletTypeLabels()[tx.type] || tx.type}
                            </div>
                            {tx.description && (
                              <div className="text-ink-500">{tx.description}</div>
                            )}
                            <div className="text-xs text-ink-400 mt-1">
                              {tx.createdAt
                                ? new Date(tx.createdAt).toLocaleString(numberLocale)
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
                            {Number(tx.amount).toLocaleString(numberLocale)} TJS
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
