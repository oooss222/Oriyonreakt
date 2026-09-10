import React from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";
import { readLocalSavedSearches } from "../lib/savedSearch";
import { useI18n } from "../i18n";
import { Button, EmptyState, IconButton, SectionCard, Skeleton } from "../ui";

export default function SavedSearchesPanel({ onApply }) {
  const { t } = useI18n();
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
    <SectionCard
      title={t("search.savedSearches")}
      description={token ? t("search.savedHintLoggedIn") : t("search.savedHintGuest")}
      icon={Bookmark}
      bodyClassName="space-y-3"
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" rounded="rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          bare
          icon={Bookmark}
          title={t("search.emptyTitle")}
          description={t("search.empty")}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const label = item.label || t("search.defaultLabel");

            return (
              <li
                key={item.id || item.savedAt}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 p-3"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-lg py-1 text-left"
                  onClick={() =>
                    onApply?.({
                      ...(item.filters || item.params || {}),
                      cat: item.cat,
                    })
                  }
                >
                  <span className="block truncate text-sm font-semibold text-ink-900">
                    {label}
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-400">
                    {token
                      ? item.alertsEnabled
                        ? t("search.alertsOn")
                        : t("search.alertsOff")
                      : t("search.localOnly")}
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1.5">
                  {token && item.id && (
                    <Button
                      variant="ghost"
                      className="text-sun-700 hover:text-sun-800"
                      aria-label={`${
                        item.alertsEnabled
                          ? t("search.disableAlerts")
                          : t("search.enableAlerts")
                      }: ${label}`}
                      onClick={() => toggleAlerts(item)}
                    >
                      {item.alertsEnabled
                        ? t("search.disableAlerts")
                        : t("search.enableAlerts")}
                    </Button>
                  )}

                  <IconButton
                    icon={Trash2}
                    variant="ghost"
                    label={t("search.deleteLabel", { label })}
                    className="text-danger-600 hover:text-danger-700"
                    onClick={() => removeItem(item)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
