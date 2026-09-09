import React from "react";
import { Settings, Save } from "lucide-react";
import { api } from "../../lib/api";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Skeleton,
  Textarea,
  useToast,
} from "../../ui";
import { useI18n } from "../../i18n";
import { SectionHeader } from "./AdminUI";

export default function AdminSettingsSection({ token }) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    vipPrice: 25,
    topPrice: 15,
    bumpPrice: 5,
    registrationEnabled: true,
    policyContent: "",
    accountantReportEmail: "",
    monthlyReportEnabled: false,
  });

  React.useEffect(() => {
    let alive = true;

    api
      .adminGetSettings(token)
      .then((data) => {
        if (!alive) return;

        setForm({
          vipPrice: data.vipPrice ?? 25,
          topPrice: data.topPrice ?? 15,
          bumpPrice: data.bumpPrice ?? 5,
          registrationEnabled: Boolean(data.registrationEnabled),
          policyContent: data.policyContent || "",
          accountantReportEmail: data.accountantReportEmail || "",
          monthlyReportEnabled: Boolean(data.monthlyReportEnabled),
        });
      })
      .catch((e) => {
        if (alive) setError(e.message || "Не удалось загрузить настройки");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const updated = await api.adminUpdateSettings(token, {
        vipPrice: Number(form.vipPrice),
        topPrice: Number(form.topPrice),
        bumpPrice: Number(form.bumpPrice),
        registrationEnabled: form.registrationEnabled,
        policyContent: form.policyContent,
        accountantReportEmail: form.accountantReportEmail.trim(),
        monthlyReportEnabled: form.monthlyReportEnabled,
      });

      setForm({
        vipPrice: updated.vipPrice,
        topPrice: updated.topPrice,
        bumpPrice: updated.bumpPrice,
        registrationEnabled: updated.registrationEnabled,
        policyContent: updated.policyContent,
        accountantReportEmail: updated.accountantReportEmail || "",
        monthlyReportEnabled: Boolean(updated.monthlyReportEnabled),
      });

      showToast(t("admin.toastSettingsSaved"), "success");
    } catch (e) {
      setError(e.message || "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="space-y-4">
        <p className="sr-only" role="status">
          {t("common.loading")}
        </p>
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16" rounded="rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40" rounded="rounded-2xl" />
      </Card>
    );
  }

  const priceField = (key, label, hint) => (
    <Field label={label} hint={hint}>
      {(props) => (
        <Input
          {...props}
          type="number"
          min="0"
          step="0.01"
          value={form[key]}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, [key]: e.target.value }))
          }
        />
      )}
    </Field>
  );

  return (
    <Card className="space-y-5">
      <SectionHeader
        eyebrow="Настройки сайта"
        icon={Settings}
        title="Конфигурация платформы"
        description="Тарифы VIP/TOP, регистрация и текст политики конфиденциальности."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {priceField("vipPrice", "VIP, TJS")}
          {priceField("topPrice", "TOP, TJS")}
          {priceField(
            "bumpPrice",
            "Обновление даты, TJS",
            "Можно указать дробное значение, например 0.25. 0 = бесплатно."
          )}
        </div>

        <fieldset className="surface-muted space-y-3 p-4">
          <legend className="label-caps px-1">Бухгалтерия</legend>

          <Field label="Email для отчётов">
            {(props) => (
              <Input
                {...props}
                type="email"
                value={form.accountantReportEmail}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    accountantReportEmail: e.target.value,
                  }))
                }
                placeholder="accountant@example.com"
              />
            )}
          </Field>

          <Checkbox
            boxed
            className="bg-white"
            label="Автоотчёт 1-го числа"
            description="CSV транзакций за прошлый месяц на email бухгалтера (нужен SMTP на сервере)."
            checked={form.monthlyReportEnabled}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                monthlyReportEnabled: e.target.checked,
              }))
            }
          />
        </fieldset>

        <Checkbox
          boxed
          label="Регистрация открыта"
          description="Если выключено, новые пользователи не смогут создать аккаунт."
          checked={form.registrationEnabled}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              registrationEnabled: e.target.checked,
            }))
          }
        />

        <Field
          label="Текст политики (/policy)"
          hint={t("admin.policyHint")}
        >
          {(props) => (
            <Textarea
              {...props}
              value={form.policyContent}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, policyContent: e.target.value }))
              }
              rows={14}
              className="min-h-[20rem] font-mono text-xs"
            />
          )}
        </Field>

        <Button
          type="submit"
          variant="accent"
          icon={Save}
          loading={saving}
          className="w-full sm:w-auto"
        >
          Сохранить настройки
        </Button>
      </form>
    </Card>
  );
}
