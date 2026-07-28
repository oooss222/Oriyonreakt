import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { api } from "../../lib/api";

const EXPORT_ITEMS = [
  {
    type: "users",
    title: "Пользователи",
    description: "Email, роль, баланс, дата регистрации",
  },
  {
    type: "listings",
    title: "Объявления",
    description: "Название, категория, статус, владелец",
  },
  {
    type: "transactions",
    title: "Транзакции кошелька",
    description: "Тип операции, сумма, пользователь",
  },
];

export default function AdminExportSection({ token }) {
  const [loadingType, setLoadingType] = React.useState("");
  const [error, setError] = React.useState("");

  const download = async (type) => {
    try {
      setLoadingType(type);
      setError("");
      await api.adminExport(token, type);
    } catch (e) {
      setError(e.message || "Не удалось скачать файл");
    } finally {
      setLoadingType("");
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-2">
          <FileSpreadsheet className="w-4 h-4" />
          Экспорт данных
        </div>
        <h2 className="text-xl font-bold">CSV-выгрузки</h2>
        <p className="text-sm text-slate-500 mt-1">
          Скачайте таблицы для отчётности и бухгалтерии.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXPORT_ITEMS.map((item) => (
          <div key={item.type} className="rounded-2xl border p-4 space-y-3 bg-slate-50">
            <div>
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-slate-500 mt-1">{item.description}</div>
            </div>

            <button
              type="button"
              disabled={loadingType === item.type}
              onClick={() => download(item.type)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border hover:bg-slate-100 disabled:opacity-60"
            >
              <Download size={16} />
              {loadingType === item.type ? "Готовим..." : "Скачать CSV"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
