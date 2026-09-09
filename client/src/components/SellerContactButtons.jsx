import React from "react";
import { MessageCircle, Phone } from "lucide-react";
import { buildTelegramHref, buildWhatsappHref } from "../lib/sellerContact";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();

  if (!canContact) {
    return null;
  }

  const whatsappHref = buildWhatsappHref(whatsapp);
  const telegramHref = buildTelegramHref(telegram);
  const hasPhone = Boolean(String(phone || "").trim());
  const btnSize = compact ? "" : "btn-lg";

  if (layout === "ad") {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {hasPhone &&
          (phoneVisible ? (
            <a href={`tel:${phone}`} className="btn btn-primary btn-lg btn-block">
              <Phone className="h-5 w-5" aria-hidden />
              {phone}
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              onClick={onRevealPhone}
            >
              <Phone className="h-5 w-5" aria-hidden />
              {t("seller.showPhone")}
            </button>
          ))}

        {(whatsappHref || telegramHref) && (
          <div className="grid grid-cols-2 gap-2">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg border-[#1FBF5B] bg-[#25D366] text-white hover:border-[#1FBF5B] hover:bg-[#20bd5a]"
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
                className="btn btn-lg border-[#1E93CB] bg-[#229ED9] text-white hover:border-[#1E93CB] hover:bg-[#1d8fc7]"
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
          className="btn btn-lg btn-block"
          onClick={onChat}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {t("seller.writeSeller")}
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
          className={`btn btn-block border-[#1FBF5B] bg-[#25D366] text-white hover:border-[#1FBF5B] hover:bg-[#20bd5a] ${btnSize}`}
        >
          {t("seller.writeWhatsapp")}
        </a>
      ) : (
        <button
          type="button"
          className={`btn btn-primary btn-block ${btnSize}`}
          onClick={onChat}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {compact ? t("seller.write") : t("seller.writeSeller")}
        </button>
      )}

      {whatsappHref && (
        <button
          type="button"
          className={`btn btn-block ${btnSize}`}
          onClick={onChat}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {compact ? t("seller.writeChat") : t("seller.writeOriyon")}
        </button>
      )}

      {hasPhone &&
        (phoneVisible ? (
          <a
            href={`tel:${phone}`}
            className={`btn btn-block ${btnSize}`}
          >
            <Phone className="h-5 w-5" aria-hidden />
            {phone}
          </a>
        ) : (
          <button
            type="button"
            className={`btn btn-block ${btnSize}`}
            onClick={onRevealPhone}
          >
            <Phone className="h-5 w-5" aria-hidden />
            {compact ? t("seller.call") : t("seller.showPhone")}
          </button>
        ))}

      {telegramHref && (
        <a
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn btn-block border-[#1E93CB] bg-[#229ED9] text-white hover:border-[#1E93CB] hover:bg-[#1d8fc7] ${btnSize}`}
        >
          Telegram
        </a>
      )}

      {!hasPhone && !whatsappHref && (
        <p className="px-2 text-center text-xs text-ink-400">
          {t("seller.preferChat")}
        </p>
      )}
    </div>
  );
}
