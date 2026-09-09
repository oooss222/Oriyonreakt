import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MessageCircle, ChevronRight } from "lucide-react";
import { openBusinessSupportChat } from "../lib/openBusinessSupportChat";
import { Alert, Button } from "../ui";
import { useI18n } from "../i18n";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export default function BusinessPromoBanner({
  className = "",
  hideForCompany = true,
  sellerType: sellerTypeProp,
}) {
  const { t } = useI18n();
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sellerType, setSellerType] = React.useState(sellerTypeProp || "private");

  React.useEffect(() => {
    if (sellerTypeProp) {
      setSellerType(sellerTypeProp);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      setSellerType(user?.sellerType || "private");
    } catch {
      setSellerType("private");
    }
  }, [sellerTypeProp]);

  if (hideForCompany && sellerType === "company") {
    return null;
  }

  const handleClick = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      await openBusinessSupportChat({ nav, token });
    } catch (e) {
      setError(e.message || t("business.chatFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`surface-panel relative overflow-hidden ${className}`}
      aria-label="Oriyon Premium"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-sun-500" aria-hidden="true" />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="icon-box-sun h-12 w-12 shrink-0">
            <Building2 size={22} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="label-caps text-sun-700">Oriyon Premium</p>
            <h3 className="mt-0.5 font-display text-lg font-bold text-ink-900">
              {t("business.promoTitle")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {t("business.promoDesc")}
            </p>
            {error && (
              <Alert tone="danger" className="mt-3">
                {error}
              </Alert>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={MessageCircle}
            iconRight={loading ? undefined : ChevronRight}
            loading={loading}
            onClick={handleClick}
            className="w-full shrink-0 sm:w-auto"
          >
            {loading ? t("business.openingChat") : t("business.contactAdmin")}
          </Button>
        </div>
      </div>
    </section>
  );
}
