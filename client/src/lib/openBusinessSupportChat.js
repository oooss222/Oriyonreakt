import { api } from "./api";
import { goToAuth } from "./auth";

export const BUSINESS_SUPPORT_TITLE = "Diyor Premium — консультация";

export const BUSINESS_SUPPORT_DRAFT =
  "Здравствуйте! Интересует премиум-аккаунт Diyor Premium. Подскажите, пожалуйста, условия подключения.";

export function isBusinessSupportThread(item) {
  if (!item) return false;
  if (item.isBusinessSupport) return true;

  const title = String(item.listingTitle || "").toLowerCase();

  return (
    title.includes("diyor premium") ||
    title.includes("oriyon premium") ||
    title.includes("diyor бизнес") ||
    title.includes("oriyon бизнес") ||
    title.includes("консультация") ||
    title.includes("поддержка")
  );
}

export async function openBusinessSupportChat({ nav, token }) {
  const contact = await api.businessSupportContact();

  const params = new URLSearchParams({
    listingId: contact.listingId,
    peerId: contact.adminId,
    title: BUSINESS_SUPPORT_TITLE,
    peerName: contact.adminName || "Администратор Diyor",
    support: "1",
    draft: BUSINESS_SUPPORT_DRAFT,
  });

  const path = `/messages?${params.toString()}`;

  if (!token) {
    goToAuth(nav, path);
    return;
  }

  nav(path);
}
