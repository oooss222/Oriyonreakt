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
    <div className={`inline-flex flex-col items-stretch gap-1 ${className}`}>
      <button
        type="button"
        onClick={save}
        disabled={saving || !canSave}
        title={title}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          saved
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : duplicate
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        } ${compact ? "px-3 py-2" : "px-4 py-2.5"}`}
      >
        {saved ? (
          <Check size={16} />
        ) : duplicate ? (
          <AlertCircle size={16} />
        ) : (
          <BookmarkPlus size={16} />
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
          className="text-[11px] text-center text-sun-700 hover:text-sun font-medium"
        >
          {t("search.openInProfile")}
        </Link>
      )}

      {!token && saved && (
        <span className="text-[11px] text-center text-slate-500">
          {t("search.loginToSync")}
        </span>
      )}
    </div>
  );
}
