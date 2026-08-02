import React from "react";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";
import { readLocalSavedSearches } from "../lib/savedSearch";

export default function SavedSearchesPanel({ onApply }) {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(() => {
    if (!token) {
      setItems(readLocalSavedSearches());
      return;
    }

    setLoading(true);

    api
      .savedSearches(token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleAlerts = async (item) => {
    if (!token || !item.id) return;

    const saved = await api.saveSavedSearch(token, {
      id: item.id,
      label: item.label,
      cat: item.cat,
      filters: item.filters || item.params || {},
      alertsEnabled: !item.alertsEnabled,
    });

    setItems((current) =>
      current.map((entry) => (entry.id === saved.id ? saved : entry))
    );
  };

  const removeItem = async (item) => {
    if (token && item.id) {
      await api.deleteSavedSearch(token, item.id);
    } else {
      const local = readLocalSavedSearches().filter(
        (entry) => entry.savedAt !== item.savedAt
      );
      localStorage.setItem("oriyon_saved_searches", JSON.stringify(local));
    }

    load();
  };

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">Сохранённые поиски</div>
        <div className="text-xs text-slate-500 mt-1">
          {token
            ? "Сохраняйте фильтры на странице каталога кнопкой «Сохранить». Email-уведомления — раз в час."
            : "Войдите, чтобы синхронизировать поиски между устройствами и получать email-уведомления."}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-slate-50/80 p-6 text-center text-sm text-slate-500">
          Пока нет сохранённых поисков. На странице каталога настройте фильтры и нажмите
          «Сохранить».
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id || item.savedAt}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <button
                type="button"
                className="text-left flex-1 min-w-0"
                onClick={() =>
                  onApply?.({
                    ...(item.filters || item.params || {}),
                    cat: item.cat,
                  })
                }
              >
                <div className="font-medium text-sm text-slate-900 truncate">
                  {item.label || "Поиск"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {token
                    ? item.alertsEnabled
                      ? "Уведомления включены"
                      : "Без уведомлений"
                    : "Только на этом устройстве"}
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                {token && item.id && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-sun hover:text-sun-600"
                    onClick={() => toggleAlerts(item)}
                  >
                    {item.alertsEnabled ? "Выключить" : "Включить"}
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => removeItem(item)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
