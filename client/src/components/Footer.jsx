import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Send, Mail, ShieldCheck } from "lucide-react";
import AdSlot from "./AdSlot";
import { useI18n } from "../i18n";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useI18n();

  return (
    <>
      <div className="container-x mt-8">
        <AdSlot placement="footer" className="overflow-hidden rounded-3xl" />
      </div>

      <footer className="mt-8 lg:mt-12 border-t border-ink/10 bg-ink-800 text-white">
      <div className="container-x">
        {/* Compact mobile strip */}
        <div className="lg:hidden py-6 space-y-4">
          <div className="brand-wordmark text-xl">
            Oriyon<span className="text-sun">.</span>
            <span className="text-white/60 text-base font-semibold">store</span>
          </div>
          <p className="text-sm text-white/65 leading-relaxed">
            {t("footer.tagline")}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link to="/sections" className="text-white/80 hover:text-sun transition">
              {t("nav.sections")}
            </Link>
            <Link to="/listing" className="text-white/80 hover:text-sun transition">
              {t("footer.allListings")}
            </Link>
            <Link to="/add" className="text-white/80 hover:text-sun transition">
              {t("footer.postListing")}
            </Link>
            <Link to="/policy" className="text-white/80 hover:text-sun transition">
              {t("footer.sitePolicy")}
            </Link>
          </div>
          <a
            href="mailto:info@oriyon.store"
            className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-sun transition"
          >
            <Mail className="w-4 h-4 text-sun" aria-hidden="true" />
            info@oriyon.store
          </a>
        </div>

        <div className="hidden lg:grid py-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <section aria-labelledby="footer-brand">
            <div className="brand-wordmark text-2xl mb-3">
              Oriyon<span className="text-sun">.</span>
              <span className="text-white/60 text-lg font-semibold">store</span>
            </div>
            <p className="text-sm text-white/65 leading-relaxed">
              {t("footer.tagline")}
            </p>
          </section>

          <section aria-labelledby="footer-safety">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-sun w-5 h-5" aria-hidden="true" />
              <h2 id="footer-safety" className="font-display text-lg font-semibold">
                {t("footer.safeDeals")}
              </h2>
            </div>
            <ul className="space-y-1.5 text-white/65 text-sm leading-relaxed">
              <li>{t("footer.safeTip1")}</li>
              <li>{t("footer.safeTip2")}</li>
              <li>{t("footer.safeTip3")}</li>
              <li>{t("footer.safeTip4")}</li>
            </ul>
          </section>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="font-display text-lg font-semibold mb-3">
              {t("footer.sections")}
            </h2>
            <ul className="space-y-1.5 text-white/65 text-sm">
              <li>
                <Link to="/sections" className="hover:text-sun transition-colors">
                  {t("nav.sections")}
                </Link>
              </li>
              <li>
                <Link to="/listing" className="hover:text-sun transition-colors">
                  {t("footer.allListings")}
                </Link>
              </li>
              <li>
                <Link to="/add" className="hover:text-sun transition-colors">
                  {t("footer.postListing")}
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-sun transition-colors">
                  {t("footer.sitePolicy")}
                </Link>
              </li>
            </ul>
          </nav>

          <address className="not-italic" aria-labelledby="footer-contacts">
            <h2 id="footer-contacts" className="font-display text-lg font-semibold mb-3">
              {t("footer.contacts")}
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
              <li>{t("footer.location")}</li>
            </ul>

            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.facebook.com/share/1BXsEgEbou/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.facebook")}
                className="text-white/65 hover:text-sun transition-colors"
                title="Facebook"
              >
                <Facebook size={20} aria-hidden="true" />
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.instagram")}
                className="text-white/65 hover:text-sun transition-colors"
                title="Instagram"
              >
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.telegram")}
                className="text-white/65 hover:text-sun transition-colors"
                title="Telegram"
              >
                <Send size={20} aria-hidden="true" />
              </a>
            </div>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10 py-3 lg:py-4 text-center text-white/45 text-xs sm:text-sm">
        © {year}{" "}
        <span className="font-medium text-white/70">Oriyon.store</span> — {t("footer.copyright")}
      </div>
    </footer>
    </>
  );
}
