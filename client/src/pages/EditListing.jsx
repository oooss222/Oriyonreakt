import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import ListingForm from "../components/ListingForm";

const TOKEN_KEY = "auth_token";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [initialData, setInitialData] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    let alive = true;

    api
      .listingById(id)
      .then((ad) => {
        if (alive) setInitialData(ad);
      })
      .catch((e) => {
        if (alive) setErr(e.message || "Ошибка загрузки объявления");
      });

    return () => {
      alive = false;
    };
  }, [id, token]);

  if (err) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6 text-center space-y-4">
          <p>{err}</p>
          <button
            type="button"
            onClick={() => nav("/profile?tab=my")}
            className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 hover:bg-slate-50"
          >
            К моим объявлениям
          </button>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-6 text-center">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <ListingForm
      mode="edit"
      listingId={id}
      initialData={initialData}
      backTo="/profile?tab=my"
      onSuccess={(updated) => nav(`/ad/${updated.id || updated._id}`)}
    />
  );
}
