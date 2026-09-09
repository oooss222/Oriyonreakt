import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  User,
} from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import ListingCard from "../components/ListingCard";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import EmptyState from "../components/EmptyState";
import { StarRating } from "../components/SellerReviewsPanel";
import SellerReviewsPanel from "../components/SellerReviewsPanel";
import BusinessBadge from "../components/BusinessBadge";
import SectionHeader from "../components/SectionHeader";
import { Avatar, Badge, Skeleton, SkeletonText } from "../ui";
import { usePageMeta } from "../lib/usePageMeta";
import { getDisplayName, parseCompanyAddresses } from "../lib/businessAccount";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import { getUserFacingErrorMessage } from "../lib/apiError";

const TOKEN_KEY = "auth_token";

function formatMemberSince(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "";

  return new Date(value).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function sellerTypeLabel(type, t) {
  return type === "company" ? t("seller.premium") : t("seller.private");
}

function normalizeExternalUrl(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function Seller() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [seller, setSeller] = React.useState(null);
  const [listings, setListings] = React.useState([]);
  const [reviews, setReviews] = React.useState({
    summary: { average: 0, count: 0 },
    items: [],
  });
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

        const [profile, items, reviewData] = await Promise.all([
          api.sellerPublic(id),
          api.listings({ owner: id, limit: 100, sort: "new" }),
          api.sellerReviews(id),
        ]);

        if (!active) return;

        setSeller(profile);
        setListings(Array.isArray(items) ? items.filter(Boolean) : []);
        setReviews({
          summary: reviewData?.summary || { average: 0, count: 0 },
          items: Array.isArray(reviewData?.items) ? reviewData.items : [],
        });
      } catch (e) {
        if (active) {
          setSeller(null);
          setListings([]);
          setError(getUserFacingErrorMessage(e, t) || t("errors.loadSeller"));
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
  }, [id, t]);

  const sellerName = getDisplayName(seller);
  const memberSince = formatMemberSince(seller?.createdAt);
  const companyAddresses = parseCompanyAddresses(seller?.companyAddress);
  const isOwner = Boolean(
    currentUserId && seller?.id && String(currentUserId) === String(seller.id)
  );

  usePageMeta({
    title: sellerName,
    description: seller
      ? t("seller.metaDescription", {
          name: sellerName,
          count: seller.listingsCount || listings.length,
        })
      : t("seller.meta"),
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
      <div className="page-container stack-page" aria-busy="true">
        <Skeleton className="h-4 w-48" />
        <div className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <SkeletonText lines={2} />
        </div>
        <ListingGridSkeleton count={8} />
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="page-container py-10">
        <EmptyState
          icon={User}
          title={t("seller.notFound")}
          description={error || t("seller.notFoundDesc")}
          actionLabel={t("empty.goCatalog")}
          onAction={() => nav("/listing")}
        />
      </div>
    );
  }

  return (
    <div className="page-container stack-page">
      <Breadcrumbs
        items={[
          { label: t("nav.home"), to: "/" },
          { label: t("seller.sellers"), to: "/listing" },
          { label: sellerName },
        ]}
      />

      <section className="card space-y-5 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar
            src={
              seller.sellerType === "company" ? seller.companyLogo : undefined
            }
            name={sellerName}
            size="xl"
            rounded="rounded-2xl"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                {sellerName}
              </h1>

              <BusinessBadge
                sellerType={seller.sellerType}
                businessVerified={seller.businessVerified}
                size="lg"
              />

              {seller.emailVerified && (
                <Badge tone="success" icon={BadgeCheck}>
                  {t("seller.emailVerified")}
                </Badge>
              )}

              {seller.phoneVerified && (
                <Badge tone="info" icon={BadgeCheck}>
                  {t("seller.phoneListed")}
                </Badge>
              )}

              {Number(seller.ratingCount || 0) > 0 && (
                <Badge tone="warning">
                  <StarRating value={seller.ratingAverage} size={12} />
                  {Number(seller.ratingAverage || 0).toFixed(1)} (
                  {seller.ratingCount})
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
              <span className="inline-flex items-center gap-1.5">
                {seller.sellerType === "company" ? (
                  <Building2 className="h-4 w-4" aria-hidden />
                ) : (
                  <User className="h-4 w-4" aria-hidden />
                )}
                {sellerTypeLabel(seller.sellerType, t)}
              </span>

              {memberSince && (
                <span>{t("seller.memberSince", { date: memberSince })}</span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <Package className="h-4 w-4" aria-hidden />
                {t("seller.listingsCount", { count: seller.listingsCount })}
              </span>
            </div>
          </div>
        </div>

        {seller.sellerType === "company" && seller.companyDescription && (
          <p className="rounded-2xl border border-ink-200 bg-mist-50 p-4 text-sm leading-relaxed text-ink-700">
            {seller.companyDescription}
          </p>
        )}

        {seller.sellerType === "company" &&
          (companyAddresses.length > 0 ||
            seller.companyWebsite ||
            seller.companyInstagram) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {companyAddresses.map((address) => (
                <span
                  key={address}
                  className="inline-flex items-center gap-1.5 text-ink-600"
                >
                  <MapPin className="h-4 w-4 text-ink-400" aria-hidden />
                  {address}
                </span>
              ))}
              {seller.companyWebsite && (
                <a
                  href={normalizeExternalUrl(seller.companyWebsite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[2.25rem] items-center gap-1.5 font-medium text-lagoon-700 hover:underline"
                >
                  <Globe className="h-4 w-4" aria-hidden />
                  {t("seller.website")}
                </a>
              )}
              {seller.companyInstagram && (
                <a
                  href={normalizeExternalUrl(seller.companyInstagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[2.25rem] items-center gap-1.5 font-medium text-lagoon-700 hover:underline"
                >
                  <Instagram className="h-4 w-4" aria-hidden />
                  Instagram
                </a>
              )}
            </div>
          )}

        <p className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-3 py-2.5 text-xs leading-relaxed text-success-800">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-success-600"
            aria-hidden
          />
          <span>{t("auth.trustLoginItem3Text")}</span>
        </p>

        {!isOwner && (
          <div className="flex flex-col flex-wrap gap-2.5 sm:flex-row">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={openSellerChat}
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t("seller.writeSeller")}
            </button>

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg border-[#25D366] bg-[#25D366] text-white hover:bg-[#20bd5a]"
              >
                WhatsApp
              </a>
            )}

            {seller.telegram && (
              <a
                href={seller.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg"
              >
                Telegram
              </a>
            )}
          </div>
        )}

        {isOwner && (
          <Link to="/profile" className="btn btn-lg w-full sm:w-auto">
            {t("seller.myProfile")}
          </Link>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="seller-listings">
        <SectionHeader
          id="seller-listings"
          title={t("seller.sellerListings")}
          subtitle={t("seller.activeListingsDesc")}
          icon={Package}
        />

        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t("seller.noListings")}
            description={t("seller.noListingsDesc")}
            actionLabel={t("empty.goCatalog")}
            onAction={() => nav("/listing")}
          />
        ) : (
          <div className="grid-items">
            {listings.map((item) => (
              <ListingCard key={item._id || item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <SellerReviewsPanel
        sellerId={seller.id}
        token={token}
        canReview={Boolean(token) && !isOwner}
        summary={reviews.summary}
        items={reviews.items}
        onSubmitted={(result) => {
          setReviews({
            summary: result.summary || reviews.summary,
            items: result.review ? [result.review, ...reviews.items] : reviews.items,
          });
        }}
      />
    </div>
  );
}
