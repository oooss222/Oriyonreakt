import React from "react";
import { formatMoney } from "../lib/format";
import { getPromotionPlans, getPromotionPlan } from "../lib/promotionPlans";
import { Button, Modal, Radio } from "../ui";
import { useI18n, formatPromotionDaysLabel } from "../i18n";

export default function PromotionPlanModal({
  open,
  type,
  walletBalance = 0,
  onClose,
  onConfirm,
  confirming = false,
}) {
  const { t } = useI18n();
  const plans = React.useMemo(
    () => (open ? getPromotionPlans(type) : []),
    [open, type]
  );

  const [selectedDays, setSelectedDays] = React.useState(null);

  React.useEffect(() => {
    if (!open || !plans.length) return;
    setSelectedDays(plans[0].days);
  }, [open, type, plans]);

  const selectedPlan = getPromotionPlan(type, selectedDays);
  const title =
    type === "vip"
      ? t("promotion.connectVipTitle")
      : t("promotion.connectTopTitle");

  return (
    <Modal
      open={Boolean(open && type && plans.length)}
      onClose={onClose}
      title={title}
      description={t("promotion.selectPeriod")}
      size="sm"
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t("promotion.walletBalance")}</span>
            <span className="font-semibold tabular-nums text-ink-900">
              {formatMoney(walletBalance)}
            </span>
          </div>

          <Button
            variant={type === "vip" ? "primary" : "lagoon"}
            size="lg"
            block
            loading={confirming}
            disabled={!selectedPlan}
            onClick={() => onConfirm?.(type, selectedPlan.days)}
          >
            {confirming
              ? t("promotion.activating")
              : selectedPlan
                ? t("promotion.pay", { price: formatMoney(selectedPlan.price) })
                : t("promotion.selectPeriodBtn")}
          </Button>
        </div>
      }
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">{t("promotion.selectPeriod")}</legend>

        {plans.map((plan) => (
          <Radio
            key={plan.days}
            boxed
            name="promotion-plan"
            value={plan.days}
            checked={selectedDays === plan.days}
            onChange={() => setSelectedDays(plan.days)}
            label={
              <span className="flex w-full items-center justify-between gap-3">
                <span className="font-semibold text-ink-900">
                  {formatPromotionDaysLabel(t, plan.days)}
                </span>
                <span className="font-bold tabular-nums text-ink-900">
                  {formatMoney(plan.price)}
                </span>
              </span>
            }
          />
        ))}
      </fieldset>
    </Modal>
  );
}
