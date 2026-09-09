import React from "react";
import { useBlocker } from "react-router-dom";
import { useConfirm } from "../ui";
import { useI18n } from "../i18n";

export function useUnsavedChanges(isDirty) {
  const { t } = useI18n();
  const confirm = useConfirm();
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
    if (blocker.state !== "blocked") return undefined;

    let cancelled = false;

    confirm({
      title: t("listing.unsavedTitle"),
      message: t("listing.unsavedConfirm"),
      confirmLabel: t("listing.unsavedLeave"),
      cancelLabel: t("listing.unsavedStay"),
      tone: "danger",
    }).then((leave) => {
      if (cancelled) return;
      if (leave) blocker.proceed();
      else blocker.reset();
    });

    return () => {
      cancelled = true;
    };
  }, [blocker, t, confirm]);
}
