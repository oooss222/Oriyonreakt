import React from "react";
import { Download, FileSpreadsheet, CalendarRange, Mail } from "lucide-react";
import { api } from "../../lib/api";
import { getExportTypesForRole } from "../../lib/adminUtils";
import { Alert, Badge, Button, Card, Field, Input, useToast } from "../../ui";
import { useI18n } from "../../i18n";
import { SectionHeader } from "./AdminUI";

const EXPORT_META = {
  users: {
    title: "Пользователи",
    description: "Email, роль, баланс, дата регистрации",
    dateFilter: true,
  },
  listings: {
    title: "Объявления",
    description: "Название, категория, статус, владелец",
    dateFilter: false,
  },
  transactions: {
    title: "Транзакции кошелька",
    description: "Тип операции, сумма, пользователь",
    dateFilter: true,
  },
};

export default function AdminExportSection({ token, role = "admin" }) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [loadingType, setLoadingType] = React.useState("");
  const [sendingReport, setSendingReport] = React.useState(false);
  const [error, setError] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [reportEmail, setReportEmail] = React.useState("");

  const exportTypes = getExportTypesForRole(role);
  const exportItems = exportTypes.map((type) => ({
    type,
    ...EXPORT_META[type],
  }));

  const download = async (type) => {
    try {
      setLoadingType(type);
      setError("");

      const params = {};

      if (from) params.from = from;
      if (to) params.to = to;

      await api.adminExport(token, type, params);
    } catch (e) {
      setError(e.message || "Не удалось скачать файл");
    } finally {
      setLoadingType("");
    }
  };

  const sendReport = async () => {
    try {
      setSendingReport(true);
      setError("");

      const result = await api.adminFinanceSendReport(token, {
        from,
        to,
        email: reportEmail.trim(),
      });

      showToast(
        t("admin.reportSent", {
          email: result.sentTo,
          count: result.transactions,
        }),
        "success"
      );
    } catch (e) {
      setError(e.message || "Не удалось отправить отчёт");
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <Card className="space-y-5">
      <SectionHeader
        eyebrow="Экспорт данных"
        icon={FileSpreadsheet}
        title="CSV-выгрузки"
        description={
          role === "accountant"
            ? "Доступны только пользователи и транзакции кошелька."
            : "Скачайте таблицы для отчётности и бухгалтерии."
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <fieldset className="surface-muted space-y-3 p-4">
        <legend className="label-caps flex items-center gap-1.5 px-1">
          <CalendarRange size={13} aria-hidden="true" />
          Период (необязательно)
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="С даты">
            {(props) => (
              <Input
                {...props}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            )}
          </Field>

          <Field label="По дату">
            {(props) => (
              <Input
                {...props}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            )}
          </Field>
        </div>

        <p className="text-xs text-ink-400">
          Фильтр по дате применяется к пользователям (регистрация) и транзакциям
          кошелька.
        </p>
      </fieldset>

      <fieldset className="rounded-2xl border border-info-200 bg-info-50 p-4">
        <legend className="label-caps flex items-center gap-1.5 px-1 text-info-700">
          <Mail size={13} aria-hidden="true" />
          Отправить отчёт на email
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Field
            label="Email получателя"
            labelClassName="text-info-800"
            hint="Если не задан, письмо уйдёт на email из настроек."
          >
            {(props) => (
              <Input
                {...props}
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="accountant@example.com"
              />
            )}
          </Field>

          <Button
            variant="accent"
            icon={Mail}
            loading={sendingReport}
            onClick={sendReport}
          >
            Отправить CSV
          </Button>
        </div>

        <p className="mt-3 text-xs text-info-700">
          Нужны SMTP-переменные на сервере (SMTP_HOST, SMTP_FROM, …). Автоотчёт
          1-го числа настраивается супер-админом.
        </p>
      </fieldset>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {exportItems.map((item) => (
          <li key={item.type} className="surface-muted flex flex-col gap-3 p-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-400">{item.description}</p>

              {item.dateFilter && (from || to) && (
                <p className="mt-2">
                  <Badge tone="success">
                    {t("admin.exportPeriod", {
                      from: from || "—",
                      to: to || "—",
                    })}
                  </Badge>
                </p>
              )}
            </div>

            <Button
              icon={Download}
              loading={loadingType === item.type}
              onClick={() => download(item.type)}
              className="mt-auto w-full"
            >
              Скачать CSV
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
