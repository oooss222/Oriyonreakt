import React from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { useI18n } from "../../i18n";

export function AuthMobileBenefits({ mode = "login" }) {
  const { t } = useI18n();
  const chips =
    mode === "register"
      ? [t("auth.chipFree"), t("auth.chipNoFee"), t("auth.chipOneMinute")]
      : [t("auth.chipSafe"), t("auth.chipFree")];

  return (
    <div className="auth-mobile-benefits lg:hidden">
      {chips.map((chip) => (
        <span key={chip} className="auth-mobile-benefits__chip">
          {chip}
        </span>
      ))}
    </div>
  );
}

export default function AuthTrustPanel({ mode = "login" }) {
  const { t } = useI18n();
  const isRegister = mode === "register";

  const registerChips = [
    t("auth.chipFree"),
    t("auth.chipNoFee"),
    t("auth.chipOneMinute"),
  ];

  const items = isRegister
    ? [
        {
          icon: Clock3,
          title: t("auth.trustRegisterItem1Title"),
          text: t("auth.trustRegisterItem1Text"),
        },
        {
          icon: Tag,
          title: t("auth.trustRegisterItem2Title"),
          text: t("auth.trustRegisterItem2Text"),
        },
        {
          icon: Users,
          title: t("auth.trustRegisterItem3Title"),
          text: t("auth.trustRegisterItem3Text"),
        },
      ]
    : [
        {
          icon: Tag,
          title: t("auth.trustLoginItem1Title"),
          text: t("auth.trustLoginItem1Text"),
        },
        {
          icon: MessageCircle,
          title: t("auth.trustLoginItem2Title"),
          text: t("auth.trustLoginItem2Text"),
        },
        {
          icon: ShieldCheck,
          title: t("auth.trustLoginItem3Title"),
          text: t("auth.trustLoginItem3Text"),
        },
      ];

  return (
    <div className="auth-trust-wrap">
      <div className="auth-trust-panel">
        <div className="auth-trust-panel__badge">
          <Sparkles size={14} className="text-sun" />
          {isRegister ? t("auth.trustRegisterBadge") : t("auth.trustLoginBadge")}
        </div>

        <h2 className="auth-trust-panel__title">
          {isRegister ? t("auth.trustRegisterTitle") : t("auth.trustLoginTitle")}
        </h2>

        <p className="auth-trust-panel__text">
          {isRegister ? t("auth.trustRegisterText") : t("auth.trustLoginText")}
        </p>

        {isRegister ? (
          <div className="auth-trust-panel__chips">
            {registerChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        ) : null}

        <ul className="auth-trust-panel__list">
          {items.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="auth-trust-panel__icon">
                <Icon size={18} />
              </span>
              <div>
                <div className="font-semibold text-white">{title}</div>
                <div className="mt-1 text-sm text-white/70">{text}</div>
              </div>
            </li>
          ))}
        </ul>

        <p className="auth-trust-panel__legal">
          {t("auth.trustLegalPrefix")}{" "}
          <Link to="/policy" className="underline hover:text-white">
            {t("auth.trustLegalLink")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
