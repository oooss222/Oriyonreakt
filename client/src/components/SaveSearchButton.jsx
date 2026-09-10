import React from "react";
import { BookmarkPlus, Check, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";
import {
  buildSearchLabel,
  hasMeaningfulSearchFilters,
  isDuplicateSavedSearch,
  normalizeSearchFilters,
  saveSearchLocally,
} from "../lib/savedSearch";
import { useI18n } from "../i18n";
import { cn } from "../ui";

export default function SaveSearchButton({
  draft,
  activeCat,
  className = "",
  compact = false,
}) {
  const { t } = useI18n();
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [saved, setSaved] = React.useState(false);
  const [duplicate, setDuplicate] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const canSave = hasMeaningfulSearchFilters(draft, activeCat);

  React.useEffect(() => {
    setSaved(false);
    setDuplicate(false);
  }, [draft, activeCat]);

  const save = async () => {
    if (!canSave || saving) return;

    const label = buildSearchLabel(draft, activeCat) || t("search.untitled");
    const filters = normalizeSearchFilters(draft, activeCat);

    try {
      setSaving(true);

      if (token) {
        const existing = await api.savedSearches(token).catch(() => []);
        const list = Array.isArray(existing) ? existing : [];

        if (isDuplicateSavedSearch(list, draft, activeCat)) {
          setDuplicate(true);
          window.setTimeout(() => setDuplicate(false), 2500);
          return;
        }

        await api.saveSavedSearch(token, {
          label,
          cat: activeCat,
          filters,
          alertsEnabled: true,
        });
      } else {
        const result = saveSearchLocally(draft, activeCat);
        if (result.duplicate) {
          setDuplicate(true);
          window.setTimeout(() => setDuplicate(false), 2500);
          return;
        }
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const title = !canSave
    ? t("search.selectFiltersFirst")
    : duplicate
      ? t("search.duplicate")
      : saved
        ? t("search.saved")
        : undefined;

  return (
    <div className={cn("inline-flex flex-col items-stretch gap-1", className)}>
      <button
        type="button"
        onClick={save}
        disabled={saving || !canSave}
        title={title}
        aria-live="polite"
        className={cn(
          "btn",
          saved && "border-success-200 bg-success-50 text-success-700 hover:bg-success-100",
          duplicate && "border-warning-200 bg-warning-50 text-warning-800 hover:bg-warning-100",
          compact ? "h-10 px-3" : "h-11"
        )}
      >
        {saved ? (
          <Check size={16} aria-hidden="true" />
        ) : duplicate ? (
          <AlertCircle size={16} aria-hidden="true" />
        ) : (
          <BookmarkPlus size={16} aria-hidden="true" />
        )}
        {saved
          ? t("search.savedShort")
          : duplicate
            ? t("search.duplicateShort")
            : compact
              ? t("search.save")
              : t("search.saveSearch")}
      </button>

      {saved && token && (
        <Link
          to="/profile?tab=searches"
          className="text-center text-2xs font-medium text-sun-700 hover:text-sun-600"
        >
          {t("search.openInProfile")}
        </Link>
      )}

      {!token && saved && (
        <span className="text-center text-2xs text-ink-400">
          {t("search.loginToSync")}
        </span>
      )}
    </div>
  );
}
