import { api } from "./api";
import { goToAuth } from "./auth";

export const BUSINESS_SUPPORT_DRAFT =
  "Здравствуйте! Хочу подключить бизнес-аккаунт Oriyon Бизнес. Расскажите, пожалуйста, об условиях и стоимости.";

export async function openBusinessSupportChat({ nav, token }) {
  const contact = await api.businessSupportContact();

  const params = new URLSearchParams({
    listingId: contact.listingId,
    peerId: contact.adminId,
    title: contact.title || "Oriyon Бизнес",
    draft: BUSINESS_SUPPORT_DRAFT,
  });

  const path = `/messages?${params.toString()}`;

  if (!token) {
    goToAuth(nav, path);
    return;
  }

  nav(path);
}
