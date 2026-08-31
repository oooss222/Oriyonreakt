import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import ListingForm from "../components/ListingForm";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [initialData, setInitialData] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      goToAuth(nav);
      return;
    }

    let alive = true;
    let me = null;

    try {
      me = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      me = null;
    }

    const myId = me?.id || me?._id;

    api
      .listingById(id)
      .then((ad) => {
        if (!alive) return;

        const ownerId = ad?.owner || ad?.ownerId || ad?.userId;
        if (myId && ownerId && String(ownerId) !== String(myId)) {
          setErr("forbidden");
          return;
        }

        setInitialData(ad);
      })
      .catch((e) => {
        if (alive) setErr(e.message || "Ошибка загрузки объявления");
      });

    return () => {
      alive = false;
    };
  }, [id, token, nav]);

  if (err) {
    const forbidden = err === "forbidden" || /forbidden/i.test(err);

    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6 text-center space-y-4">
          <p>
            {forbidden
              ? "Вы можете редактировать только свои объявления."
              : err}
          </p>
          <button
            type="button"
            onClick={() => nav("/profile?tab=my")}
            className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white px-4 py-2 hover:bg-mist text-ink-600"
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
        <div className="rounded-2xl border border-ink/8 bg-white p-6 text-center text-ink-400">
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
