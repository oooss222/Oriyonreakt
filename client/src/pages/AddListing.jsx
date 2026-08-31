import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListingForm from "../components/ListingForm";
import { goToAuth, TOKEN_KEY } from "../lib/auth";

export default function AddListing() {
  const nav = useNavigate();
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
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-ink/8 bg-white p-6 text-center text-ink-400">
          Перенаправление на вход...
        </div>
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
