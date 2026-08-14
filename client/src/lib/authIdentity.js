export function translateAuthMessage(t, code, fallback) {
  if (code) {
    const key = `errors.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return fallback || t("errors.generic");
}

export function getAuthIdentityAction(code, t) {
  if (code === "EMAIL_ALREADY_REGISTERED" || code === "PHONE_ALREADY_REGISTERED") {
    return { tab: "login", label: t("auth.goLogin") };
  }

  if (code === "EMAIL_NOT_FOUND" || code === "USER_NOT_FOUND") {
    return { tab: "register", label: t("auth.goRegister") };
  }

  return null;
}

export function applyIdentityCheckResult(result, { setErr, setIdentityHint, t }) {
  if (!result || result.ok !== false) {
    setIdentityHint(null);
    return;
  }

  setErr(translateAuthMessage(t, result.code, result.message || t("errors.checkData")));
  setIdentityHint(getAuthIdentityAction(result.code, t));
}

export function applyAuthError(error, { setErr, setIdentityHint, t }) {
  const code = error?.code || "";
  const fallback =
    error?.message ||
    (error?.kind === "network" ? t("errors.network") : t("errors.generic"));

  setErr(translateAuthMessage(t, code, fallback));
  setIdentityHint(getAuthIdentityAction(code, t));
}
