import React from "react";
import StatusBadge from "./StatusBadge";
import { useI18n } from "../../i18n";

export default function AdminSystemSection() {
  const { t } = useI18n();
  const [state, setState] = React.useState({ loading: true, error: "", health: null });

  const load = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetch("/api/health");
      const health = await response.json().catch(() => ({}));
      setState({
        loading: false,
        error: response.ok ? "" : t("admin.system.unavailable"),
        health,
      });
    } catch {
      setState({ loading: false, error: t("admin.system.unavailable"), health: null });
    }
  }, [t]);

  React.useEffect(() => {
    load();
  }, [load]);

  const dbOk = state.health?.db === "postgresql" && state.health?.ok === true;

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <div>
          <h2 className="admin-panel__title">{t("admin.system.title")}</h2>
          <p className="text-sm text-ink-500 mt-1">{t("admin.system.notice")}</p>
        </div>
        <button type="button" className="admin-button" onClick={load}>
          {t("admin.shell.retry")}
        </button>
      </header>
      <div className="admin-panel__body">
        {state.loading ? (
          <div className="space-y-2" aria-busy="true">
            <div className="h-14 rounded-xl bg-mist-100 animate-pulse" />
            <div className="h-14 rounded-xl bg-mist-100 animate-pulse" />
          </div>
        ) : (
          <ul className="space-y-2">
            <li className="admin-status-row">
              <span>{t("admin.system.api")}</span>
              <StatusBadge status={state.error ? "failed" : "operational"}>
                {state.error ? t("admin.system.down") : t("admin.system.up")}
              </StatusBadge>
            </li>
            <li className="admin-status-row">
              <span>{t("admin.system.database")}</span>
              <StatusBadge status={dbOk ? "operational" : "failed"}>
                {dbOk ? t("admin.system.up") : t("admin.system.down")}
              </StatusBadge>
            </li>
          </ul>
        )}
        {state.error && !state.loading && (
          <p className="text-sm text-red-700">{state.error}</p>
        )}
      </div>
    </section>
  );
}
