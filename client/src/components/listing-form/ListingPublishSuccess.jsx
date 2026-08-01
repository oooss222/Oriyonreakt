import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Crown, TrendingUp, ArrowRight } from "lucide-react";
import { clearListingDraft } from "../../lib/listingDraft";

export default function ListingPublishSuccess({ listing, onDone }) {
  const id = listing?.id || listing?._id;

  React.useEffect(() => {
    clearListingDraft();
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border bg-white p-6 sm:p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Объявление отправлено</h1>
        <p className="mt-2 text-sm text-slate-600">
          После модерации оно появится в каталоге. Хотите получить больше просмотров?
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to={`/profile?tab=promote`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            <Crown size={18} />
            Подключить VIP
          </Link>
          <Link
            to={`/profile?tab=promote`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-lagoon-700 px-4 py-3 text-sm font-semibold text-white shadow-sm"
          >
            <TrendingUp size={18} />
            Подключить TOP
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {id && (
            <Link
              to={`/ad/${id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Перейти к объявлению
              <ArrowRight size={16} />
            </Link>
          )}
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Мои объявления
          </button>
        </div>
      </div>
    </div>
  );
}
