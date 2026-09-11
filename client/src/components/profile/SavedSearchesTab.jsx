import React from "react";
import { useNavigate } from "react-router-dom";
import SavedSearchesPanel from "../SavedSearchesPanel";
import { buildListingUrlFromSavedFilters } from "./profileUtils";
import { useI18n } from "../../i18n";

export default function SavedSearchesTab() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <h2 className="text-xl font-bold">{t("search.savedSearches")}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t("search.savedTabHint")}
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
