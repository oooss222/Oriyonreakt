import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Send, Mail, ShieldCheck } from "lucide-react";
import AdSlot from "./AdSlot";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <div className="container mx-auto px-4 mt-8">
        <AdSlot placement="footer" className="overflow-hidden rounded-3xl" />
      </div>

      <footer className="mt-12 border-t border-ink/10 bg-ink-800 text-white">
      <div className="container mx-auto px-4">
        <div className="py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <section aria-labelledby="footer-brand">
            <div className="brand-wordmark text-2xl mb-3">
              Oriyon<span className="text-sun">.</span>
              <span className="text-white/60 text-lg font-semibold">store</span>
            </div>
            <p className="text-sm text-white/65 leading-relaxed">
              Маркетплейс объявлений Таджикистана — покупайте и продавайте рядом с домом.
            </p>
          </section>

          <section aria-labelledby="footer-safety">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-sun w-5 h-5" aria-hidden="true" />
              <h2 id="footer-safety" className="font-display text-lg font-semibold">
                Безопасные сделки
              </h2>
            </div>
            <ul className="space-y-1.5 text-white/65 text-sm leading-relaxed">
              <li>Встречайтесь в людных местах и проверяйте товар.</li>
              <li>Не переводите предоплату незнакомым продавцам.</li>
              <li>Не делитесь данными банковских карт.</li>
              <li>Сообщайте о подозрительных объявлениях в поддержку.</li>
            </ul>
          </section>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="font-display text-lg font-semibold mb-3">
              Разделы
            </h2>
            <ul className="space-y-1.5 text-white/65 text-sm">
              <li>
                <Link to="/listing" className="hover:text-sun transition-colors">
                  Все объявления
                </Link>
              </li>
              <li>
                <Link to="/add" className="hover:text-sun transition-colors">
                  Подать объявление
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-sun transition-colors">
                  Политика сайта
                </Link>
              </li>
            </ul>
          </nav>

          <address className="not-italic" aria-labelledby="footer-contacts">
            <h2 id="footer-contacts" className="font-display text-lg font-semibold mb-3">
              Контакты
            </h2>
            <ul className="space-y-2 text-white/65 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sun" aria-hidden="true" />
                <a
                  href="mailto:info@oriyon.store"
                  className="hover:text-sun underline-offset-2 hover:underline transition-colors"
                >
                  info@oriyon.store
                </a>
              </li>
              <li>г. Душанбе, Таджикистан</li>
            </ul>

            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.facebook.com/share/1BXsEgEbou/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Мы на Facebook"
                className="text-white/65 hover:text-sun transition-colors"
                title="Facebook"
              >
                <Facebook size={20} aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Мы в Instagram"
                className="text-white/65 hover:text-sun transition-colors"
                title="Instagram"
              >
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Наш Telegram"
                className="text-white/65 hover:text-sun transition-colors"
                title="Telegram"
              >
                <Send size={20} aria-hidden="true" />
              </a>
            </div>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-white/45 text-sm">
        © {year}{" "}
        <span className="font-medium text-white/70">Oriyon.store</span> — платформа
        объявлений Таджикистана
      </div>
    </footer>
    </>
  );
}
