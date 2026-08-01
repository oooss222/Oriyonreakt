import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListingForm from "../components/ListingForm";
import ListingPublishSuccess from "../components/listing-form/ListingPublishSuccess";
import { goToAuth, TOKEN_KEY } from "../lib/auth";

export default function AddListing() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") || "";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [allowed, setAllowed] = React.useState(Boolean(token));
  const [published, setPublished] = React.useState(null);

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
        <div className="rounded-2xl border bg-white p-6 text-center text-slate-600">
          Перенаправление на вход...
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <ListingPublishSuccess
        listing={published}
        onDone={() => nav("/profile?tab=my")}
      />
    );
  }

  return (
    <ListingForm
      mode="create"
      initialCat={initialCat}
      backTo="/profile?tab=my"
      onSuccess={(created) => setPublished(created)}
    />
  );
}
