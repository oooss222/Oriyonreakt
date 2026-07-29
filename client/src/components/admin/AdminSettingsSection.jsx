import React from "react";
import { Settings, Save } from "lucide-react";
import { api } from "../../lib/api";

export default function AdminSettingsSection({ token }) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
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
      setSuccess("");

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

      setSuccess("Настройки сохранены");
    } catch (e) {
      setError(e.message || "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border bg-white p-5 animate-pulse h-56" />;
  }

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
          <Settings className="w-4 h-4" />
          Настройки сайта
        </div>
        <h2 className="text-xl font-bold">Конфигурация платформы</h2>
        <p className="text-sm text-slate-500 mt-1">
          Тарифы VIP/TOP, регистрация и текст политики конфиденциальности.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3">
          {success}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className="text-sm font-medium mb-1">VIP, TJS</div>
            <input
              type="number"
              min="0"
              step="1"
              value={form.vipPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, vipPrice: e.target.value }))
              }
              className="h-11 w-full rounded-xl border px-3"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">TOP, TJS</div>
            <input
              type="number"
              min="0"
              step="1"
              value={form.topPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, topPrice: e.target.value }))
              }
              className="h-11 w-full rounded-xl border px-3"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Обновление даты, TJS</div>
            <input
              type="number"
              min="0"
              step="1"
              value={form.bumpPrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bumpPrice: e.target.value }))
              }
              className="h-11 w-full rounded-xl border px-3"
            />
          </label>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4 space-y-3">
          <div className="font-medium">Бухгалтерия</div>
          <label className="block">
            <div className="text-sm font-medium mb-1">Email для отчётов</div>
            <input
              type="email"
              value={form.accountantReportEmail}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  accountantReportEmail: e.target.value,
                }))
              }
              placeholder="accountant@example.com"
              className="h-11 w-full rounded-xl border px-3 bg-white"
            />
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.monthlyReportEnabled}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  monthlyReportEnabled: e.target.checked,
                }))
              }
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium">Автоотчёт 1-го числа</div>
              <div className="text-sm text-slate-500">
                CSV транзакций за прошлый месяц на email бухгалтера (нужен SMTP на сервере).
              </div>
            </div>
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.registrationEnabled}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                registrationEnabled: e.target.checked,
              }))
            }
            className="w-4 h-4"
          />
          <div>
            <div className="font-medium">Регистрация открыта</div>
            <div className="text-sm text-slate-500">
              Если выключено, новые пользователи не смогут создать аккаунт.
            </div>
          </div>
        </label>

        <label className="block">
          <div className="text-sm font-medium mb-1">Текст политики (/policy)</div>
          <textarea
            value={form.policyContent}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, policyContent: e.target.value }))
            }
            rows={14}
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-sun/40 resize-y font-mono text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Сохраняем..." : "Сохранить настройки"}
        </button>
      </form>
    </div>
  );
}
