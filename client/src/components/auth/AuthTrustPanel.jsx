import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck, Sparkles, Tag } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Tag,
    title: "Бесплатная публикация",
    text: "Размещайте объявления и получайте отклики без скрытых комиссий.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp и чат на сайте",
    text: "Покупатели могут написать вам напрямую — как им удобнее.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасные сделки",
    text: "Встречайтесь лично и проверяйте товар перед оплатой.",
  },
];

export default function AuthTrustPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-center">
      <div className="rounded-3xl border bg-gradient-to-br from-ink-900 via-ink-800 to-lagoon-900 text-white p-8 shadow-lift">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
          <Sparkles size={14} className="text-sun" />
          Маркетплейс Таджикистана
        </div>

        <h2 className="mt-5 text-2xl font-bold leading-tight">
          Продавайте и покупайте рядом с домом
        </h2>

        <p className="mt-3 text-sm text-white/75 leading-relaxed">
          Oriyon.store объединяет частных продавцов и компании в одном каталоге —
          от телефонов до недвижимости.
        </p>

        <ul className="mt-8 space-y-5">
          {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sun">
                <Icon size={18} />
              </span>
              <div>
                <div className="font-semibold text-white">{title}</div>
                <div className="mt-1 text-sm text-white/70">{text}</div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xs text-white/50">
          Продолжая, вы соглашаетесь с{" "}
          <Link to="/policy" className="text-white/80 underline hover:text-white">
            политикой сайта
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
