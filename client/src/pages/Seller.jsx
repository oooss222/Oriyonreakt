import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  MessageCircle,
  Package,
  ShieldCheck,
  User,
} from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import ListingCard from "../components/ListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import EmptyState from "../components/EmptyState";
import { usePageMeta } from "../lib/usePageMeta";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";

const TOKEN_KEY = "auth_token";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "П";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatMemberSince(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "";

  return new Date(value).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function sellerTypeLabel(type) {
  return type === "company" ? "Компания" : "Частное лицо";
}

export default function Seller() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [seller, setSeller] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [currentUserId, setCurrentUserId] = React.useState(null);

  React.useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      return;
    }

    let active = true;

    api
      .me(token)
      .then((user) => {
        if (active) setCurrentUserId(user?.id || user?._id || null);
      })
      .catch(() => {
        if (active) setCurrentUserId(null);
      });

    return () => {
      active = false;
    };
  }, [token]);

  React.useEffect(() => {
    let active = true;

    async function loadSellerPage() {
      try {
        setLoading(true);
        setError("");

        const [profile, items] = await Promise.all([
          api.sellerPublic(id),
          api.listings({ owner: id, limit: 100, sort: "new" }),
        ]);

        if (!active) return;

        setSeller(profile);
        setListings(Array.isArray(items) ? items.filter(Boolean) : []);
      } catch (e) {
        if (active) {
          setSeller(null);
          setListings([]);
          setError(e.message || "Не удалось загрузить профиль продавца");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSellerPage();

    return () => {
      active = false;
    };
  }, [id]);

  const sellerName = seller?.name || "Продавец";
  const memberSince = formatMemberSince(seller?.createdAt);
  const isOwner = Boolean(
    currentUserId && seller?.id && String(currentUserId) === String(seller.id)
  );

  usePageMeta({
    title: sellerName,
    description: seller
      ? `Объявления продавца ${sellerName} на Oriyon.store. ${seller.listingsCount || listings.length} активных объявлений.`
      : "Профиль продавца на Oriyon.store",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  const openSellerChat = () => {
    if (!token) {
      goToAuth(nav);
      return;
    }

    const listingId = listings[0]?._id || listings[0]?.id;
    const params = new URLSearchParams({
      peerId: seller.id,
      title: sellerName,
    });

    if (listingId) {
      params.set("listingId", listingId);
    }

    nav(`/messages?${params.toString()}`);
  };

  const whatsappHref = seller?.whatsapp
    ? `https://wa.me/${seller.whatsapp.replace(/[^\d]/g, "")}`
    : "";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="card p-6 rounded-3xl animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-slate-200 rounded w-40" />
              <div className="h-4 bg-slate-200 rounded w-56" />
            </div>
          </div>
        </div>
        <ListingGridSkeleton count={8} />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState
          icon={User}
          title="Продавец не найден"
          description={error || "Такого профиля нет или он недоступен."}
          actionLabel="К каталогу"
          onAction={() => nav("/listing")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Главная", to: "/" },
          { label: "Продавцы", to: "/listing" },
          { label: sellerName },
        ]}
      />

      <section className="card rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sun to-lagoon flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            {getInitials(sellerName)}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{sellerName}</h1>

              {seller.emailVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Email подтверждён
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                {seller.sellerType === "company" ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {sellerTypeLabel(seller.sellerType)}
              </span>

              {memberSince && <span>На сайте с {memberSince}</span>}

              <span className="inline-flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                {seller.listingsCount} объявлений
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>
            Встречайтесь лично и проверяйте товар перед оплатой
          </span>
        </div>

        {!isOwner && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            <button
              type="button"
              className="btn btn-primary rounded-2xl py-3"
              onClick={openSellerChat}
            >
              <MessageCircle className="w-5 h-5" />
              Написать продавцу
            </button>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn rounded-2xl py-3 bg-[#25D366] text-white border-[#25D366] hover:bg-[#20bd5a]"
              >
                WhatsApp
              </a>
            )}

            {seller.telegram && (
              <a
                href={seller.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn rounded-2xl py-3"
              >
                Telegram
              </a>
            )}
          </div>
        )}

        {isOwner && (
          <Link to="/profile" className="btn rounded-2xl py-3 w-full sm:w-auto">
            Мой профиль
          </Link>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Объявления продавца
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Активные объявления на Oriyon.store
            </p>
          </div>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Нет активных объявлений"
            description="У этого продавца пока нет опубликованных объявлений."
            actionLabel="К каталогу"
            onAction={() => nav("/listing")}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {listings.map((item) => (
              <ListingCard key={item._id || item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
