import React from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Search } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import SectionCategoryCard from "../components/sections/SectionCategoryCard";
import { CATS, HOME_CATEGORIES } from "../data/categories";
import { api } from "../lib/api";
import {
  getCategoryLandingPath,
  getCategorySubcategoryLabels,
  getSubcategoryBrowsePath,
} from "../lib/categoryRoutes";
import { usePageMeta } from "../lib/usePageMeta";
import { getCategoryLabel, useI18n } from "../i18n";

function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function scoreSearchResult(item, needle) {
  const title = String(item.title || "").toLowerCase();
  if (title === needle) return 0;
  if (title.startsWith(needle)) return 1;
  if (title.includes(needle)) return 2;
  if (item.type === "category") return 3;
  if (item.matchedVia === "self") return 4;
  return 5;
}

export default function Sections() {
  const { t, lang } = useI18n();
  const [query, setQuery] = React.useState("");
  const [counts, setCounts] = React.useState({});
  const [countsReady, setCountsReady] = React.useState(false);
  const numberLocale =
    lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";

  const sections = React.useMemo(
    () =>
      HOME_CATEGORIES.map((item) => {
        const cat = CATS[item.slug] || {};
        const i18nTitle = getCategoryLabel(item.slug, t);
        const shortKey = `categoriesShort.${item.slug}`;
        const shortTitle = t(shortKey);
        const fullTitle =
          i18nTitle && i18nTitle !== item.slug
            ? i18nTitle
            : item.fullTitle || cat.title || item.title;
        return {
          slug: item.slug,
          title: shortTitle !== shortKey ? shortTitle : fullTitle,
          fullTitle,
          desc: cat.desc || item.desc || "",
          img: item.img || cat.img,
          to: item.landingPath || getCategoryLandingPath(item.slug),
          featured: Boolean(item.featured || cat.featured),
          subcategories: getCategorySubcategoryLabels(item.slug),
        };
      }),
    [t]
  );

  usePageMeta({
    title: t("sections.title"),
    description: t("sections.metaDescription"),
    url: typeof window !== "undefined" ? `${window.location.origin}/sections` : "",
  });

  React.useEffect(() => {
    let active = true;

    async function loadCounts() {
      try {
        const entries = await Promise.all(
          HOME_CATEGORIES.map(async (item) => {
            try {
              const data = await api.listingCount({ cat: item.slug });
              return [item.slug, Number(data?.total || 0)];
            } catch {
              return [item.slug, 0];
            }
          })
        );

        if (active) {
          setCounts(Object.fromEntries(entries));
        }
      } finally {
        if (active) setCountsReady(true);
      }
    }

    loadCounts();

    return () => {
      active = false;
    };
  }, []);

  const popular = React.useMemo(() => {
    const ranked = sections
      .map((item) => ({ ...item, listingCount: counts[item.slug] || 0 }))
      .filter((item) => item.listingCount > 0)
      .sort((a, b) => b.listingCount - a.listingCount)
      .slice(0, 6);

    return ranked.length >= 3 ? ranked : [];
  }, [sections, counts]);

  const searchResults = React.useMemo(() => {
    const needle = normalizeQuery(query);
    if (!needle) return [];

    const results = [];

    sections.forEach((item) => {
      const parentHay = [item.title, item.fullTitle, item.desc, item.slug]
        .join(" ")
        .toLowerCase();
      const parentMatch = parentHay.includes(needle);

      if (parentMatch) {
        results.push({
          key: `cat-${item.slug}`,
          type: "category",
          title: item.title,
          hint: item.desc,
          to: item.to,
          matchedVia: "self",
        });
      }

      item.subcategories.forEach((sub) => {
        const selfHay = `${sub.label} ${sub.group} ${sub.value}`.toLowerCase();
        const selfMatch = selfHay.includes(needle);
        if (!selfMatch && !parentMatch) return;

        results.push({
          key: `sub-${item.slug}-${sub.value}`,
          type: "sub",
          title: sub.label,
          hint: t("sections.inCategory", { name: item.title }),
          to: getSubcategoryBrowsePath(item.slug, sub.value),
          matchedVia: selfMatch ? "self" : "parent",
        });
      });
    });

    return results
      .sort((a, b) => scoreSearchResult(a, needle) - scoreSearchResult(b, needle))
      .slice(0, 40);
  }, [query, sections, t]);

  const isSearching = Boolean(normalizeQuery(query));

  const scrollToSection = (slug) => {
    const node = document.getElementById(`section-${slug}`);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page-container py-6 md:py-8 space-y-6 md:space-y-8">
      <Breadcrumbs
        items={[
          { label: t("nav.home"), to: "/" },
          { label: t("sections.title") },
        ]}
      />

      <header className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 text-sun">
          <LayoutGrid size={18} />
          <span className="label-caps text-sun">{t("nav.catalog")}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink">
          {t("sections.title")}
        </h1>
        <p className="text-sm md:text-base text-ink-500 leading-relaxed">
          {t("sections.subtitle")}
        </p>
      </header>

      <form
        role="search"
        className="section-search"
        onSubmit={(event) => event.preventDefault()}
      >
        <Search size={18} className="section-search__icon" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query) {
              event.preventDefault();
              setQuery("");
            }
          }}
          placeholder={t("sections.searchPlaceholder")}
          aria-label={t("sections.searchAria")}
          autoComplete="off"
          className="section-search__input"
        />
        {query ? (
          <button
            type="button"
            className="section-search__clear"
            onClick={() => setQuery("")}
          >
            {t("common.close")}
          </button>
        ) : null}
      </form>

      {isSearching ? (
        searchResults.length ? (
          <section aria-live="polite" className="space-y-3">
            <h2 className="section-title text-lg">
              {t("sections.searchResults", { count: searchResults.length })}
            </h2>
            <ul className="section-results">
              {searchResults.map((item) => (
                <li key={item.key}>
                  <Link to={item.to} className="section-result">
                    <span
                      className={`section-result__kind ${
                        item.type === "sub" ? "section-result__kind--sub" : ""
                      }`}
                    >
                      {item.type === "sub"
                        ? t("sections.resultSub")
                        : t("sections.resultCategory")}
                    </span>
                    <span className="section-result__copy">
                      <span className="section-result__title">{item.title}</span>
                      {item.hint ? (
                        <span className="section-result__hint">{item.hint}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <EmptyState
            icon={Search}
            title={t("sections.emptyTitle")}
            description={t("sections.emptyDesc")}
            actionLabel={t("sections.emptyReset")}
            onAction={() => setQuery("")}
          />
        )
      ) : (
        <>
          <nav className="sections-jump" aria-label={t("sections.jumpAria")}>
            {sections.map((item) => (
              <button
                key={`jump-${item.slug}`}
                type="button"
                className="sections-jump__item"
                onClick={() => scrollToSection(item.slug)}
              >
                {item.title}
              </button>
            ))}
          </nav>

          {countsReady && popular.length > 0 ? (
            <section className="space-y-3">
              <h2 className="section-title text-lg">{t("sections.popular")}</h2>
              <div className="sections-popular">
                {popular.map((item) => (
                  <Link
                    key={`popular-${item.slug}`}
                    to={item.to}
                    className="sections-popular__item"
                  >
                    <span className="sections-popular__media" aria-hidden="true">
                      <img
                        src={item.img}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        onError={(event) => {
                          event.currentTarget.src = "/img/placeholder.jpg";
                        }}
                      />
                    </span>
                    <span className="sections-popular__copy">
                      <span className="sections-popular__title">{item.title}</span>
                      <span className="sections-popular__meta">
                        {t("listing.count", {
                          count: item.listingCount.toLocaleString(numberLocale),
                        })}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="section-title text-lg">{t("sections.all")}</h2>
            <div className="sections-grid">
              {sections.map((item) => (
                <SectionCategoryCard
                  key={item.slug}
                  slug={item.slug}
                  title={item.title}
                  fullTitle={item.fullTitle}
                  desc={item.desc}
                  img={item.img}
                  to={item.to}
                  listingCount={counts[item.slug]}
                  subcategories={item.subcategories}
                  featured={item.featured}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
