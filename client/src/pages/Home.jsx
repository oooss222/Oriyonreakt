import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import AdSlot from "../components/AdSlot";
import BusinessPromoBanner from "../components/BusinessPromoBanner";
import { api } from "../lib/api";
import { getUserFacingErrorMessage } from "../lib/apiError";
import { useI18n } from "../i18n";
import { getDefaultCity } from "../lib/recommendationProfile";
import { CONSENT_EVENT } from "../lib/cookieConsent";
import { sortListingsByPromotion } from "../lib/listingSort";
import { usePageMeta } from "../lib/usePageMeta";
import { trackSearch } from "../lib/track";
import { REAL_ESTATE_CAT, DEFAULT_REAL_ESTATE_BROWSE_PATH } from "../data/realEstate";
import {
  PlusCircle,
  ShieldCheck,
  Tag,
  ArrowRight,
  TrendingUp,
  Flame,
  Smartphone,
  Monitor,
  Building2,
  Eye,
  Search,
  Tv,
} from "lucide-react";

function RealEstateSection({ items }) {
  const { t } = useI18n();

  if (!items?.length) {
    return (
      <AdSlot placement="home_top" className="overflow-hidden rounded-3xl" />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 icon-box-sun shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="section-title">{t("categories.realestate")}</h2>
            <div className="text-sm text-ink-400">
              {t("listing.count", { count: items.length })}
            </div>
          </div>
        </div>

        <Link
          to={DEFAULT_REAL_ESTATE_BROWSE_PATH}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
        >
          {t("footer.allListings")}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((ad) => (
          <RealEstateListingCard key={ad.id || ad._id} item={ad} />
        ))}
      </div>
    </section>
  );
}

function HorizontalSection({ title, icon: Icon, items, linkTo = "/listing" }) {
  const { t } = useI18n();

  if (!items?.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 icon-box-sun shrink-0">
            <Icon className="text-sun" size={20} />
          </div>

          <div>
            <h2 className="section-title">{title}</h2>
            <div className="text-sm text-ink-400">
              {t("listing.count", { count: items.length })}
            </div>
          </div>
        </div>

        <Link
          to={linkTo}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
        >
          {t("home.viewAll")}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {items.map((ad) => (
          <ListingCard
            key={ad.id || ad._id}
            item={ad}
            listings={items}
            trackSource="home"
          />
        ))}
      </div>
    </section>
  );
}

