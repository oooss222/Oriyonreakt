import React from "react";
import { Link } from "react-router-dom";
import { Building2, Crown, ArrowRight, Scale } from "lucide-react";
import { readCompareIds, COMPARE_MAX } from "../lib/compareListings";
import RealEstateSearchHero from "../components/RealEstateSearchHero";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import AdSlot from "../components/AdSlot";
import Breadcrumbs from "../components/Breadcrumbs";
import RealEstateNovostroykiSection from "../components/realestate/RealEstateNovostroykiSection";
import RealEstateSectionHeader from "../components/realestate/RealEstateSectionHeader";
import RealEstateCategoryGrid from "../components/realestate/RealEstateCategoryGrid";
import RealEstateDistrictBar from "../components/realestate/RealEstateDistrictBar";
import { usePageMeta } from "../lib/usePageMeta";
import { api } from "../lib/api";
import { sortListingsByPromotion } from "../lib/listingSort";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import { buildRealEstateListingUrl, buildRealEstateCategoryUrl } from "../lib/realEstate";
import { useI18n, getCategoryLabel } from "../i18n";
import { Alert, EmptyState, cn } from "../ui";

export default function RealEstate() {
  const { t } = useI18n();
  const [stats, setStats] = React.useState({ total: 0, bySubcategory: {} });
  const [listings, setListings] = React.useState([]);
  const [premium, setPremium] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [city, setCity] = React.useState("Душанбе");
  const [developments, setDevelopments] = React.useState([]);
  const [compareCount, setCompareCount] = React.useState(() => readCompareIds().length);
  const [fallbackListings, setFallbackListings] = React.useState([]);

  React.useEffect(() => {
    const sync = () => setCompareCount(readCompareIds().length);
    window.addEventListener("oriyon:compare-change", sync);
    return () => window.removeEventListener("oriyon:compare-change", sync);
  }, []);

  React.useEffect(() => {
    api
      .developments(city)
      .then((rows) => setDevelopments(Array.isArray(rows) ? rows : []))
      .catch(() => setDevelopments([]));
  }, [city]);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const [statsData, allListings, promoted] = await Promise.all([
          api.listingStats(REAL_ESTATE_CAT, city),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 24,
            sort: "new",
            location: city,
          }),
          api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 12,
            sort: "promoted",
            location: city,
          }),
        ]);

        if (!active) return;

        const listingRows = Array.isArray(allListings) ? allListings : [];

        setStats(statsData || { total: 0, bySubcategory: {} });
        setListings(listingRows);
        setPremium(sortListingsByPromotion(Array.isArray(promoted) ? promoted : []));

        if (listingRows.length === 0) {
          const wider = await api.listings({
            cat: REAL_ESTATE_CAT,
            limit: 8,
            sort: "new",
          });
          if (active) {
            setFallbackListings(Array.isArray(wider) ? wider : []);
          }
        } else if (active) {
          setFallbackListings([]);
        }
      } catch {
        if (active) {
          setStats({ total: 0, bySubcategory: {} });
          setListings([]);
          setPremium([]);
          setFallbackListings([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [city]);

  usePageMeta({
    title: t("realestate.metaTitle"),
    description: t("realestate.metaDesc"),
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  const categoryLabel = getCategoryLabel(REAL_ESTATE_CAT, t);

  return (
    <div className="page-container stack-page">
      <Breadcrumbs
        items={[
          { label: t("nav.home"), to: "/" },
          { label: categoryLabel },
        ]}
      />

      <RealEstateSearchHero
        initialCity={city}
        totalCount={stats.total}
        onCityChange={setCity}
      />

      <RealEstateNovostroykiSection
        city={city}
        listingCount={stats.bySubcategory?.["Новостройки"] || 0}
        developments={developments}
      />

      <Link
        to="/realestate/sravnenie"
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-xs transition-colors",
          compareCount > 0
            ? "border-ink-800 bg-ink-900 text-white hover:bg-ink-800"
            : "border-ink-200 bg-white text-ink-900 hover:border-sun-200 hover:bg-sun-50"
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              compareCount > 0 ? "bg-white/10 text-sun-400" : "bg-sun-50 text-sun-700"
            )}
          >
            <Scale size={20} aria-hidden="true" />
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              {t("realestate.compareTitle")}
              {compareCount > 0 ? ` · ${compareCount}/${COMPARE_MAX}` : ""}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate text-xs",
                compareCount > 0 ? "text-white/60" : "text-ink-400"
              )}
            >
              {t("realestate.compareHint", { max: COMPARE_MAX })}
            </span>
          </span>
        </span>

        <ArrowRight
          size={18}
          aria-hidden="true"
          className={cn("shrink-0", compareCount > 0 ? "text-white/70" : "text-ink-400")}
        />
      </Link>

      <div className="space-y-3">
        <RealEstateSectionHeader
          title={t("realestate.categories")}
          description={t("realestate.categoriesDesc")}
        />
        <RealEstateCategoryGrid city={city} statsBySubcategory={stats.bySubcategory} />
      </div>

      <RealEstateDistrictBar
        city={city}
        onCityChange={setCity}
        totalCount={stats.total}
      />

      {premium.length > 0 && (
        <section className="space-y-1">
          <RealEstateSectionHeader
            icon={Crown}
            title={t("realestate.premiumTitle")}
            description={t("realestate.premiumDesc", { city })}
            actionLabel={t("realestate.allPremium")}
            actionTo={buildRealEstateListingUrl({ city, sort: "promoted" })}
          />

          <div className="grid gap-3 lg:grid-cols-2">
            {premium.slice(0, 6).map((item) => (
              <RealEstateListingCard
                key={item.id || item._id}
                item={item}
                variant="horizontal"
              />
            ))}
          </div>
        </section>
      )}

      <AdSlot placement="home_mid" cat={REAL_ESTATE_CAT} className="rounded-3xl overflow-hidden" />

      {developments.length > 0 && (
        <section>
          <RealEstateSectionHeader
            icon={Building2}
            title={t("realestate.complexesTitle")}
            description={t("realestate.complexesDesc")}
            actionLabel={t("realestate.allNovostroyki")}
            actionTo={buildRealEstateCategoryUrl(city, "Новостройки")}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developments.map((item) => (
              <Link
                key={item.id}
                to={`/realestate/zhk/${item.slug}`}
                className="card card-interactive group overflow-hidden"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-mist-200">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="hover-zoom h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-ink-300">
                      <Building2 size={40} aria-hidden="true" />
                    </div>
                  )}

                  {item.developer && (
                    <>
                      <div
                        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/60 to-transparent"
                        aria-hidden="true"
                      />
                      <span className="absolute bottom-3 left-3 text-2xs font-semibold uppercase tracking-wide text-white">
                        {item.developer}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-1 p-4">
                  <p className="font-bold text-ink-900 transition-colors group-hover:text-sun-700">
                    {item.name}
                  </p>
                  <p className="text-sm text-ink-400">
                    {item.district ? `${item.district}, ` : ""}
                    {item.city}
                  </p>
                  {item.completionDate && (
                    <p className="pt-1 text-xs text-ink-400">
                      {t("realestate.completion", { date: item.completionDate })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <RealEstateSectionHeader
          title={t("realestate.freshTitle", { city })}
          description={t("realestate.freshDesc")}
          actionLabel={t("realestate.viewAll")}
          actionTo={buildRealEstateListingUrl({ city })}
        />

        {loading && <ListingGridSkeleton count={8} />}

        {!loading && listings.length === 0 && fallbackListings.length === 0 && (
          <EmptyState
            icon={Building2}
            title={t("realestate.emptyInCity", { city })}
            description={t("realestate.emptyHint")}
            actionLabel={t("empty.postListing")}
            actionTo={`/add?cat=${REAL_ESTATE_CAT}`}
          />
        )}

        {!loading && listings.length === 0 && fallbackListings.length > 0 && (
          <div className="space-y-4">
            <Alert tone="info">{t("realestate.fallbackHint", { city })}</Alert>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {fallbackListings.map((item) => (
                <RealEstateListingCard key={item.id || item._id} item={item} />
              ))}
            </div>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {listings.map((item) => (
              <RealEstateListingCard key={item.id || item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
