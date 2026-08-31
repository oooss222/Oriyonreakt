import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  List,
  Pencil,
  Phone,
  Eye,
} from "lucide-react";
import { useI18n } from "../../i18n";

function statusMeta(status, t) {
  const key = String(status || "pending").toLowerCase();

  if (key === "approved") {
    return {
      icon: CheckCircle2,
      tone: "border-lagoon/20 bg-lagoon/5 text-lagoon-700",
      iconClass: "bg-lagoon text-white",
      title: t("listing.submitApprovedTitle"),
      body: t("listing.submitApprovedBody"),
    };
  }

  if (key === "rejected") {
    return {
      icon: XCircle,
      tone: "border-red-200 bg-red-50 text-red-700",
      iconClass: "bg-red-500 text-white",
      title: t("listing.submitRejectedTitle"),
      body: t("listing.submitRejectedBody"),
    };
  }

  return {
    icon: Clock3,
    tone: "border-sun/20 bg-sun-50 text-sun-800",
    iconClass: "bg-sun text-white",
    title: t("listing.submitPendingTitle"),
    body: t("listing.submitPendingBody"),
  };
}

export default function ListingSubmitResult({ listing, onEditAgain }) {
  const { t } = useI18n();
  const id = listing?.id || listing?._id;
  const meta = statusMeta(listing?.status, t);
  const Icon = meta.icon;
  const status = String(listing?.status || "pending").toLowerCase();

  return (
    <div className="listing-form-page min-h-[calc(100vh-4rem)]">
      <div className={`mx-auto max-w-xl rounded-[1.35rem] border p-6 md:p-8 shadow-soft ${meta.tone}`}>
        <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${meta.iconClass}`}>
          <Icon size={28} />
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {meta.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{meta.body}</p>

        {listing?.title ? (
          <div className="mt-5 rounded-xl border border-ink/8 bg-white/80 px-4 py-3 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-300">
              {t("listing.submitListingLabel")}
            </div>
            <div className="mt-1 font-semibold text-ink line-clamp-2">
              {listing.title}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5">
          {id && status !== "rejected" ? (
            <Link
              to={`/ad/${id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sun px-4 py-3 text-sm font-semibold text-white hover:bg-sun-600"
            >
              <Eye size={16} />
              {t("listing.submitViewAd")}
            </Link>
          ) : null}

          {status === "rejected" && onEditAgain ? (
            <button
              type="button"
              onClick={onEditAgain}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sun px-4 py-3 text-sm font-semibold text-white hover:bg-sun-600"
            >
              <Pencil size={16} />
              {t("listing.submitFix")}
            </button>
          ) : null}

          <Link
            to="/profile?tab=my"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink-600 hover:bg-mist"
          >
            <List size={16} />
            {t("listing.submitMyListings")}
          </Link>

          <Link
            to="/profile?tab=profile"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink-600 hover:bg-mist"
          >
            <Phone size={16} />
            {t("listing.submitCheckPhone")}
          </Link>
        </div>
      </div>
    </div>
  );
}
