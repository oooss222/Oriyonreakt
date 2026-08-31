import { ApiError, getUserFacingErrorMessage } from "./apiError";

export function getListingFormErrorMessage(err, t, fallback) {
  const status = err?.status || 0;
  const msg = String(err?.message || "");
  const code = String(err?.code || "");
  const details = err?.details || {};

  if (
    code === "LISTING_LIMIT_REACHED" ||
    /listing limit reached/i.test(msg)
  ) {
    const limit = details.limit ?? err?.limit;
    return t
      ? t("listing.errorLimit", { limit: limit || "—" })
      : `Достигнут лимит объявлений${limit ? ` (${limit})` : ""}.`;
  }

  if (
    status === 413 ||
    /payload too large|file too large|too large/i.test(msg)
  ) {
    return t ? t("listing.errorFileTooLarge") : "Файл слишком большой.";
  }

  if (
    /moderation|rejected|cloudinary|inappropriate/i.test(msg) ||
    code === "PHOTO_REJECTED"
  ) {
    return t ? t("listing.errorPhotoRejected") : "Фото не прошло проверку.";
  }

  if (status === 429 || /rate limit|too many requests/i.test(msg)) {
    return t ? t("listing.errorRateLimit") : "Слишком много запросов. Подождите немного.";
  }

  if (status === 403 && /forbidden/i.test(msg)) {
    return t ? t("listing.errorForbidden") : "Нет доступа к этому объявлению.";
  }

  if (err instanceof ApiError) {
    return getUserFacingErrorMessage(err, t || fallback);
  }

  return getUserFacingErrorMessage(err, t || fallback);
}