function HomeHero() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [q, setQ] = React.useState("");

  const submit = (event) => {
    event?.preventDefault?.();
    const text = q.trim();
    if (text) {
      trackSearch(text);
      nav(`/listing?search=${encodeURIComponent(text)}`);
      return;
    }
    nav("/listing");
  };

  return (
    <section className="home-hero" aria-label={t("home.heroAria")}>
      <div className="home-hero__media" aria-hidden="true">
        <img
          src="/img/realestate.png"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="home-hero__shade" aria-hidden="true" />

      <div className="home-hero__content">
        <div className="home-hero__brand">
          Oriyon<span className="text-sun">.</span>
          <span className="text-white/70 font-semibold text-[0.55em] align-middle">
            store
          </span>
        </div>

        <p className="home-hero__lead">{t("home.heroLead")}</p>

        <div className="home-hero__actions">
          <form className="home-hero__search" onSubmit={submit} role="search">
            <Search size={18} className="ml-4 shrink-0 text-ink-300" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.heroSearchPlaceholder")}
              aria-label={t("home.heroSearchPlaceholder")}
            />
            <button type="submit" className="btn btn-primary rounded-none rounded-r-2xl px-5">
              {t("common.find")}
            </button>
          </form>

          <Link to="/add" className="btn btn-accent shrink-0 sm:min-w-[11rem]">
            <PlusCircle size={18} />
            {t("footer.postListing")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useI18n();
  const [forYou, setForYou] = React.useState([]);
  const [recentlyViewed, setRecentlyViewed] = React.useState([]);
  const [personalized, setPersonalized] = React.useState(false);
  const [listings, setListings] = React.useState([]);
  const [realEstateListings, setRealEstateListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);

  usePageMeta({
    title: t("home.metaTitle"),
    description: t("home.metaDescription"),
    url: typeof window !== "undefined" ? `${window.location.origin}/` : "",
  });

  React.useEffect(() => {
    const handleConsent = () => setReloadKey((value) => value + 1);
    window.addEventListener(CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(CONSENT_EVENT, handleConsent);
  }, []);

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const city = getDefaultCity();

        const [recommendations, catalog, realEstate] = await Promise.all([
          api.homeRecommendations({ city, limit: 20 }).catch(() => null),
          api.listings({
            limit: 50,
            sort: "promoted",
          }),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 8,
            sort: "promoted",
            location: "Душанбе",
          }),
        ]);

        if (active) {
          const catalogList = Array.isArray(catalog) ? catalog : [];

          setListings(catalogList);
          setForYou(
            Array.isArray(recommendations?.blocks?.forYou)
              ? recommendations.blocks.forYou
              : catalogList.slice(0, 20)
          );
          setRecentlyViewed(
            Array.isArray(recommendations?.blocks?.recentlyViewed)
              ? recommendations.blocks.recentlyViewed
              : []
          );
          setPersonalized(Boolean(recommendations?.personalized));
          setRealEstateListings(
            sortListingsByPromotion(Array.isArray(realEstate) ? realEstate : [])
          );
        }
      } catch (e) {
        if (active) {
          setError(getUserFacingErrorMessage(e, t) || t("errors.loadListings"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      active = false;
    };
  }, [reloadKey, t]);

  const feedPool = React.useMemo(() => {
    const merged = [...forYou, ...listings];
    const seen = new Set();

    return merged.filter((item) => {
      const id = item?.id || item?._id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [forYou, listings]);

  const sortedListings = React.useMemo(
    () => sortListingsByPromotion(feedPool),
    [feedPool]
  );

  const hotListings = (forYou.length ? forYou : sortedListings).slice(0, 10);

  const electronicsListings = sortedListings
    .filter((item) => item.cat === "electronics")
    .slice(0, 10);

  const phonesListings = sortedListings
    .filter((item) => item.cat === "phones")
    .slice(0, 10);

  const computersListings = sortedListings
    .filter((item) => item.cat === "computers")
    .slice(0, 10);

  const newestListings = sortedListings.slice(0, 10);

  return (
    <div className="page-shell">
      <HomeHero />

      <div className="container-x py-6 space-y-10">
        <div className="home-trust" role="list">
          <span role="listitem">
            <ShieldCheck size={16} className="inline mr-1.5 text-sun align-text-bottom" />
            <strong>{t("home.trustModeration")}</strong>
          </span>
          <span role="listitem">
            <strong>{t("home.trustAccount")}</strong>
          </span>
          <span role="listitem">
            <strong>{t("home.trustPromotion")}</strong>
          </span>
        </div>

        {loading && (
          <ListingGridSkeleton
            count={12}
            columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          />
        )}

        {!loading && error && (
          <div className="surface-panel p-6 text-center text-red-700 bg-red-50/80">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <RealEstateSection items={realEstateListings} />

            <BusinessPromoBanner />

            {listings.length === 0 ? (
              <div className="surface-panel p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-sun-50 grid place-items-center mb-3 ring-1 ring-sun/15">
                  <Tag className="text-sun" />
                </div>

                <div className="font-display font-semibold text-ink">
                  {t("home.noPublished")}
                </div>

                <p className="text-sm text-ink-400 mt-1">
                  {t("home.noPublishedHint")}
                </p>

                <Link to="/add" className="btn btn-primary mt-4">
                  <PlusCircle size={18} />
                  {t("footer.postListing")}
                </Link>
              </div>
            ) : (
              <div className="space-y-10">
                {recentlyViewed.length > 0 && (
                  <HorizontalSection
                    title={t("home.viewed")}
                    icon={Eye}
                    items={recentlyViewed}
                    linkTo="/listing"
                  />
                )}

                <HorizontalSection
                  title={personalized ? t("home.pickedForYou") : t("home.hotDeals")}
                  icon={personalized ? Tag : Flame}
                  items={hotListings}
                  linkTo="/listing"
                />

                <AdSlot placement="home_mid" className="overflow-hidden rounded-3xl" />

                <HorizontalSection
                  title={t("categories.electronics")}
                  icon={Tv}
                  items={electronicsListings}
                  linkTo="/c/electronics"
                />

                <HorizontalSection
                  title={t("categories.phones")}
                  icon={Smartphone}
                  items={phonesListings}
                  linkTo="/c/phones"
                />

                <HorizontalSection
                  title={t("categories.computers")}
                  icon={Monitor}
                  items={computersListings}
                  linkTo="/c/computers"
                />

                <HorizontalSection
                  title={t("home.newListings")}
                  icon={TrendingUp}
                  items={newestListings}
                  linkTo="/listing"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
