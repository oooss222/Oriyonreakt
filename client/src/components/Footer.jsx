import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Send, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-sm">
      <div className="container-x">
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <section aria-labelledby="footer-safety">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="icon-well-blue w-9 h-9">
                <ShieldCheck size={18} />
              </div>
              <h2 id="footer-safety" className="text-base font-bold text-brand">
                Безопасные сделки
              </h2>
            </div>
            <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
              <li>Встречайтесь в людных местах и проверяйте товар.</li>
              <li>Не переводите предоплату незнакомым продавцам.</li>
              <li>Не делитесь данными банковских карт.</li>
              <li>Сообщайте о подозрительных объявлениях в поддержку.</li>
            </ul>
          </section>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="text-base font-bold mb-4 text-brand">
              Oriyon.store
            </h2>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>
                <Link
                  to="/listing"
                  className="hover:text-accent-600 transition-colors"
                >
                  Все объявления
                </Link>
              </li>
              <li>
                <Link
                  to="/add"
                  className="hover:text-accent-600 transition-colors"
                >
                  Подать объявление
                </Link>
              </li>
              <li>
                <Link
                  to="/policy"
                  className="hover:text-accent-600 transition-colors"
                >
                  Политика сайта
                </Link>
              </li>
            </ul>
          </nav>

          <address className="not-italic" aria-labelledby="footer-contacts">
            <h2 id="footer-contacts" className="text-base font-bold mb-4 text-brand">
              Контакты
            </h2>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent-600 shrink-0" aria-hidden="true" />
                <a
                  href="mailto:info@oriyon.store"
                  className="hover:text-accent-600 underline-offset-2 hover:underline transition-colors"
                >
                  info@oriyon.store
                </a>
              </li>
              <li>г. Душанбе, Таджикистан</li>
            </ul>
          </address>

          <section aria-labelledby="footer-socials">
            <h2 id="footer-socials" className="text-base font-bold mb-4 text-brand">
              Мы в соцсетях
            </h2>
            <div className="flex items-center gap-2">
              {[
                {
                  href: "https://www.facebook.com/share/1BXsEgEbou/",
                  label: "Facebook",
                  Icon: Facebook,
                },
                {
                  href: "https://instagram.com/",
                  label: "Instagram",
                  Icon: Instagram,
                },
                {
                  href: "https://t.me/",
                  label: "Telegram",
                  Icon: Send,
                },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:text-accent-600 hover:border-accent-200 hover:bg-accent-50 transition-all duration-200"
                >
                  <Icon size={20} aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-slate-200/80 py-5 text-center text-slate-500 text-sm">
        © {year}{" "}
        <span className="font-semibold text-slate-700">Oriyon.store</span> — платформа
        объявлений Таджикистана
      </div>
    </footer>
  );
}
