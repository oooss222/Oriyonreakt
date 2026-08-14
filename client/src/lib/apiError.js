export class ApiError extends Error {
  constructor(message, { kind = "unknown", status = 0, code = "", cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

export function isNetworkError(err) {
  if (err instanceof ApiError) return err.kind === "network";
  return (
    err instanceof TypeError ||
    err?.name === "AbortError" ||
    /failed to fetch|networkerror|load failed/i.test(String(err?.message || ""))
  );
}

export function getUserFacingErrorMessage(err, tOrFallback) {
  const t = typeof tOrFallback === "function" ? tOrFallback : null;
  const fallback =
    typeof tOrFallback === "string"
      ? tOrFallback
      : t
        ? t("errors.generic")
        : "Что-то пошло не так";

  if (err instanceof ApiError) return err.message;

  if (isNetworkError(err)) {
    return t ? t("errors.network") : "Нет соединения с сервером. Проверьте интернет и попробуйте снова.";
  }

  const msg = String(err?.message || "").trim();

  if (!msg || msg.startsWith("HTTP ")) {
    if (msg === "HTTP 401") {
      return t ? t("errors.loginRequired") : "Войдите в аккаунт, чтобы продолжить.";
    }
    if (msg === "HTTP 503" || msg === "HTTP 502") {
      return t
        ? t("errors.serverUnavailable")
        : "Сервер временно недоступен. Попробуйте через минуту.";
    }
    return fallback;
  }

  return msg;
}
