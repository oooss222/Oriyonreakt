import React from "react";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

const FORMATS = [
  ["Главная, под шапкой", "970×250 и 320×100", "Сайт"],
  ["Карточка в ленте", "как объявление, пометка «Реклама»", "Сайт и приложение"],
  ["Категория и поиск", "баннер над списком, можно выбрать категорию или слова", "Сайт и приложение"],
  ["Боковая колонка", "300×600, только десктоп", "Сайт"],
  ["Страница объявления", "под фото и под описанием", "Сайт и приложение"],
  ["Липкий низ", "320×50, закрывается на час", "Мобильный сайт и приложение"],
  ["После публикации", "блок на экране успеха", "Сайт и приложение"],
];

export default function Advertise() {
  const { t } = useI18n();
  const [form, setForm] = React.useState({
    name: "",
    contact: "",
    company: "",
    placement: "home_top",
    message: "",
  });
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      await api.adInquiry(form);
      setSent(true);
    } catch (submitError) {
      setError(submitError.message || t("ads.inquiryError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-x py-8 space-y-8">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-ink">{t("ads.pageTitle")}</h1>
        <p className="mt-3 text-ink-500">{t("ads.pageLead")}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {FORMATS.map(([title, size, where]) => (
          <div key={title} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{where}</div>
            <div className="mt-1 font-semibold text-ink">{title}</div>
            <div className="mt-1 text-sm text-ink-500">{size}</div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-3 rounded-3xl border border-ink/10 bg-white p-5">
        <h2 className="text-lg font-bold text-ink">{t("ads.inquiryTitle")}</h2>
        {sent ? (
          <p className="text-sm text-emerald-700">{t("ads.inquirySent")}</p>
        ) : (
          <>
            <input className="input w-full" required placeholder={t("ads.inquiryName")} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input className="input w-full" required placeholder={t("ads.inquiryContact")} value={form.contact} onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))} />
            <input className="input w-full" placeholder={t("ads.inquiryCompany")} value={form.company} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} />
            <textarea className="input min-h-28 w-full" required placeholder={t("ads.inquiryMessage")} value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" className="btn btn-primary rounded-xl" disabled={sending}>
              {sending ? t("common.loading") : t("ads.inquirySubmit")}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
