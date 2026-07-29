import React from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, Calendar, MapPin, ArrowRight } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import RealEstateListingCard from "../components/RealEstateListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import { api } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";
import { buildRealEstateListingUrl } from "../lib/realestateSeo";

export default function RealEstateDevelopment() {
  const { slug } = useParams();
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
          setError(e.message || "ЖК не найден");
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
      ? `${development.name} — новостройка в ${development.city} | Oriyon.store`
      : "Жилой комплекс | Oriyon.store",
    description: development?.description || "Новостройки и квартиры от застройщика на Oriyon.store",
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ListingGridSkeleton />
      </div>
    );
  }

  if (error || !development) {
    return (
      <div className="container mx-auto px-4 py-10 text-center space-y-3">
        <h1 className="text-2xl font-bold">ЖК не найден</h1>
        <Link to="/realestate" className="btn rounded-xl">
          К недвижимости
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Недвижимость", to: "/realestate" },
          { label: "ЖК", to: "/realestate" },
          { label: development.name },
        ]}
      />

      <section className="rounded-3xl overflow-hidden border bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[260px] bg-slate-100">
            {development.imageUrl ? (
              <img
                src={development.imageUrl}
                alt={development.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-slate-400">
                <Building2 size={48} />
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-sun-50 text-sun-800 px-3 py-1 text-xs font-bold">
              {development.developer || "Застройщик"}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">{development.name}</h1>
            <p className="text-slate-600 leading-relaxed">{development.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} className="text-sun" />
                {development.city}
                {development.district ? `, ${development.district}` : ""}
              </span>
              {development.completionDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={16} className="text-sun" />
                  Сдача: {development.completionDate}
                </span>
              )}
            </div>

            {development.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {development.amenities.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            <Link
              to={buildRealEstateListingUrl({
                city: development.city,
                subcategory: "Новостройки",
                specs: { ЖК: development.name },
              })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-sun hover:text-sun-600"
            >
              Все квартиры в этом ЖК
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Квартиры в {development.name}</h2>

        {listings.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-slate-600">
            Пока нет активных объявлений в этом ЖК.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {listings.map((item) => (
              <RealEstateListingCard key={item.id || item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
