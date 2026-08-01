import React from "react";
import {
  getPromotionCardAccent,
  getPromotionCardClass,
  getPromotionCardSideStripe,
} from "../lib/promotionStyles";

export default function PromotionCardFrame({
  vip = false,
  top = false,
  children,
  className = "",
  ...props
}) {
  const accentClass = getPromotionCardAccent({ vip, top });
  const stripeClass = getPromotionCardSideStripe({ vip, top });
  const promotionClass = getPromotionCardClass({ vip, top });

  return (
    <div
      className={[promotionClass, className].filter(Boolean).join(" ")}
      {...props}
    >
      {accentClass && <span className={accentClass} aria-hidden="true" />}
      {stripeClass && <span className={stripeClass} aria-hidden="true" />}
      {children}
    </div>
  );
}

export function PromotionCardDecor({ vip = false, top = false }) {
  const accentClass = getPromotionCardAccent({ vip, top });
  const stripeClass = getPromotionCardSideStripe({ vip, top });

  if (!accentClass && !stripeClass) {
    return null;
  }

  return (
    <>
      {accentClass && <span className={accentClass} aria-hidden="true" />}
      {stripeClass && <span className={stripeClass} aria-hidden="true" />}
    </>
  );
}
