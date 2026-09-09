import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { api } from "../lib/api";
import ListingForm from "../components/ListingForm";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";
import { EmptyState, Skeleton } from "../ui";
import { useI18n } from "../i18n";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
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
        if (alive) setErr(e.message || t("listing.saveError"));
      });

    return () => {
      alive = false;
    };
  }, [id, token, nav, t]);

  if (err) {
    const forbidden = err === "forbidden" || /forbidden/i.test(err);

    return (
      <div className="page-container py-10">
        <EmptyState
          icon={ShieldAlert}
          title={forbidden ? t("listing.editForbidden") : t("listing.saveError")}
          description={forbidden ? undefined : err}
          actionLabel={t("listing.backToMine")}
          onAction={() => nav("/profile?tab=my")}
        />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="listing-form-page" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <div className="card space-y-3 p-5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-32 w-full" />
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
