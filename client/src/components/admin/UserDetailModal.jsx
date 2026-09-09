import React from "react";
import {
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
  Plus,
  Minus,
} from "lucide-react";
import { api } from "../../lib/api";
import {
  ROLES,
  WALLET_TYPE_LABELS,
  getId,
  roleLabel,
  canManageUser,
  formatRegistrationDevice,
} from "../../lib/adminUtils";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  useConfirm,
  useToast,
} from "../../ui";
import { useI18n } from "../../i18n";
import { StatTile, roleTone } from "./AdminUI";

const LISTING_STATUS_LABELS = {
  approved: "Опубликованы",
  pending: "На модерации",
  rejected: "Отклонены",
  sold: "Продано",
  archived: "Сняты",
};

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ru-RU");
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2 text-sm text-ink-700">
      <Icon size={16} className="mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
      <span className="min-w-0 break-anywhere">
        <span className="text-ink-400">{label}: </span>
        {children}
      </span>
    </div>
  );
}

export default function UserDetailModal({
  token,
  userId,
  currentUser,
  readOnly = false,
  onClose,
  onUserUpdated,
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [detail, setDetail] = React.useState(null);
  const [adjustAmount, setAdjustAmount] = React.useState("");
  const [adjustDescription, setAdjustDescription] = React.useState("");
  const [adjustError, setAdjustError] = React.useState("");
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
  const companyLabel = user?.companyName || user?.name || "";

  const changeRole = async (nextRole) => {
    if (!isSuperAdmin || !user) return;

    try {
      setActionLoading(true);
      const updated = await api.adminSetUserRole(token, getId(user), nextRole);
      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
      showToast(t("admin.toastRoleChanged"), "success");
    } catch (e) {
      showToast(e.message || "Ошибка изменения роли", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (!user || !manageable) return;

    const blocking = !user.isBlocked;

    const ok = await confirm({
      title: blocking
        ? t("admin.blockUserTitle")
        : t("admin.unblockUserTitle"),
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
      setActionLoading(true);
      const updated = user.isBlocked
        ? await api.adminUnblockUser(token, getId(user))
        : await api.adminBlockUser(token, getId(user));

      setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
      onUserUpdated?.(updated);
      showToast(
        blocking ? t("admin.toastUserBlocked") : t("admin.toastUserUnblocked"),
        "success"
      );
    } catch (e) {
      showToast(e.message || "Ошибка блокировки", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBusinessVerify = async () => {
    if (!user || user.sellerType !== "company" || readOnly) return;

    const nextVerified = !user.businessVerified;

    const ok = await confirm({
      title: nextVerified
        ? t("admin.verifyBusinessTitle")
        : t("admin.unverifyBusinessTitle"),
      message: nextVerified
        ? t("admin.verifyBusinessMessage", { name: companyLabel })
        : t("admin.unverifyBusinessMessage", { name: companyLabel }),
      confirmLabel: nextVerified
        ? t("admin.verifyBusinessTitle")
        : t("admin.unverifyBusinessTitle"),
      tone: nextVerified ? undefined : "danger",
    });

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
      showToast(
        nextVerified
          ? t("admin.toastBusinessVerified")
          : t("admin.toastBusinessUnverified"),
        "success"
      );
    } catch (e) {
      showToast(e.message || "Ошибка верификации", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBusinessAccount = async () => {
    if (!user || readOnly) return;

    if (user.sellerType === "company") {
      const ok = await confirm({
        title: t("admin.disconnectBusinessTitle"),
        message: t("admin.disconnectBusinessMessage", { name: companyLabel }),
        confirmLabel: t("admin.disconnectBusinessTitle"),
        tone: "danger",
      });

      if (!ok) return;

      try {
        setActionLoading(true);
        const updated = await api.adminSetBusinessAccount(token, getId(user), {
          sellerType: "private",
        });
        setDetail((prev) => ({ ...prev, user: { ...prev.user, ...updated } }));
        onUserUpdated?.(updated);
        showToast(t("admin.toastBusinessDisconnected"), "success");
      } catch (e) {
        showToast(e.message || "Не удалось отключить премиум-аккаунт", "error");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const companyName = await confirm({
      title: t("admin.connectBusinessTitle"),
      message: t("admin.connectBusinessMessage"),
      placeholder: t("admin.connectBusinessPlaceholder"),
      confirmLabel: t("admin.connectBusinessTitle"),
      defaultValue: user.companyName || user.name || "",
      prompt: true,
      requireValue: true,
    });

    if (companyName === null) return;

    if (!String(companyName).trim()) {
      showToast(t("admin.companyNameRequired"), "error");
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
      showToast(t("admin.toastBusinessConnected"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось подключить премиум-аккаунт", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const adjustWallet = async (sign) => {
    if (!isSuperAdmin || !user) return;

    const value = Number(String(adjustAmount).replace(",", "."));

    if (!Number.isFinite(value) || value <= 0) {
      setAdjustError(t("admin.amountInvalid"));
      return;
    }

    setAdjustError("");

    const amount = sign * value;

    const ok = await confirm({
      title: sign > 0 ? t("admin.adjustCreditTitle") : t("admin.adjustDebitTitle"),
      message:
        sign > 0
          ? t("admin.adjustCreditMessage", {
              amount: value.toLocaleString("ru-RU"),
              email: user.email,
            })
          : t("admin.adjustDebitMessage", {
              amount: value.toLocaleString("ru-RU"),
              email: user.email,
            }),
      confirmLabel:
        sign > 0 ? t("admin.adjustCreditTitle") : t("admin.adjustDebitTitle"),
      tone: sign > 0 ? undefined : "danger",
    });

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
      showToast(t("admin.toastBalanceUpdated"), "success");
    } catch (e) {
      showToast(e.message || "Не удалось изменить баланс", "error");
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Карточка пользователя"
      description={
        readOnly
          ? "Просмотр баланса и истории операций"
          : "Подробная информация и управление"
      }
      bodyClassName="space-y-5"
    >
      {loading && (
        <div className="space-y-3">
          <p className="sr-only" role="status">
            {t("common.loading")}
          </p>
          <Skeleton className="h-24" rounded="rounded-2xl" />
          <Skeleton className="h-16" rounded="rounded-2xl" />
          <Skeleton className="h-32" rounded="rounded-2xl" />
        </div>
      )}

      {error && <Alert tone="danger">{error}</Alert>}

      {!loading && user && (
        <>
          <section className="surface-muted space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user.name || user.email} size="md" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-ink-900 break-anywhere">
                    {user.name || "Без имени"}
                  </h3>
                  <p className="text-xs text-ink-400 break-anywhere">
                    ID: {getId(user)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={roleTone(user.role)}>{roleLabel(user.role)}</Badge>

                {user.isBlocked ? (
                  <Badge tone="danger">Заблокирован</Badge>
                ) : (
                  <Badge tone="success">Активен</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email">
                {user.email}
              </InfoRow>

              <InfoRow icon={Phone} label="Телефон">
                {user.phone || "не указан"}
              </InfoRow>

              <InfoRow icon={Clock} label="Регистрация">
                {formatDateTime(user.createdAt)}
              </InfoRow>

              <InfoRow icon={Clock} label="Был онлайн">
                {formatDateTime(user.lastSeen)}
              </InfoRow>
            </div>

            {isSuperAdmin ? (
              <div className="rounded-xl border border-ink-200 bg-white p-3 text-sm">
                <p className="inline-flex items-center gap-1.5 font-semibold text-ink-800">
                  <Smartphone size={15} aria-hidden="true" />
                  Регистрация с устройства
                </p>
                <p className="mt-1 text-ink-700">
                  {formatRegistrationDevice(user)}
                </p>
                {user.registrationUserAgent ? (
                  <p className="mt-1 text-xs text-ink-400 break-anywhere">
                    {user.registrationUserAgent}
                  </p>
                ) : null}
              </div>
            ) : null}

            {user.sellerType === "company" && (
              <div className="rounded-xl border border-info-200 bg-info-50 p-3 text-sm">
                <p className="inline-flex items-center gap-1.5 font-semibold text-info-800">
                  <Building2 size={15} aria-hidden="true" />
                  {user.companyName || "Премиум"}
                </p>
                {user.companyDescription && (
                  <p className="mt-1 text-ink-600">{user.companyDescription}</p>
                )}
                <p className="mt-1.5">
                  {user.businessVerified ? (
                    <Badge tone="success" icon={BadgeCheck}>
                      Проверенный премиум
                    </Badge>
                  ) : (
                    <Badge tone="warning">Ожидает верификации</Badge>
                  )}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                to={`/seller/${getId(user)}`}
                icon={ExternalLink}
                size="sm"
              >
                Публичная страница
              </Button>

              {!readOnly && (
                <Button
                  size="sm"
                  variant={user.isBlocked ? "lagoon" : "danger"}
                  icon={user.isBlocked ? Unlock : Ban}
                  disabled={!manageable || actionLoading}
                  onClick={toggleBlock}
                >
                  {user.isBlocked ? "Разблокировать" : "Заблокировать"}
                </Button>
              )}

              {!readOnly && user.sellerType === "company" && (
                <Button
                  size="sm"
                  icon={BadgeCheck}
                  disabled={actionLoading}
                  onClick={toggleBusinessVerify}
                >
                  {user.businessVerified
                    ? "Снять верификацию"
                    : "Верифицировать премиум"}
                </Button>
              )}

              {!readOnly && (
                <Button
                  size="sm"
                  icon={Building2}
                  disabled={actionLoading}
                  onClick={toggleBusinessAccount}
                >
                  {user.sellerType === "company"
                    ? "Отключить премиум-аккаунт"
                    : "Подключить премиум-аккаунт"}
                </Button>
              )}
            </div>

            {isSuperAdmin && !readOnly && (
              <Field label="Роль" className="max-w-xs">
                {(props) => (
                  <Select
                    {...props}
                    value={user.role || "user"}
                    disabled={actionLoading}
                    onChange={(e) => changeRole(e.target.value)}
                    options={ROLES.map((item) => ({
                      value: item,
                      label: roleLabel(item),
                    }))}
                  />
                )}
              </Field>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-display text-base font-bold text-ink-900">
              Объявления
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile label="Всего" value={listings.total || 0} />
              {Object.entries(LISTING_STATUS_LABELS).map(([key, label]) => (
                <StatTile key={key} label={label} value={listings[key] || 0} />
              ))}
            </div>
          </section>

          <section className="surface-panel space-y-4 p-4">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-sun-600" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-ink-900">
                Кошелёк
              </h3>
            </div>

            <p className="text-price text-2xl text-sun-700">
              {Number(user.walletBalance || 0).toLocaleString("ru-RU")} TJS
            </p>

            {isSuperAdmin && !readOnly && (
              <div className="surface-muted space-y-3 p-3">
                <h4 className="text-sm font-semibold text-ink-800">
                  Корректировка баланса
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Сумма, TJS"
                    error={adjustError}
                    hint={t("admin.amountHint")}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        inputMode="decimal"
                        value={adjustAmount}
                        onChange={(e) => {
                          setAdjustError("");
                          setAdjustAmount(e.target.value.replace(/[^\d.,]/g, ""));
                        }}
                        placeholder="0"
                      />
                    )}
                  </Field>

                  <Field label="Комментарий" hint={t("admin.optional")}>
                    {(props) => (
                      <Input
                        {...props}
                        value={adjustDescription}
                        onChange={(e) => setAdjustDescription(e.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="lagoon"
                    icon={Plus}
                    disabled={adjustLoading}
                    onClick={() => adjustWallet(1)}
                  >
                    Начислить
                  </Button>

                  <Button
                    variant="danger"
                    icon={Minus}
                    disabled={adjustLoading}
                    onClick={() => adjustWallet(-1)}
                  >
                    Списать
                  </Button>
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 text-sm font-semibold text-ink-800">
                История операций
              </h4>

              {transactions.length === 0 ? (
                <p className="text-sm text-ink-400">Операций пока нет.</p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto overscroll-contain">
                  {transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-800">
                          {WALLET_TYPE_LABELS[tx.type] || tx.type}
                        </p>
                        {tx.description && (
                          <p className="text-ink-500 break-anywhere">
                            {tx.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-ink-400">
                          {formatDateTime(tx.createdAt)}
                        </p>
                      </div>

                      <p
                        className={`whitespace-nowrap font-bold ${
                          Number(tx.amount) >= 0
                            ? "text-success-700"
                            : "text-danger-700"
                        }`}
                      >
                        {Number(tx.amount) >= 0 ? "+" : ""}
                        {Number(tx.amount).toLocaleString("ru-RU")} TJS
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </Modal>
  );
}
