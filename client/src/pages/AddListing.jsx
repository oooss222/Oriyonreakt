import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListingForm from "../components/ListingForm";
import { goToAuth, TOKEN_KEY } from "../lib/auth";
import { Spinner } from "../ui";
import { useI18n } from "../i18n";

export default function AddListing() {
  const nav = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") || "";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [allowed, setAllowed] = React.useState(Boolean(token));

  React.useEffect(() => {
    if (!token) {
      goToAuth(
        nav,
        `/add${initialCat ? `?cat=${encodeURIComponent(initialCat)}` : ""}`
      );
      return;
    }

    setAllowed(true);
  }, [nav, token, initialCat]);

  if (!allowed) {
    return (
      <div
        className="page-container flex items-center justify-center gap-3 py-16 text-sm text-ink-400"
        role="status"
      >
        <Spinner size={18} />
        {t("auth.redirecting")}
      </div>
    );
  }

  return (
    <ListingForm
      mode="create"
      initialCat={initialCat}
      backTo="/profile?tab=my"
      onSuccess={(created) => nav(`/ad/${created.id || created._id}`)}
    />
  );
}
