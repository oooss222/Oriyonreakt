export function getAuthIdentityAction(code) {
  if (code === "EMAIL_ALREADY_REGISTERED" || code === "PHONE_ALREADY_REGISTERED") {
    return { tab: "login", label: "Перейти ко входу" };
  }

  if (code === "EMAIL_NOT_FOUND" || code === "USER_NOT_FOUND") {
    return { tab: "register", label: "Зарегистрироваться" };
  }

  return null;
}

export function applyIdentityCheckResult(result, { setErr, setIdentityHint }) {
  if (!result || result.ok !== false) {
    setIdentityHint(null);
    return;
  }

  setErr(result.message || "Проверьте введённые данные");
  setIdentityHint(getAuthIdentityAction(result.code));
}

export function applyAuthError(error, { setErr, setIdentityHint }) {
  const code = error?.code || "";
  setErr(error?.message || "Что-то пошло не так");
  setIdentityHint(getAuthIdentityAction(code));
}
