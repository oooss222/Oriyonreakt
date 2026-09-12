import React from "react";
import { Link } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import HomeCategoryGrid from "../components/HomeCategoryGrid";
import AdSlot from "../components/AdSlot";
import BusinessPromoBanner from "../components/BusinessPromoBanner";
import { api } from "../lib/api";
import { getUserFacingErrorMessage } from "../lib/apiError";
import { useI18n } from "../i18n";
import { getDefaultCity } from "../lib/recommendationProfile";
import { CONSENT_EVENT } from "../lib/cookieConsent";
import { sortListingsByPromotion } from "../lib/listingSort";
import { usePageMeta } from "../lib/usePageMeta";
import { REAL_ESTATE_CAT, DEFAULT_REAL_ESTATE_BROWSE_PATH } from "../data/realEstate";
import {
  PlusCircle,
  ShieldCheck,
  Tag,
  ArrowRight,
  TrendingUp,
  BadgeCheck,
  Flame,
  Home as HomeIcon,
  Smartphone,
  Monitor,
  Building2,
  Eye,
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
          <h2 className="section-title">{t("categories.realestate")}</h2>
        </div>

        <Link
          to={DEFAULT_REAL_ESTATE_BROWSE_PATH}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
        >
          {t("home.viewAll")}
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
          <div className="w-10 h-10 rounded-2xl bg-sun-50 grid place-items-center ring-1 ring-sun/15">
            <Icon className="text-sun" size={20} />
          </div>

          <h2 className="section-title">{title}</h2>
        </div>

        <Link
          to={linkTo}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-sun-700 hover:text-sun transition"
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
      <div className="container mx-auto px-4 py-6 space-y-10">
        {/* Rendered before the listing fetch resolves so the page explains
            itself immediately instead of showing bare skeletons. */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {t("home.heroTitle")}
            </h1>
            <p className="text-sm sm:text-base text-ink-400">
              {t("footer.tagline")}
            </p>
          </div>

          <HomeCategoryGrid />
        </section>

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

                <Link
                  to="/add"
                  className="btn btn-primary mt-4"
                >
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
              icon={HomeIcon}
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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-panel p-5">
            <div className="w-11 h-11 icon-box-sun mb-3">
              <ShieldCheck />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">
              {t("home.moderationTitle")}
            </h3>

            <p className="text-sm text-ink-400 mt-2">{t("home.moderationDesc")}</p>
          </div>

          <div className="surface-panel p-5">
            <div className="w-11 h-11 icon-box-sun mb-3">
              <BadgeCheck />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">
              {t("home.accountTitle")}
            </h3>

            <p className="text-sm text-ink-400 mt-2">{t("home.accountDesc")}</p>
          </div>

          <div className="surface-panel p-5">
            <div className="w-11 h-11 icon-box-ink mb-3">
              <ShieldCheck />
            </div>

            <h3 className="font-display font-bold text-lg text-ink">
              {t("home.promotionTitle")}
            </h3>

            <p className="text-sm text-ink-400 mt-2">{t("home.promotionDesc")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
