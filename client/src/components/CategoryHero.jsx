import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CategoryHero({ cat, slug, total = 0 }) {
  const isTransport = slug === "transport";

  if (isTransport) {
    return (
      <header className="category-hero category-hero-banner">
        <div className="grid md:grid-cols-[1fr_min(42%,20rem)]">
          <div className="p-5 md:p-8 flex flex-col justify-center min-w-0">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="badge bg-white/10 text-white border-white/20">
                Категория
              </span>
              {total > 0 && (
                <span className="text-xs text-white/75">
                  {total.toLocaleString("ru-RU")} объявлений
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
              {cat.title}
            </h1>
            <p className="text-sm text-white/75 mt-2 max-w-lg">{cat.desc}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/listing?cat=${slug}`} className="btn btn-primary">
                Все объявления
              </Link>
              <Link
                to="/add?cat=transport"
                className="btn border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                Продать авто
              </Link>
            </div>
          </div>

          <div className="relative hidden md:flex items-end justify-center p-6 min-h-[12rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgb(255_106_0_/_0.35),transparent_55%)]" />
            <img
              src={cat.img}
              alt=""
              className="relative z-[1] max-h-44 w-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        <div className="md:hidden border-t border-white/10 bg-black/15 px-5 py-4 flex items-center justify-center">
          <img
            src={cat.img}
            alt=""
            className="max-h-24 w-auto object-contain"
          />
        </div>
      </header>
    );
  }

  return (
    <header className="category-hero p-4 md:p-6 flex items-center gap-4">
      <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-ink/10 bg-mist grid place-items-center overflow-hidden">
        <img
          src={cat.img}
          alt=""
          className="w-12 h-12 md:w-14 md:h-14 object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="badge">Категория</span>
          {total > 0 && (
            <span className="text-xs text-ink-400">
              {total.toLocaleString("ru-RU")} объявлений
            </span>
          )}
        </div>

        <h1 className="section-title leading-tight">{cat.title}</h1>
        <p className="text-ink-400 text-sm mt-1">{cat.desc}</p>
      </div>

      <div className="ml-auto hidden sm:flex gap-2 shrink-0">
        <Link to={`/listing?cat=${slug}`} className="btn btn-primary">
          Все объявления
          <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}
