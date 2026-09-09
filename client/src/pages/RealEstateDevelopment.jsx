import React from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, Calendar, MapPin, ArrowRight } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import { api } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";
import { buildRealEstateListingUrl } from "../lib/realestateSeo";
import { useI18n } from "../i18n";
import { Badge, EmptyState, Skeleton } from "../ui";

export default function RealEstateDevelopment() {
  const { slug } = useParams();
  const { t } = useI18n();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await api.developmentBySlug(slug);
        if (active) setData(response);
      } catch (e) {
        if (active) {
          setData(null);
          setError(e.message || "not-found");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [slug]);

  const development = data?.development;
  const listings = Array.isArray(data?.listings) ? data.listings : [];

  usePageMeta({
    title: development
      ? t("realestate.developmentMetaTitle", {
          name: development.name,
          city: development.city,
        })
      : t("realestate.developmentMetaTitleGeneric"),
    description:
      development?.description || t("realestate.developmentMetaDesc"),
  });

  if (loading) {
    return (
      <div className="page-container stack-page">
        <Skeleton className="h-64 w-full" rounded="rounded-3xl" />
        <ListingGridSkeleton />
      </div>
    );
  }

  if (error || !development) {
    return (
      <div className="page-container stack-page">
        <EmptyState
          icon={Building2}
          title={t("realestate.developmentNotFound")}
          description={t("realestate.developmentNotFoundHint")}
          actionLabel={t("realestate.backToRealEstate")}
          actionTo="/realestate"
        />
      </div>
    );
  }

  return (
    <div className="page-container stack-page">
      <Breadcrumbs
        items={[
          { label: t("nav.home"), to: "/" },
          { label: t("categories.realestate"), to: "/realestate" },
          { label: t("realestate.complexBreadcrumb"), to: "/realestate" },
          { label: development.name },
        ]}
      />

      <section className="category-hero">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[260px] bg-mist-200">
            {development.imageUrl ? (
              <img
                src={development.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-ink-300">
                <Building2 size={48} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="space-y-4 p-6 md:p-8">
            <Badge tone="sun">{development.developer || t("realestate.developer")}</Badge>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              {development.name}
            </h1>

            <p className="leading-relaxed text-ink-600">{development.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} className="text-sun-500" aria-hidden="true" />
                {development.city}
                {development.district ? `, ${development.district}` : ""}
              </span>

              {development.completionDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={16} className="text-sun-500" aria-hidden="true" />
                  {t("realestate.completion", { date: development.completionDate })}
                </span>
              )}
            </div>

            {development.amenities?.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {development.amenities.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-mist-100 px-3 py-1 text-xs font-medium text-ink-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <Link
              to={buildRealEstateListingUrl({
                city: development.city,
                subcategory: "Новостройки",
                specs: { ЖК: development.name },
              })}
              className="inline-flex min-h-[2.5rem] items-center gap-2 text-sm font-semibold text-sun-700 hover:text-sun-800"
            >
              {t("realestate.allFlatsInComplex")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="section-title">
          {t("realestate.flatsIn", { name: development.name })}
        </h2>

        {listings.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t("realestate.noListingsInComplex")}
            description={t("realestate.noListingsInComplexHint")}
            actionLabel={t("realestate.backToRealEstate")}
            actionTo="/realestate"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((item) => (
              <RealEstateListingCard key={item.id || item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
