import React from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Pencil,
  Check,
  PackageSearch,
} from "lucide-react";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { resolveMediaUrl } from "../lib/media";
import { formatPrice, getListingDisplayDate } from "../lib/format";
import { markListingViewed, markViewRecorded, wasViewRecorded } from "../lib/viewedListings";
import { trackContactIntent, trackListingView } from "../lib/track";
import { usePageMeta } from "../lib/usePageMeta";
import ListingImageLightbox from "../components/ListingImageLightbox";
import AdRelatedListings from "../components/AdRelatedListings";
import AdListingHeader from "../components/ad/AdListingHeader";
import AdStickyAside from "../components/ad/AdStickyAside";
import AdPurchasePanel from "../components/ad/AdPurchasePanel";
import RealEstateHighlights from "../components/RealEstateHighlights";
import PriceAdequacyBadge from "../components/PriceAdequacyBadge";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import AdSlot from "../components/AdSlot";
import { PromotionBadgeGroup } from "../components/PromotionBadge";
import { CAT_LABELS } from "../data/listingCategories";
import { enrichRealEstateListing, getSpecValue, isRealEstateListing } from "../lib/realEstate";
import { REPORT_REASONS } from "../data/reportReasons";
import { useI18n } from "../i18n";
import { getUserFacingErrorMessage } from "../lib/apiError";

const TOKEN_KEY = "auth_token";

function formatDate(dateStr, t) {
  if (!dateStr || Number.isNaN(Date.parse(dateStr))) return null;

  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays === 0) return t("date.today");
  if (diffDays === 1) return t("date.yesterday");
  if (diffDays < 7) return t("date.daysAgo", { count: diffDays });

  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getSellerName(ad) {
  if (ad.ownerSellerType === "company" && ad.ownerCompanyName) {
    return ad.ownerCompanyName.trim();
  }

  return (
    ad.sellerName ||
    ad.ownerName ||
    ad.userName ||
    ad.owner?.name ||
    ""
  ).trim();
}

function PageSkeleton() {
  return (
    <div className="container-x py-6 space-y-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-64" />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-5">
          <div className="rounded-3xl bg-slate-200 aspect-[4/3]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-16 rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="card p-6 space-y-3">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="card p-6 space-y-4 rounded-3xl">
            <div className="h-10 bg-slate-200 rounded w-1/2" />
            <div className="h-12 bg-slate-200 rounded" />
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="h-11 bg-slate-200 rounded-xl" />
            <div className="h-11 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  React.useEffect(() => {
    if (!message) return;

    const t = setTimeout(onClose, 2800);

    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 xl:bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-fade-in-up"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm shadow-lg">
        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
        {message}
      </div>
    </div>
  );
}

