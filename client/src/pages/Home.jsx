import React from "react";
import ListingCard from "../components/ListingCard";
import RealEstateListingCard from "../components/RealEstateListingCard";
import AdSlot from "../components/AdSlot";
import BusinessPromoBanner from "../components/BusinessPromoBanner";
import SectionHeader from "../components/SectionHeader";
import { api } from "../lib/api";
import { getUserFacingErrorMessage } from "../lib/apiError";
import { useI18n } from "../i18n";
import { getDefaultCity } from "../lib/recommendationProfile";
import { CONSENT_EVENT } from "../lib/cookieConsent";
import { sortListingsByPromotion } from "../lib/listingSort";
import { usePageMeta } from "../lib/usePageMeta";
import { REAL_ESTATE_CAT, DEFAULT_REAL_ESTATE_BROWSE_PATH } from "../data/realEstate";
import { TOKEN_KEY } from "../lib/auth";
import { Alert, Button, EmptyState, ListingCardSkeleton } from "../ui";
import {
  Plus,
  ShieldCheck,
  Tag,
  TrendingUp,
  BadgeCheck,
  Flame,
  LayoutGrid,
  Smartphone,
  Monitor,
  Building2,
  Eye,
  Rocket,
  Heart,
  PackageSearch,
} from "lucide-react";

const FEED_GRID = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

function Hero({ total }) {
  const { t } = useI18n();
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : "";

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:p-9">
        <div className="min-w-0">
          <h1 className="max-w-2xl text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">
            {t("home.heroTitle")}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="primary" size="lg" to="/add" icon={Plus}>
              {t("home.quickSell")}
            </Button>

            <Button size="lg" to="/listing" icon={LayoutGrid}>
              {t("home.quickBrowse")}
            </Button>

            {token && (
              <Button size="lg" to="/profile?tab=fav" icon={Heart} className="hidden sm:inline-flex">
                {t("home.quickFavorites")}
              </Button>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 border-t border-ink-200 pt-5 lg:w-[22rem] lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {[
            { icon: PackageSearch, value: total ? total.toLocaleString("ru-RU") : "—", label: t("nav.catalog") },
            { icon: ShieldCheck, value: "100%", label: t("home.moderationTitle") },
            { icon: Rocket, value: "VIP / TOP", label: t("home.promotionTitle") },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="min-w-0">
              <Icon size={18} className="mb-1.5 text-sun-600" aria-hidden="true" />
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-lg font-extrabold leading-tight text-ink-900">
                {value}
              </dd>
              <p className="mt-0.5 text-2xs font-medium leading-tight text-ink-400">{label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FeedSection({ title, icon, items, linkTo = "/listing", cardComponent: Card = ListingCard }) {
  const { t } = useI18n();
  const headingId = React.useId();

  if (!items?.length) return null;

  return (
    <section className="space-y-3 sm:space-y-4" aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        title={title}
        icon={icon}
        subtitle={t("listing.count", { count: items.length })}
        linkTo={linkTo}
        linkLabel={t("home.viewAll")}
      />

      <div className={FEED_GRID}>
        {items.map((ad) => (
          <Card key={ad.id || ad._id} item={ad} listings={items} trackSource="home" />
        ))}
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className={FEED_GRID}>
        {Array.from({ length: 10 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function TrustSection() {
  const { t } = useI18n();

  const cards = [
    { icon: ShieldCheck, title: t("home.moderationTitle"), text: t("home.moderationDesc") },
    { icon: BadgeCheck, title: t("home.accountTitle"), text: t("home.accountDesc") },
    { icon: Rocket, title: t("home.promotionTitle"), text: t("home.promotionDesc") },
  ];

  return (
    <section aria-labelledby="home-trust" className="space-y-3 sm:space-y-4">
      <h2 id="home-trust" className="section-title">
        {t("home.trustTitle")}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-5">
            <span className="icon-box-ink mb-3 grid h-10 w-10">
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h3 className="text-base font-bold text-ink-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{text}</p>
          </div>
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
  const [total, setTotal] = React.useState(0);
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

        const [recommendations, catalog, realEstate, count] = await Promise.all([
          api.homeRecommendations({ city, limit: 20 }).catch(() => null),
          api.listings({ limit: 50, sort: "promoted" }),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 8,
            sort: "promoted",
            location: "Душанбе",
          }),
          api.listingCount({}).catch(() => null),
        ]);

        if (!active) return;

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
        setTotal(Number(count?.total || 0));
      } catch (e) {
        if (active) setError(getUserFacingErrorMessage(e, t) || t("errors.loadListings"));
      } finally {
        if (active) setLoading(false);
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

  const sortedListings = React.useMemo(() => sortListingsByPromotion(feedPool), [feedPool]);

  const byCategory = React.useCallback(
    (cat) => sortedListings.filter((item) => item.cat === cat).slice(0, 10),
    [sortedListings]
  );

  const hotListings = (forYou.length ? forYou : sortedListings).slice(0, 10);

  return (
    <div className="page-container stack-page">
      <Hero total={total} />

      {error && !loading && (
        <Alert tone="danger" title={t("errors.generic")}>
          {error}
        </Alert>
      )}

      {loading && <FeedSkeleton />}

      {!loading && !error && (
        <>
          {realEstateListings.length > 0 ? (
            <section className="space-y-3 sm:space-y-4" aria-labelledby="home-realestate">
              <SectionHeader
                id="home-realestate"
                title={t("categories.realestate")}
                icon={Building2}
                subtitle={t("listing.count", { count: realEstateListings.length })}
                linkTo={DEFAULT_REAL_ESTATE_BROWSE_PATH}
                linkLabel={t("home.viewAll")}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                {realEstateListings.map((ad) => (
                  <RealEstateListingCard key={ad.id || ad._id} item={ad} />
                ))}
              </div>
            </section>
          ) : (
            <AdSlot placement="home_top" className="overflow-hidden rounded-2xl" />
          )}

          <BusinessPromoBanner />

          {listings.length === 0 ? (
            <EmptyState
              icon={Tag}
              title={t("home.noPublished")}
              description={t("home.noPublishedHint")}
              actionLabel={t("footer.postListing")}
              actionTo="/add"
            />
          ) : (
            <>
              <FeedSection
                title={t("home.viewed")}
                icon={Eye}
                items={recentlyViewed}
                linkTo="/listing"
              />

              <FeedSection
                title={personalized ? t("home.pickedForYou") : t("home.hotDeals")}
                icon={personalized ? Tag : Flame}
                items={hotListings}
                linkTo="/listing"
              />

              <AdSlot placement="home_mid" className="overflow-hidden rounded-2xl" />

              <FeedSection
                title={t("categories.electronics")}
                icon={Monitor}
                items={byCategory("electronics")}
                linkTo="/c/electronics"
              />

              <FeedSection
                title={t("categories.phones")}
                icon={Smartphone}
                items={byCategory("phones")}
                linkTo="/c/phones"
              />

              <FeedSection
                title={t("categories.computers")}
                icon={Monitor}
                items={byCategory("computers")}
                linkTo="/c/computers"
              />

              <FeedSection
                title={t("home.newListings")}
                icon={TrendingUp}
                items={sortedListings.slice(0, 10)}
                linkTo="/listing"
              />
            </>
          )}

          <TrustSection />
        </>
      )}
    </div>
  );
}
