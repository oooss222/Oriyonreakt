import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Send, Mail, ShieldCheck, MapPin } from "lucide-react";
import AdSlot from "./AdSlot";
import { useI18n } from "../i18n";

const SOCIALS = [
  { key: "facebook", href: "https://www.facebook.com/share/1BXsEgEbou/", icon: Facebook },
  { key: "instagram", href: "https://instagram.com/", icon: Instagram },
  { key: "telegram", href: "https://t.me/", icon: Send },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useI18n();

  return (
    <>
      <div className="page-container mt-8">
        <AdSlot placement="footer" className="overflow-hidden rounded-2xl" />
      </div>

      <footer className="mt-10 border-t border-ink-200 bg-white">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
            <section aria-labelledby="footer-brand">
              <h2 id="footer-brand" className="brand-wordmark mb-3 text-xl text-ink-900">
                Oriyon<span className="text-sun-500">.</span>
                <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">store</span>
              </h2>
              <p className="text-sm leading-relaxed text-ink-500">{t("footer.tagline")}</p>

              <div className="mt-5 flex items-center gap-1">
                {SOCIALS.map(({ key, href, icon: Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`footer.${key}`)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 text-ink-500
                               transition-colors hover:border-ink-300 hover:bg-mist-100 hover:text-ink-900"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>

            <section aria-labelledby="footer-safety">
              <h2
                id="footer-safety"
                className="mb-3 flex items-center gap-2 font-display text-base font-bold text-ink-900"
              >
                <ShieldCheck className="text-lagoon-600" size={18} aria-hidden="true" />
                {t("footer.safeDeals")}
              </h2>
              <ul className="space-y-1.5 text-sm leading-relaxed text-ink-500">
                <li>{t("footer.safeTip1")}</li>
                <li>{t("footer.safeTip2")}</li>
                <li>{t("footer.safeTip3")}</li>
                <li>{t("footer.safeTip4")}</li>
              </ul>
            </section>

            <nav aria-labelledby="footer-links">
              <h2 id="footer-links" className="mb-3 font-display text-base font-bold text-ink-900">
                {t("footer.sections")}
              </h2>
              <ul className="space-y-1 text-sm text-ink-500">
                {[
                  { to: "/listing", label: t("footer.allListings") },
                  { to: "/add", label: t("footer.postListing") },
                  { to: "/policy", label: t("footer.sitePolicy") },
                ].map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex min-h-[2rem] items-center transition-colors hover:text-sun-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <address className="not-italic" aria-labelledby="footer-contacts">
              <h2 id="footer-contacts" className="mb-3 font-display text-base font-bold text-ink-900">
                {t("footer.contacts")}
              </h2>
              <ul className="space-y-2 text-sm text-ink-500">
                <li>
                  <a
                    href="mailto:info@oriyon.store"
                    className="inline-flex min-h-[2rem] items-center gap-2 transition-colors hover:text-sun-700"
                  >
                    <Mail size={16} className="text-ink-400" aria-hidden="true" />
                    info@oriyon.store
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={16} className="text-ink-400" aria-hidden="true" />
                  {t("footer.location")}
                </li>
              </ul>
            </address>
          </div>
        </div>

        <div className="border-t border-ink-200">
          <div className="page-container py-4 text-center text-xs text-ink-400">
            © {year} <span className="font-semibold text-ink-600">Oriyon.store</span> —{" "}
            {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </>
  );
}
