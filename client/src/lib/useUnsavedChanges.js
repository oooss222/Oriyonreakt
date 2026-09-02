import React from "react";
import { useBlocker } from "react-router-dom";
import { useI18n } from "../i18n";

export function useUnsavedChanges(isDirty) {
  const { t } = useI18n();
  const dirty = Boolean(isDirty);
  const blocker = useBlocker(dirty);

  React.useEffect(() => {
    if (!dirty) return undefined;

    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  React.useEffect(() => {
    if (blocker.state !== "blocked") return;

    const leave = window.confirm(t("listing.unsavedConfirm"));

    if (leave) blocker.proceed();
    else blocker.reset();
  }, [blocker, t]);
}
