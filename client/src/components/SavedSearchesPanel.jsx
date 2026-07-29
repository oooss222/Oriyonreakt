import React from "react";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";

export default function SavedSearchesPanel({ draft, activeCat, onApply }) {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [alertsEnabled, setAlertsEnabled] = React.useState(true);

  const load = React.useCallback(() => {
    if (!token) {
      const local = JSON.parse(localStorage.getItem("oriyon_saved_searches") || "[]");
      setItems(local);
      return;
    }

    setLoading(true);

    api
      .savedSearches(token)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const saveCurrent = async () => {
    const label = [
      draft.subcategory,
      draft.specs?.Марка || draft.specs?.Производитель,
      draft.location || draft.region,
      draft.search,
    ]
      .filter(Boolean)
      .join(" · ");

    if (token) {
      const saved = await api.saveSavedSearch(token, {
        label: label || "Поиск без названия",
        cat: activeCat,
        filters: draft,
        alertsEnabled,
      });

      setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 8));
      return;
    }

    const key = "oriyon_saved_searches";
    const local = JSON.parse(localStorage.getItem(key) || "[]");

    local.unshift({
      label: label || "Поиск без названия",
      params: draft,
      cat: activeCat,
      savedAt: Date.now(),
    });

    localStorage.setItem(key, JSON.stringify(local.slice(0, 8)));
    setItems(local.slice(0, 8));
  };

  const removeItem = async (item) => {
    if (token && item.id) {
      await api.deleteSavedSearch(token, item.id);
    } else {
      const key = "oriyon_saved_searches";
      const local = JSON.parse(localStorage.getItem(key) || "[]").filter(
        (entry) => entry.savedAt !== item.savedAt
      );
      localStorage.setItem(key, JSON.stringify(local));
    }

    load();
  };

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Сохранённые поиски</div>
          <div className="text-xs text-slate-500 mt-1">
            {token
              ? "Можно включить email-уведомления о новых объявлениях."
              : "Войдите, чтобы получать email-уведомления."}
          </div>
        </div>

        <button type="button" className="btn rounded-xl text-sm" onClick={saveCurrent}>
          Сохранить текущий
        </button>
      </div>

      {token && (
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={alertsEnabled}
            onChange={(e) => setAlertsEnabled(e.target.checked)}
          />
          Email-уведомления для нового поиска
        </label>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500">Пока нет сохранённых поисков.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id || item.savedAt}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <button
                type="button"
                className="text-left flex-1"
                onClick={() =>
                  onApply?.({
                    ...(item.filters || item.params || {}),
                    cat: item.cat,
                  })
                }
              >
                <div className="font-medium text-sm text-slate-900">
                  {item.label || "Поиск"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {item.alertsEnabled ? "Уведомления включены" : "Без уведомлений"}
                </div>
              </button>

              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => removeItem(item)}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
