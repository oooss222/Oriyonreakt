import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";

export default function AuthHeader() {
  const { t } = useI18n();

  return (
    <header
      className="sticky top-0 border-b border-ink-200 bg-white/95 backdrop-blur-sm"
      style={{ zIndex: "var(--z-header)" }}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <img
            src="/oriyon.store.png"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 object-contain transition group-hover:scale-105"
          />
          <span className="brand-wordmark truncate text-lg text-ink-900">
            Oriyon<span className="text-sun-500">.</span>
            <span className="text-[0.85em] font-semibold text-ink-400">store</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/listing"
            className="hidden text-sm font-medium text-ink-500 transition-colors hover:text-sun-700 sm:inline"
          >
            {t("nav.catalog")}
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-ink-500 transition-colors hover:text-sun-700"
          >
            {t("nav.backHome")}
          </Link>
        </div>
      </div>
    </header>
  );
}
