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
  layout = "default",
  className = "",
}) {
  if (!canContact) {
    return null;
  }

  const whatsappHref = buildWhatsappHref(whatsapp);
  const telegramHref = buildTelegramHref(telegram);
  const hasPhone = Boolean(String(phone || "").trim());
  const btnSize = compact ? "py-2.5 text-sm" : "py-3 text-base";

  if (layout === "ad") {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {hasPhone &&
          (phoneVisible ? (
            <a
              href={`tel:${phone}`}
              className="btn btn-primary w-full rounded-2xl font-semibold py-3"
            >
              <Phone className="h-5 w-5" />
              {phone}
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-primary w-full rounded-2xl font-semibold py-3"
              onClick={onRevealPhone}
            >
              <Phone className="h-5 w-5" />
              Показать телефон
            </button>
          ))}

        {(whatsappHref || telegramHref) && (
          <div className="grid grid-cols-2 gap-2">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn rounded-2xl bg-[#25D366] text-white border-[#25D366] hover:bg-[#20bd5a] font-semibold py-3"
              >
                WhatsApp
              </a>
            ) : (
              <span />
            )}
            {telegramHref ? (
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn rounded-2xl bg-[#229ED9] text-white border-[#229ED9] hover:bg-[#1d8fc7] font-semibold py-3"
              >
                Telegram
              </a>
            ) : (
              <span />
            )}
          </div>
        )}

        <button
          type="button"
          className="btn w-full rounded-2xl border border-slate-200 bg-white py-3 font-semibold hover:bg-slate-50"
          onClick={onChat}
        >
          <MessageCircle className="h-5 w-5" />
          Написать продавцу
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn w-full rounded-2xl bg-[#25D366] text-white border-[#25D366] hover:bg-[#20bd5a] font-semibold ${btnSize}`}
        >
          Написать в WhatsApp
        </a>
      ) : (
        <button
          type="button"
          className={`btn btn-primary w-full rounded-2xl font-semibold ${btnSize}`}
          onClick={onChat}
        >
          <MessageCircle className="w-5 h-5" />
          {compact ? "Написать" : "Написать продавцу"}
        </button>
      )}

      {whatsappHref && (
        <button
          type="button"
          className={`btn w-full rounded-2xl border ${btnSize}`}
          onClick={onChat}
        >
          <MessageCircle className="w-5 h-5" />
          {compact ? "Чат на сайте" : "Написать в чат Oriyon"}
        </button>
      )}

      {hasPhone &&
        (phoneVisible ? (
          <a
            href={`tel:${phone}`}
            className={`btn w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 ${btnSize}`}
          >
            <Phone className="w-5 h-5" />
            {phone}
          </a>
        ) : (
          <button
            type="button"
            className={`btn w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 ${btnSize}`}
            onClick={onRevealPhone}
          >
            <Phone className="w-5 h-5" />
            {compact ? "Позвонить" : "Показать телефон"}
          </button>
        ))}

      {telegramHref && (
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn w-full rounded-2xl bg-[#229ED9] text-white border-[#229ED9] hover:bg-[#1d8fc7] ${btnSize}`}
        >
          Telegram
        </a>
      )}

      {!hasPhone && !whatsappHref && (
        <p className="text-xs text-center text-slate-500 px-2">
          Продавец предпочитает сообщения на сайте
        </p>
      )}
    </div>
  );
}
