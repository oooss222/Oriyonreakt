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
      tone: "border-success-200 bg-success-50",
      iconClass: "bg-success-500 text-white",
      title: t("listing.submitApprovedTitle"),
      body: t("listing.submitApprovedBody"),
    };
  }

  if (key === "rejected") {
    return {
      icon: XCircle,
      tone: "border-danger-200 bg-danger-50",
      iconClass: "bg-danger-500 text-white",
      title: t("listing.submitRejectedTitle"),
      body: t("listing.submitRejectedBody"),
    };
  }

  return {
    icon: Clock3,
    tone: "border-sun-200 bg-sun-50",
    iconClass: "bg-sun-500 text-white",
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
      <section
        className={`mx-auto max-w-xl rounded-2xl border p-6 shadow-xs md:p-8 ${meta.tone}`}
        aria-live="polite"
      >
        <span
          className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${meta.iconClass}`}
        >
          <Icon size={28} aria-hidden />
        </span>

        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
          {meta.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{meta.body}</p>

        {listing?.title ? (
          <div className="mt-5 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm">
            <p className="label-caps text-ink-400">
              {t("listing.submitListingLabel")}
            </p>
            <p className="mt-1 font-semibold text-ink-900 line-clamp-2">
              {listing.title}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5">
          {id && status !== "rejected" ? (
            <Link to={`/ad/${id}`} className="btn btn-primary btn-lg btn-block">
              <Eye size={17} aria-hidden />
              {t("listing.submitViewAd")}
            </Link>
          ) : null}

          {status === "rejected" && onEditAgain ? (
            <button
              type="button"
              onClick={onEditAgain}
              className="btn btn-primary btn-lg btn-block"
            >
              <Pencil size={17} aria-hidden />
              {t("listing.submitFix")}
            </button>
          ) : null}

          <Link to="/profile?tab=my" className="btn btn-lg btn-block">
            <List size={17} aria-hidden />
            {t("listing.submitMyListings")}
          </Link>

          <Link to="/profile?tab=profile" className="btn btn-lg btn-block">
            <Phone size={17} aria-hidden />
            {t("listing.submitCheckPhone")}
          </Link>
        </div>
      </section>
    </div>
  );
}
