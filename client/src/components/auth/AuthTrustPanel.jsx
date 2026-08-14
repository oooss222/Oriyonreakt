import React from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

const LOGIN_ITEMS = [
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

const REGISTER_ITEMS = [
  {
    icon: Clock3,
    title: "Регистрация за 1 минуту",
    text: "Телефон или email — выберите удобный способ и начните сразу.",
  },
  {
    icon: Tag,
    title: "Первое объявление бесплатно",
    text: "Опубликуйте товар, авто или недвижимость без оплаты за размещение.",
  },
  {
    icon: Users,
    title: "Личный кабинет продавца",
    text: "Управляйте объявлениями, откликами и продвижением в одном месте.",
  },
];

const REGISTER_CHIPS = ["Бесплатно", "Без комиссии", "1 минута"];

export function AuthMobileBenefits({ mode = "login" }) {
  const chips = mode === "register" ? REGISTER_CHIPS : ["Безопасно", "Бесплатно"];

  return (
    <div className="auth-mobile-benefits lg:hidden">
      {chips.map((chip) => (
        <span key={chip} className="auth-mobile-benefits__chip">
          {chip}
        </span>
      ))}
    </div>
  );
}

export default function AuthTrustPanel({ mode = "login" }) {
  const isRegister = mode === "register";
  const items = isRegister ? REGISTER_ITEMS : LOGIN_ITEMS;

  return (
    <div className="auth-trust-wrap">
      <div className="auth-trust-panel">
        <div className="auth-trust-panel__badge">
          <Sparkles size={14} className="text-sun" />
          {isRegister ? "Начните продавать сегодня" : "Маркетплейс Таджикистана"}
        </div>

        <h2 className="auth-trust-panel__title">
          {isRegister
            ? "Создайте аккаунт и разместите первое объявление"
            : "Продавайте и покупайте рядом с домом"}
        </h2>

        <p className="auth-trust-panel__text">
          {isRegister
            ? "Тысячи покупателей каждый день ищут товары, авто и недвижимость на Oriyon.store."
            : "Oriyon.store объединяет частных продавцов и компании в одном каталоге — от телефонов до недвижимости."}
        </p>

        {isRegister ? (
          <div className="auth-trust-panel__chips">
            {REGISTER_CHIPS.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        ) : null}

        <ul className="auth-trust-panel__list">
          {items.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="auth-trust-panel__icon">
                <Icon size={18} />
              </span>
              <div>
                <div className="font-semibold text-white">{title}</div>
                <div className="mt-1 text-sm text-white/70">{text}</div>
              </div>
            </li>
          ))}
        </ul>

        <p className="auth-trust-panel__legal">
          Продолжая, вы соглашаетесь с{" "}
          <Link to="/policy" className="underline hover:text-white">
            политикой сайта
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
