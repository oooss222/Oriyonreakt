import React from "react";
import { useNavigate } from "react-router-dom";
import SavedSearchesPanel from "../SavedSearchesPanel";
import { buildListingUrlFromSavedFilters } from "./profileUtils";

export default function SavedSearchesTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <h2 className="text-xl font-bold">Сохранённые поиски</h2>
        <p className="text-sm text-slate-500 mt-1">
          Быстрый доступ к фильтрам, которые вы сохранили на странице каталога.
        </p>
      </div>

      <SavedSearchesPanel
        onApply={(filters) => {
          navigate(buildListingUrlFromSavedFilters(filters));
        }}
      />
    </div>
  );
}
