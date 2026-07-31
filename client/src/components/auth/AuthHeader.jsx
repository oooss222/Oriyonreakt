import React from "react";
import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/95 backdrop-blur-sm">
      <div className="container-x h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
          <img
            src="/oriyon.store.png"
            alt="Oriyon Store"
            className="w-10 h-10 object-contain transition group-hover:scale-105"
          />
          <span className="brand-wordmark text-lg text-ink truncate">
            Oriyon<span className="text-sun">.</span>
            <span className="text-ink-400 font-semibold text-[0.85em]">store</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/listing"
            className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-sun transition"
          >
            Каталог
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-sun transition"
          >
            На главную
          </Link>
        </div>
      </div>
    </header>
  );
}
