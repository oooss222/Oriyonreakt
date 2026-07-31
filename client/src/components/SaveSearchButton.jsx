import React from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { api } from "../lib/api";
import { TOKEN_KEY } from "../lib/auth";

function buildSearchLabel(draft, activeCat) {
  return [
    draft.subcategory,
    draft.specs?.["Тип сделки"],
    draft.specs?.["Комнат"] ? `${draft.specs["Комнат"]}-комн.` : "",
    draft.specs?.["Район"],
    draft.location || draft.region,
    draft.search,
    activeCat === "realestate" ? "Недвижимость" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function SaveSearchButton({
  draft,
  activeCat,
  className = "",
  compact = false,
}) {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setSaved(false);
  }, [draft, activeCat]);

  const save = async () => {
    const label = buildSearchLabel(draft, activeCat) || "Поиск без названия";

    try {
      setSaving(true);

      if (token) {
        await api.saveSavedSearch(token, {
          label,
          cat: activeCat,
          filters: draft,
          alertsEnabled: true,
        });
      } else {
        const key = "oriyon_saved_searches";
        const local = JSON.parse(localStorage.getItem(key) || "[]");

        local.unshift({
          label,
          params: draft,
          cat: activeCat,
          savedAt: Date.now(),
        });

        localStorage.setItem(key, JSON.stringify(local.slice(0, 8)));
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={save}
      disabled={saving}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition disabled:opacity-60 ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      } ${compact ? "px-3 py-2" : "px-4 py-2.5"} ${className}`}
    >
      {saved ? <Check size={16} /> : <BookmarkPlus size={16} />}
      {saved ? "Сохранено" : compact ? "Сохранить" : "Сохранить поиск"}
    </button>
  );
}
