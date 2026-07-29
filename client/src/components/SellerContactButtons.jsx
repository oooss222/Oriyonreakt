import React from "react";
import { MessageCircle, Phone } from "lucide-react";
import { buildTelegramHref, buildWhatsappHref } from "../lib/sellerContact";

export default function SellerContactButtons({
  phone = "",
  whatsapp = "",
  telegram = "",
  phoneVisible = false,
  onRevealPhone,
  onChat,
  canContact = true,
  compact = false,
  className = "",
}) {
  if (!canContact) {
    return null;
  }

  const whatsappHref = buildWhatsappHref(whatsapp);
  const telegramHref = buildTelegramHref(telegram);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {phone ? (
        phoneVisible ? (
          <a
            href={`tel:${phone}`}
            className={`btn btn-primary w-full rounded-2xl ${compact ? "py-2.5 text-sm" : "py-3 text-base"}`}
          >
            <Phone className="w-5 h-5" />
            {phone}
          </a>
        ) : (
          <button
            type="button"
            className={`btn btn-primary w-full rounded-2xl ${compact ? "py-2.5 text-sm" : "py-3 text-base"}`}
            onClick={onRevealPhone}
          >
            <Phone className="w-5 h-5" />
            {compact ? "Позвонить" : "Показать телефон"}
          </button>
        )
      ) : (
        <button
          type="button"
          className="btn w-full py-3 rounded-2xl opacity-60 cursor-not-allowed"
          disabled
        >
          <Phone className="w-5 h-5" />
          Телефон не указан
        </button>
      )}

      <button
        type="button"
        className={`btn w-full rounded-2xl ${compact ? "py-2.5 text-sm" : "py-3"}`}
        onClick={onChat}
      >
        <MessageCircle className="w-5 h-5" />
        {compact ? "Чат" : "Написать продавцу"}
      </button>

      {(whatsappHref || telegramHref) && (
        <div className={`grid gap-2 ${whatsappHref && telegramHref ? "grid-cols-2" : "grid-cols-1"}`}>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn rounded-2xl bg-[#25D366] text-white border-[#25D366] hover:bg-[#20bd5a] ${compact ? "py-2.5 text-sm" : "py-3"}`}
            >
              WhatsApp
            </a>
          )}

          {telegramHref && (
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn rounded-2xl bg-[#229ED9] text-white border-[#229ED9] hover:bg-[#1d8fc7] ${compact ? "py-2.5 text-sm" : "py-3"}`}
            >
              Telegram
            </a>
          )}
        </div>
      )}
    </div>
  );
}
