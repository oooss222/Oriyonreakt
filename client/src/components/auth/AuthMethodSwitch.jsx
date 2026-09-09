import React from "react";
import { Mail, Phone } from "lucide-react";
import { SegmentedControl } from "../../ui";
import { useI18n } from "../../i18n";

export default function AuthMethodSwitch({ value, onChange }) {
  const { t } = useI18n();

  return (
    <SegmentedControl
      className="auth-segmented"
      label={t("auth.methodAria")}
      value={value}
      onChange={onChange}
      items={[
        { value: "phone", label: t("auth.phone"), icon: Phone },
        { value: "email", label: t("auth.email"), icon: Mail },
      ]}
    />
  );
}
