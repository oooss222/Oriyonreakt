import React from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2 } from "lucide-react";
import {
  Alert,
  Checkbox,
  EmptyState,
  IconButton,
  SectionCard,
  Skeleton,
  useConfirm,
  useToast,
} from "../../ui";
import { api } from "../../lib/api";
import { TOKEN_KEY } from "../../lib/auth";
import { readLocalSavedSearches, writeLocalSavedSearches } from "../../lib/savedSearch";
import { CAT_LABELS } from "../../data/listingCategories";
import { buildListingUrlFromSavedFilters } from "./profileUtils";
import { useI18n } from "../../i18n";

function getFilters(item) {
  return item.filters || item.params || {};
}

function summarize(item, t) {
  const filters = getFilters(item);
  const cat = item.cat || filters.cat;

  const parts = [
    CAT_LABELS[cat],
    filters.subcategory,
    filters.location || filters.region,
    ...Object.values(filters.specs || {}),
    filters.search && `«${filters.search}»`,
  ].filter(Boolean);

  if (filters.priceFrom && filters.priceTo) {
    parts.push(`${filters.priceFrom}–${filters.priceTo}`);
  } else if (filters.priceFrom) {
    parts.push(t("search.priceFromValue", { value: filters.priceFrom }));
  } else if (filters.priceTo) {
    parts.push(t("search.priceToValue", { value: filters.priceTo }));
  }

  return parts.join(" · ") || t("search.noFilters");
}

export default function SavedSearchesTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(Boolean(token));
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    if (!token) {
      setItems(readLocalSavedSearches());
      return;
    }

    setLoading(true);

    api
      .savedSearches(token)
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch(() => {
        setItems([]);
        setError(t("search.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleAlerts = async (item) => {
    if (!token || !item.id) return;

    try {
      const saved = await api.saveSavedSearch(token, {
        id: item.id,
        label: item.label,
        cat: item.cat,
        filters: getFilters(item),
        alertsEnabled: !item.alertsEnabled,
      });

      setItems((current) =>
        current.map((entry) => (entry.id === saved.id ? saved : entry))
      );
      showToast(item.alertsEnabled ? t("search.alertsOff") : t("search.alertsOn"), "success");
    } catch (e) {
      showToast(e.message || t("search.alertsUpdateFailed"), "error");
    }
  };

  const removeItem = async (item) => {
    const label = item.label || t("search.defaultLabel");

    const ok = await confirm({
      title: t("search.deleteTitle"),
      message: t("search.deleteMessage", { label }),
      confirmLabel: t("search.delete"),
      tone: "danger",
    });
    if (!ok) return;

    try {
      if (token && item.id) {
        await api.deleteSavedSearch(token, item.id);
      } else {
        writeLocalSavedSearches(
          readLocalSavedSearches().filter((entry) => entry.savedAt !== item.savedAt)
        );
      }

      load();
      showToast(t("search.deleted"), "success");
    } catch (e) {
      showToast(e.message || t("search.deleteFailed"), "error");
    }
  };

  return (
    <SectionCard
      title={t("search.savedSearches")}
      description={token ? t("search.savedHintLoggedIn") : t("search.savedHintGuest")}
      icon={Bookmark}
      bodyClassName="space-y-3"
    >
      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" rounded="rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          bare
          icon={Bookmark}
          title={t("search.emptyTitle")}
          description={t("search.empty")}
          actionLabel={t("search.goToCatalog")}
          actionTo="/listing"
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const label = item.label || t("search.defaultLabel");

            return (
              <li
                key={item.id || item.savedAt}
                className="rounded-xl border border-ink-200 p-3"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 rounded-lg text-left"
                    onClick={() =>
                      navigate(
                        buildListingUrlFromSavedFilters({
                          ...getFilters(item),
                          cat: item.cat || getFilters(item).cat,
                        })
                      )
                    }
                  >
                    <span className="block truncate text-sm font-semibold text-ink-900">
                      {label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-400">
                      {summarize(item, t)}
                    </span>
                  </button>

                  <IconButton
                    icon={Trash2}
                    variant="ghost"
                    label={t("search.deleteLabel", { label })}
                    className="h-11 w-11 shrink-0 text-danger-600"
                    onClick={() => removeItem(item)}
                  />
                </div>

                <div className="mt-2.5 border-t border-ink-200 pt-2.5">
                  {token && item.id ? (
                    <Checkbox
                      label={t("search.alerts")}
                      description={
                        item.alertsEnabled ? t("search.alertsOn") : t("search.alertsOff")
                      }
                      checked={Boolean(item.alertsEnabled)}
                      aria-label={t("search.alertsFor", { label })}
                      onChange={() => toggleAlerts(item)}
                    />
                  ) : (
                    <p className="text-xs text-ink-400">{t("search.localOnly")}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
