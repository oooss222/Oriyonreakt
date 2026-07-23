import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Send, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <section aria-labelledby="footer-safety">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-accent w-5 h-5" aria-hidden="true" />
              <h2 id="footer-safety" className="text-lg font-semibold text-brand">
                Безопасные сделки
              </h2>
            </div>
            <ul className="space-y-1 text-slate-600 text-sm leading-relaxed">
              <li>• Встречайтесь в людных местах и проверяйте товар.</li>
              <li>• Не переводите предоплату незнакомым продавцам.</li>
              <li>• Не делитесь данными банковских карт.</li>
              <li>• Сообщайте о подозрительных объявлениях в поддержку.</li>
            </ul>
          </section>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="text-lg font-semibold mb-3 text-brand">
              Oriyon.store
            </h2>
            <ul className="space-y-1 text-slate-600 text-sm">
              <li>
                <Link to="/policy" className="hover:text-accent transition-colors">
                  Политика сайта
                </Link>
              </li>
            </ul>
          </nav>

          <address className="not-italic" aria-labelledby="footer-contacts">
            <h2 id="footer-contacts" className="text-lg font-semibold mb-3 text-brand">
              Контакты
            </h2>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" aria-hidden="true" />
                <a
                  href="mailto:info@oriyon.store"
                  className="hover:text-accent underline-offset-2 hover:underline transition-colors"
                >
                  info@oriyon.store
                </a>
              </li>
              <li>г. Душанбе, Таджикистан</li>
            </ul>
          </address>

          <section aria-labelledby="footer-socials">
            <h2 id="footer-socials" className="text-lg font-semibold mb-3 text-brand">
              Мы в соцсетях
            </h2>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/1BXsEgEbou/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Мы на Facebook"
                className="text-slate-600 hover:text-accent transition-colors duration-300"
                title="Facebook"
              >
                <Facebook size={22} aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Мы в Instagram"
                className="text-slate-600 hover:text-accent transition-colors duration-300"
                title="Instagram"
              >
                <Instagram size={22} aria-hidden="true" />
              </a>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Наш Telegram"
                className="text-slate-600 hover:text-accent transition-colors duration-300"
                title="Telegram"
              >
                <Send size={22} aria-hidden="true" />
              </a>
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-4 text-center text-slate-500 text-sm">
        © {year} <span className="font-medium text-slate-700">Oriyon.store</span> — платформа объявлений Таджикистана
      </div>
    </footer>
  );
}