export default function AdDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [ad, setAd] = React.useState(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const desktopThumbsRef = React.useRef(null);
  const mobileThumbsRef = React.useRef(null);
  const galleryTouchStartX = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [isFav, setIsFav] = React.useState(false);
  const [phoneVisible, setPhoneVisible] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("fraud");
  const [reportDetails, setReportDetails] = React.useState("");
  const [reportSending, setReportSending] = React.useState(false);
  const [sellerReviews, setSellerReviews] = React.useState({
    summary: { average: 0, count: 0 },
    items: [],
  });
  const [sellerRegisteredAt, setSellerRegisteredAt] = React.useState(null);

  React.useEffect(() => {
    if (!token) {
      setCurrentUserId(null);
      return;
    }

    let active = true;

    api
      .me(token)
      .then((user) => {
        if (active) {
          setCurrentUserId(user?.id || user?._id || null);
        }
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

    async function loadAd() {
      try {
        setLoading(true);
        sessionStorage.removeItem("ad_preview");

        const data = await api.listingById(id);

        if (active) {
          setAd(data);
          setActiveImageIndex(0);
          setPhoneVisible(false);
        }
      } catch {
        if (active) setAd(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAd();

    return () => {
      active = false;
    };
  }, [id]);

  React.useEffect(() => {
    if (!ad) return undefined;

    const adId = String(ad._id || ad.id);

    markListingViewed(adId);
    trackListingView(ad);

    if (wasViewRecorded(adId)) {
      return undefined;
    }

    let active = true;

    api
      .recordListingView(adId)
      .then((data) => {
        if (!active) return;

        markViewRecorded(adId);

        if (data?.views != null) {
          setAd((current) =>
            current ? { ...current, views: data.views } : current
          );
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [ad]);

  React.useEffect(() => {
    if (!token || !ad) {
      setIsFav(false);
      return;
    }

    api
      .favorites(token)
      .then((list) => {
        const ids = new Set(
          (Array.isArray(list) ? list : []).map((i) => String(i._id || i.id))
        );

        setIsFav(ids.has(String(ad._id || ad.id)));
      })
      .catch(() => setIsFav(false));
  }, [token, ad]);

  const buildImages = React.useCallback(
    (width) => {
      if (!ad) return ["/img/placeholder.jpg"];

      if (ad.images?.length) {
        return ad.images.map((i) => resolveMediaUrl(i.url || i, { width }));
      }

      if (ad.img) return [resolveMediaUrl(ad.img, { width })];

      return ["/img/placeholder.jpg"];
    },
    [ad]
  );

  const images = React.useMemo(() => buildImages(1200), [buildImages]);
  const thumbImages = React.useMemo(() => buildImages(160), [buildImages]);

  usePageMeta({
    enabled: Boolean(ad),
    title: ad?.title || t("listing.title"),
    description: [
      formatPrice(ad?.price, { emptyLabel: t("price.negotiable") }),
      ad?.location || ad?.city,
      ad?.description?.slice(0, 140),
    ]
      .filter(Boolean)
      .join(" · "),
    image: images[0]?.startsWith("http")
      ? images[0]
      : images[0]
      ? `${window.location.origin}${images[0]}`
      : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    type: "product",
    jsonLd: ad
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: ad.title || t("listing.title"),
          description: ad.description || "",
          image: images[0],
          offers: {
            "@type": "Offer",
            priceCurrency: "TJS",
            price: String(ad.price || "").replace(/[^\d.,]/g, "") || undefined,
            availability: "https://schema.org/InStock",
            url: typeof window !== "undefined" ? window.location.href : undefined,
          },
        }
      : null,
  });

  React.useEffect(() => {
    if (!ad?.owner) {
      setSellerRegisteredAt(null);
      return undefined;
    }

    let active = true;

    api
      .sellerPublic(ad.owner)
      .then((profile) => {
        if (active) {
          setSellerRegisteredAt(profile?.createdAt || null);
        }
      })
      .catch(() => {
        if (active) setSellerRegisteredAt(null);
      });

    return () => {
      active = false;
    };
  }, [ad?.owner]);

  React.useEffect(() => {
    if (!ad?.owner) return;

    api
      .sellerReviews(ad.owner)
      .then((data) => {
        if (!data) return;

        setSellerReviews({
          summary: data.summary || { average: 0, count: 0 },
          items: Array.isArray(data.items) ? data.items : [],
        });
      })
      .catch(() => {});
  }, [ad?.owner]);

  const storedUserId = React.useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("auth_user") || "null");
      return user?.id || user?._id || null;
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    desktopThumbsRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    mobileThumbsRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeImageIndex]);

  const toggleFav = async () => {
    if (!token) {
      goToAuth(nav);
      return;
    }

    const adId = ad?._id || ad?.id;

    if (!adId) return;

    try {
      if (isFav) {
        await api.removeFavorite(token, adId);
        setIsFav(false);
        setToast(t("favorites.removed"));
      } else {
        await api.addFavorite(token, adId);
        setIsFav(true);
        setToast(t("favorites.added"));
      }
    } catch (e) {
      console.error("Favorite toggle failed:", e);
    }
  };

  const openSellerChat = () => {
    if (!token) {
      goToAuth(nav);
      return;
    }

    if (!ad?.owner) {
      setToast(t("seller.unavailable"));
      return;
    }

    trackContactIntent(ad, "message");

    const listingId = ad._id || ad.id;

    nav(
      `/messages?listingId=${listingId}&peerId=${ad.owner}&title=${encodeURIComponent(ad.title || t("listing.title"))}`
    );
  };

  const revealPhone = () => {
    trackContactIntent(ad, "phone");
    setPhoneVisible(true);
  };

  const openReport = () => {
    if (!token) {
      goToAuth(nav);
      return;
    }

    setReportReason("fraud");
    setReportDetails("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!token || !ad) {
      goToAuth(nav);
      return;
    }

    if (reportReason === "other" && reportDetails.trim().length < 5) {
      setToast(t("report.describe"));
      return;
    }

    try {
      setReportSending(true);

      await api.reportListing(token, ad._id || ad.id, {
        reason: reportReason,
        details: reportDetails.trim(),
      });

      setReportOpen(false);
      setToast(t("report.sent"));
    } catch (e) {
      const message = e.message || t("errors.sendReport");

      if (message.includes("already reported") || message.includes("409")) {
        setToast(t("errors.reportDuplicate"));
        setReportOpen(false);
        return;
      }

      if (message.includes("Invalid token") || message.includes("401")) {
        goToAuth(nav);
        return;
      }

      setToast(getUserFacingErrorMessage(e, t));
    } finally {
      setReportSending(false);
    }
  };

  const updateListingStatus = async (action) => {
    if (!token || !ad) {
      goToAuth(nav);
      return;
    }

    const prompts = {
      sold: t("listing.confirmSold"),
      archive: t("listing.confirmArchive"),
      republish: t("listing.confirmRepublish"),
    };

    if (!confirm(prompts[action] || t("listing.confirmStatus"))) {
      return;
    }

    try {
      const listingId = ad._id || ad.id;
      let updated;

      if (action === "sold") {
        updated = await api.markListingSold(token, listingId);
      } else if (action === "archive") {
        updated = await api.archiveListing(token, listingId);
      } else {
        updated = await api.republishListing(token, listingId);
      }

      setAd((current) => ({ ...current, ...updated }));
      setToast(
        action === "sold"
          ? t("listing.statusSold")
          : action === "archive"
          ? t("listing.statusArchived")
          : t("listing.statusRepublished")
      );
    } catch (e) {
      setToast(getUserFacingErrorMessage(e, t) || t("listing.statusUpdateFailed"));
    }
  };

  const shareAd = async () => {
    const url = window.location.href;
    const title = ad?.title || t("listing.title");

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      setToast(t("listing.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled share */
    }
  };

  const goPrev = () =>
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const goNext = () =>
    setActiveImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );

  const onGalleryTouchStart = (event) => {
    galleryTouchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onGalleryTouchEnd = (event) => {
    if (galleryTouchStartX.current == null || images.length <= 1) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;

    const diff = endX - galleryTouchStartX.current;
    galleryTouchStartX.current = null;

    if (Math.abs(diff) < 48) return;
    if (diff > 0) goPrev();
    else goNext();
  };

  if (loading) return <PageSkeleton />;

  if (!ad) {
    return (
      <div className="container-x py-16">
        <div className="max-w-md mx-auto text-center space-y-5 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 grid place-items-center text-4xl">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("errors.loadFailed")}
          </h1>
          <p className="text-slate-500">
            {t("seller.notFoundDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/listing" className="btn">
              {t("empty.goCatalog")}
            </Link>
            <Link to="/" className="btn btn-primary">
              {t("empty.goHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const specs = Array.isArray(ad.specs)
    ? ad.specs
    : ad.attrs && typeof ad.attrs === "object"
    ? Object.entries(ad.attrs).map(([name, value]) => ({ name, value }))
    : [];

  const filteredSpecs = specs.filter((spec) => {
    const name = String(spec.name || "").toLowerCase();
    return name !== "цена" && name !== "price";
  });

  const price = formatPrice(ad.price, { emptyLabel: t("price.negotiable") });
  const realEstateEnriched = isRealEstateListing(ad)
    ? enrichRealEstateListing(ad)
    : null;
  const realEstatePricePerSqm =
    realEstateEnriched?.realEstateSummary?.pricePerSqm || "";
  const sellerName = getSellerName(ad) || t("seller.default");
  const publicId = ad.publicId || ad.public_id || ad._id || ad.id;
  const listingId = ad._id || ad.id;
  const catLabel = CAT_LABELS[ad.cat] || ad.cat;
  const published = formatDate(getListingDisplayDate(ad) || ad.createdAt, t);
  const listingUrl = `/listing${ad.cat ? `?cat=${encodeURIComponent(ad.cat)}` : ""}${
    ad.subcategory
      ? `${ad.cat ? "&" : "?"}subcategory=${encodeURIComponent(ad.subcategory)}`
      : ""
  }`;
  const isOwner = Boolean(
    ad?.owner &&
      (String(currentUserId) === String(ad.owner) ||
        String(storedUserId) === String(ad.owner))
  );

  const moderationStatus = ad.status || "pending";
  const isSold = moderationStatus === "sold";
  const isArchived = moderationStatus === "archived";
  const isInactive = isSold || isArchived;
  const canContact = moderationStatus === "approved" && !isOwner;

  if (isArchived && !isOwner) {
    return (
      <div className="container-x py-10">
        <EmptyState
          icon={PackageSearch}
          title={t("listing.unpublished")}
          description={t("listing.unpublishedDesc")}
          actionLabel={t("empty.goCatalog")}
          onAction={() => nav("/listing")}
        />
      </div>
    );
  }

  const breadcrumbItems = [
    { label: t("nav.home"), to: "/" },
    ...(ad.cat
      ? [{ label: catLabel, to: `/c/${ad.cat}` }]
      : []),
    ...(ad.subcategory
      ? [{ label: ad.subcategory, to: listingUrl }]
      : []),
    { label: ad.title || t("listing.title") },
  ];

  return (
    <div className="min-h-screen bg-mist pb-10">
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="container-x py-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="container-x pb-6">
        {(moderationStatus === "pending" || moderationStatus === "rejected") && (
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              moderationStatus === "rejected"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {moderationStatus === "pending" ? (
              <p>
                {isOwner
                  ? t("listing.moderationPending")
                  : t("listing.moderationReview")}
              </p>
            ) : (
              <p>
                {isOwner
                  ? `${t("listing.moderationRejected")}${ad.rejectionReason ? `: ${ad.rejectionReason}` : ""}`
                  : t("listing.moderationRejected")}
              </p>
            )}
          </div>
        )}

        {(isSold || isArchived) && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
            {isSold
              ? isOwner
                ? t("listing.soldOwner")
                : t("listing.soldOther")
              : t("listing.archived")}
          </div>
        )}

        <div className="flex flex-col xl:flex-row xl:items-stretch gap-6 xl:gap-8">
          {/* Left column */}
          <div className="xl:flex-[7] min-w-0 space-y-5">
            {/* Gallery */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col md:flex-row">
                {images.length > 1 && (
                  <div
                    ref={desktopThumbsRef}
                    className="hidden md:flex max-h-[520px] w-[88px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-slate-100 p-3 scrollbar-hide"
                  >
                    {thumbImages.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        data-active={activeImageIndex === index ? "true" : "false"}
                        onClick={() => setActiveImageIndex(index)}
                        className={`rounded-xl overflow-hidden border-2 transition-all ${
                          activeImageIndex === index
                            ? "border-sun ring-2 ring-sun/20"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-16 object-cover bg-slate-50"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/120x80?text=—";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className="relative flex-1 group"
                  onTouchStart={onGalleryTouchStart}
                  onTouchEnd={onGalleryTouchEnd}
                >
                  <button
                    type="button"
                    className="w-full block cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={t("a11y.photoFullscreen")}
                  >
                    <img
                      src={images[activeImageIndex] || images[0]}
                      alt={ad.title || t("listing.photoAlt")}
                      fetchpriority="high"
                      decoding="async"
                      className="w-full aspect-[4/3] object-contain bg-slate-50"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/900x600?text=No+Image";
                      }}
                    />
                  </button>

                  <PromotionBadgeGroup
                    vip={ad.vip}
                    top={ad.top}
                    size="lg"
                    className="absolute top-3 left-3 z-10"
                  />

                  {images.length > 1 && (
                    <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                      {activeImageIndex + 1} / {images.length}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white transition hover:bg-black/70"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Увеличить
                  </button>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:bg-white"
                        aria-label={t("a11y.photoPrev")}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:bg-white"
                        aria-label={t("a11y.photoNext")}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div
                  ref={mobileThumbsRef}
                  className="flex md:hidden gap-2 p-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory border-t border-slate-100"
                >
                  {thumbImages.map((src, index) => (
                    <button
                      key={`mob-${src}-${index}`}
                      type="button"
                      data-active={activeImageIndex === index ? "true" : "false"}
                      onClick={() => setActiveImageIndex(index)}
                      className={`snap-start shrink-0 rounded-xl overflow-hidden border-2 transition ${
                        activeImageIndex === index
                          ? "border-sun ring-2 ring-sun/20"
                          : "border-transparent opacity-80"
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-20 h-16 object-cover bg-slate-50"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/120x80?text=—";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:hidden">
              <AdListingHeader
                title={ad.title}
                publicId={publicId}
                location={ad.location || ad.city}
                published={published}
                views={ad.views}
              />
            </section>

            {!isOwner && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:hidden">
                <AdPurchasePanel
                  price={price}
                  realEstatePricePerSqm={realEstatePricePerSqm}
                  ad={ad}
                  sellerName={sellerName}
                  sellerRegisteredAt={sellerRegisteredAt}
                  sellerReviews={sellerReviews}
                  canContact={canContact}
                  isInactive={isInactive}
                  phoneVisible={phoneVisible}
                  onRevealPhone={revealPhone}
                  onChat={openSellerChat}
                  isFav={isFav}
                  onToggleFav={toggleFav}
                  onShare={shareAd}
                  copied={copied}
                  onReport={openReport}
                />
              </section>
            )}

            {isRealEstateListing(ad) && <RealEstateHighlights ad={ad} />}

            {isRealEstateListing(ad) && <PriceAdequacyBadge item={ad} />}

            {isRealEstateListing(ad) && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-2">
                <h2 className="text-lg font-bold text-slate-900">Расположение</h2>
                <p className="text-slate-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sun shrink-0 mt-1" />
                  <span>
                    {[ad.location || t("location.dushanbe"), getSpecValue(ad.specs, "Район"), getSpecValue(ad.specs, "Адрес")]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              </section>
            )}

            {isRealEstateListing(ad) &&
              (realEstateEnriched?.realEstateSummary?.deal === "Купить" ||
                getSpecValue(ad.specs, "Тип сделки") === "Купить") && (
              <MortgageCalculator price={ad.price} />
            )}

            {/* Specs */}
            {filteredSpecs.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">
                  {t("form.specs")}
                </h2>
                <div className="divide-y divide-slate-100">
                  {filteredSpecs.map((spec, index) => (
                    <div
                      key={`${spec.name}-${index}`}
                      className="grid grid-cols-1 gap-1 py-3 text-sm sm:grid-cols-2 sm:gap-4"
                    >
                      <span className="text-slate-500">{spec.name}</span>
                      <span className="font-semibold text-slate-900 sm:text-right">
                        {String(spec.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <AdSlot
              placement="ad_details_mid"
              cat={ad.cat || ""}
              variant="native"
            />

            {/* Description */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Описание</h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-7 text-[15px]">
                {ad.description || t("listing.noDescription")}
              </p>
            </section>

            <AdRelatedListings
              ad={ad}
              listingUrl={listingUrl}
              catLabel={catLabel}
            />
          </div>

          {/* Right sidebar — desktop + owner actions on mobile */}
          <AdStickyAside
            className={`xl:flex-[5] xl:min-w-[320px] ${
              isOwner ? "" : "hidden xl:block"
            }`}
          >
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="hidden xl:block space-y-5">
                  <AdListingHeader
                    title={ad.title}
                    publicId={publicId}
                    location={ad.location || ad.city}
                    published={published}
                    views={ad.views}
                  />

                  {!isOwner && (
                    <AdPurchasePanel
                      price={price}
                      realEstatePricePerSqm={realEstatePricePerSqm}
                      ad={ad}
                      sellerName={sellerName}
                      sellerRegisteredAt={sellerRegisteredAt}
                      sellerReviews={sellerReviews}
                      canContact={canContact}
                      isInactive={isInactive}
                      phoneVisible={phoneVisible}
                      onRevealPhone={revealPhone}
                      onChat={openSellerChat}
                      isFav={isFav}
                      onToggleFav={toggleFav}
                      onShare={shareAd}
                      copied={copied}
                      onReport={openReport}
                    />
                  )}
                </div>

                {isOwner && ad.expiresAt && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Объявление активно до{" "}
                    {new Date(ad.expiresAt).toLocaleDateString("ru-RU")}. После этой
                    даты оно будет автоматически снято — опубликуйте снова или{" "}
                    <Link to="/profile?tab=promote" className="font-semibold underline">
                      подключите VIP/TOP
                    </Link>
                    .
                  </div>
                )}

                {isOwner ? (
                    <>
                      {moderationStatus === "approved" && (
                        <Link
                          to={`/profile?tab=promote&listing=${listingId}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-teal-50 px-4 py-3 text-sm font-semibold text-ink hover:brightness-[0.98] transition"
                        >
                          Продвинуть объявление (VIP, TOP)
                        </Link>
                      )}

                      {moderationStatus === "approved" && (
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            className="btn w-full py-3 rounded-2xl"
                            onClick={() => updateListingStatus("sold")}
                          >
                            Отметить как проданное
                          </button>

                          <button
                            type="button"
                            className="btn w-full py-3 rounded-2xl"
                            onClick={() => updateListingStatus("archive")}
                          >
                            Снять с публикации
                          </button>
                        </div>
                      )}

                      {(isSold || isArchived) && (
                        <button
                          type="button"
                          className="btn w-full py-3 rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => updateListingStatus("republish")}
                        >
                          Опубликовать снова
                        </button>
                      )}

                      <Link
                        to="/messages"
                        className="btn w-full py-3 rounded-2xl"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Сообщения покупателей
                      </Link>
                    </>
                  ) : null}

                  {isOwner && (
                    <Link
                      to={`/edit/${ad._id || ad.id}`}
                      className="btn w-full py-3 rounded-2xl border-sun-200 bg-sun-50 text-sun-700 hover:bg-sun-100"
                    >
                      <Pencil className="w-5 h-5" />
                      {t("listing.editForm")}
                    </Link>
                  )}

              </section>
          </AdStickyAside>
        </div>
      </div>

      {reportOpen &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <button
              type="button"
              aria-label={t("common.close")}
              className="absolute inset-0 bg-black/40"
              onClick={() => setReportOpen(false)}
            />

            <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-xl border p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{t("report.title")}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Расскажите, что не так с этим объявлением.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="p-2 rounded-xl border hover:bg-slate-50"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {REPORT_REASONS.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition ${
                      reportReason === item.id
                        ? "border-sun bg-sun-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={item.id}
                      checked={reportReason === item.id}
                      onChange={() => setReportReason(item.id)}
                      className="accent-sun"
                    />
                    <span className="text-sm font-medium text-slate-800">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              {reportReason === "other" && (
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  placeholder={t("report.placeholder")}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sun/40 resize-y"
                />
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="btn rounded-xl"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="button"
                  onClick={submitReport}
                  disabled={reportSending}
                  className="btn btn-primary rounded-xl disabled:opacity-60"
                >
                  {reportSending ? t("report.sending") : t("report.send")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <ListingImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        activeIndex={activeImageIndex}
        onChangeIndex={setActiveImageIndex}
        title={ad.title || t("listing.photoAlt")}
      />
    </div>
  );
}
