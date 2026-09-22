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
  PackageSearch,
  Phone,
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
import MortgageCalculator from "../components/MortgageCalculator";
import PriceAdequacyBadge from "../components/PriceAdequacyBadge";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import AdSlot from "../components/AdSlot";
import Toast from "../components/ui/Toast";
import Skeleton from "../components/ui/Skeleton";
import { PromotionBadgeGroup } from "../components/PromotionBadge";
import { CAT_LABELS } from "../data/listingCategories";
import { enrichRealEstateListing, getSpecValue, isRealEstateListing } from "../lib/realEstate";
import { REPORT_REASONS } from "../data/reportReasons";
import { useI18n } from "../i18n";
import { getUserFacingErrorMessage } from "../lib/apiError";

const TOKEN_KEY = "auth_token";

function formatDate(dateStr, t, numberLocale) {
  if (!dateStr || Number.isNaN(Date.parse(dateStr))) return null;

  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays === 0) return t("date.today");
  if (diffDays === 1) return t("date.yesterday");
  if (diffDays < 7) return t("date.daysAgo", { count: diffDays });

  return d.toLocaleDateString(numberLocale, {
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
    <div className="container-x space-y-6 py-6" aria-busy="true">
      <Skeleton className="h-4 w-64" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-7">
          <Skeleton className="panel aspect-[4/3] rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-20 rounded-xl" />
            ))}
          </div>
          <div className="panel space-y-3 p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24" />
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="panel space-y-4 p-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-12" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const numberLocale =
    lang === "en" ? "en-US" : lang === "tg" ? "tg-TJ" : "ru-RU";
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
  const [confirmAction, setConfirmAction] = React.useState(null);

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

  const confirmPrompts = {
    sold: t("listing.confirmSold"),
    archive: t("listing.confirmArchive"),
    republish: t("listing.confirmRepublish"),
  };

  const requestStatusChange = (action) => {
    if (!token || !ad) {
      goToAuth(nav);
      return;
    }

    setConfirmAction(action);
  };

  const updateListingStatus = async (action) => {
    if (!token || !ad) {
      goToAuth(nav);
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-mist-100 grid place-items-center text-4xl">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-ink-900">
            {t("errors.loadFailed")}
          </h1>
          <p className="text-ink-500">
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
  const published = formatDate(
    getListingDisplayDate(ad) || ad.createdAt,
    t,
    numberLocale
  );
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
    <div
      className={`min-h-screen bg-mist animate-fade-in ${
        !isOwner && canContact
          ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] xl:pb-10"
          : "pb-10"
      }`}
    >
      <Toast
        open={Boolean(toast)}
        message={toast}
        tone="success"
        onClose={() => setToast("")}
      />

      <div className="container-x py-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="container-x pb-6">
        {(moderationStatus === "pending" || moderationStatus === "rejected") && (
          <div
            className={`panel mb-6 p-4 ${
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
          <div className="panel mb-6 bg-mist/70 p-4 text-ink-700">
            {isSold
              ? isOwner
                ? t("listing.soldOwner")
                : t("listing.soldOther")
              : t("listing.archived")}
          </div>
        )}

        <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch xl:gap-8">
          {/* Left column */}
          <div className="min-w-0 space-y-5 xl:flex-[7]">
            {/* Gallery */}
            <section className="ad-gallery">
              <div className="flex flex-col md:flex-row">
                {images.length > 1 && (
                  <div
                    ref={desktopThumbsRef}
                    className="hidden max-h-[min(32rem,70dvh)] w-20 shrink-0 flex-col gap-2 overflow-y-auto border-r border-ink/10 p-3 scrollbar-hide md:flex"
                  >
                    {thumbImages.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        data-active={activeImageIndex === index ? "true" : "false"}
                        onClick={() => setActiveImageIndex(index)}
                        className={`overflow-hidden rounded-xl border-2 transition-all ${
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
                          className="h-16 w-full bg-mist-50 object-cover"
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
                  className="group relative flex-1"
                  onTouchStart={onGalleryTouchStart}
                  onTouchEnd={onGalleryTouchEnd}
                >
                  <button
                    type="button"
                    className="block w-full cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={t("a11y.photoFullscreen")}
                  >
                    <img
                      src={images[activeImageIndex] || images[0]}
                      alt={ad.title || t("listing.photoAlt")}
                      fetchpriority="high"
                      decoding="async"
                      className="aspect-[4/3] w-full bg-mist-50 object-contain"
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
                    className="absolute left-3 top-3 z-10"
                  />

                  {images.length > 1 && (
                    <span className="ad-gallery__chip bottom-3 right-3">
                      {activeImageIndex + 1} / {images.length}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="ad-gallery__chip right-3 top-3"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    {t("listing.zoomPhoto")}
                  </button>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="ad-gallery__nav left-3"
                        aria-label={t("a11y.photoPrev")}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="ad-gallery__nav right-3"
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
                  className="flex snap-x snap-mandatory gap-2 overflow-x-auto border-t border-ink/10 p-3 scrollbar-hide md:hidden"
                >
                  {thumbImages.map((src, index) => (
                    <button
                      key={`mob-${src}-${index}`}
                      type="button"
                      data-active={activeImageIndex === index ? "true" : "false"}
                      onClick={() => setActiveImageIndex(index)}
                      className={`snap-start shrink-0 overflow-hidden rounded-xl border-2 transition ${
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
                        className="h-16 w-20 bg-mist-50 object-cover"
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

            <AdSlot
              placement="listing_detail"
              cat={ad.cat || ""}
              city={ad.location || ""}
              eager
              className="overflow-hidden rounded-2xl"
            />

            <section className="panel p-5 xl:hidden">
              <AdListingHeader
                title={ad.title}
                publicId={publicId}
                location={ad.location || ad.city}
                published={published}
                views={ad.views}
              />
            </section>

            {!isOwner && (
              <section className="panel p-5 xl:hidden">
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
              <section className="panel space-y-2 p-5 md:p-6">
                <h2 className="section-title text-lg sm:text-lg">{t("listing.locationTitle")}</h2>
                <p className="flex items-start gap-2 text-ink-700">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-sun" />
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
              <section className="panel p-5 md:p-6">
                <h2 className="section-title mb-4 text-lg sm:text-lg">
                  {t("form.specs")}
                </h2>
                <div className="divide-y divide-ink/10">
                  {filteredSpecs.map((spec, index) => (
                    <div
                      key={`${spec.name}-${index}`}
                      className="grid grid-cols-1 gap-1 py-3 text-sm sm:grid-cols-2 sm:gap-4"
                    >
                      <span className="text-ink-500">{spec.name}</span>
                      <span className="font-semibold text-ink sm:text-right">
                        {String(spec.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description */}
            <section className="panel p-5 md:p-6">
              <h2 className="section-title mb-4 text-lg sm:text-lg">{t("form.description")}</h2>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink-700">
                {ad.description || t("listing.noDescription")}
              </p>
            </section>

            <AdSlot
              placement="listing_detail"
              cat={ad.cat || ""}
              city={ad.location || ""}
              variant="native"
            />

            <div className="hidden xl:block">
              <AdSlot
                placement="sidebar"
                cat={ad.cat || ""}
                city={ad.location || ""}
                className="overflow-hidden rounded-2xl"
              />
            </div>

            <AdRelatedListings
              ad={ad}
              listingUrl={listingUrl}
              catLabel={catLabel}
            />
          </div>

          {/* Right sidebar — desktop + owner actions on mobile */}
          <AdStickyAside
            className={`min-w-0 xl:flex-[5] ${
              isOwner ? "" : "hidden xl:block"
            }`}
          >
              <section className="panel p-6">
                <div className="hidden space-y-5 xl:block">
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
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {t("listing.expiresPrefix", {
                      date: new Date(ad.expiresAt).toLocaleDateString(numberLocale),
                    })}{" "}
                    <Link to="/profile?tab=promote" className="font-semibold underline">
                      {t("listing.expiresLink")}
                    </Link>
                    .
                  </div>
                )}

                {isOwner ? (
                    <>
                      {moderationStatus === "approved" && (
                        <Link
                          to={`/profile?tab=promote&listing=${listingId}`}
                          className="btn btn-accent w-full rounded-2xl"
                        >
                          {t("listing.promoteCta")}
                        </Link>
                      )}

                      {moderationStatus === "approved" && (
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            className="btn btn-secondary w-full rounded-2xl"
                            onClick={() => requestStatusChange("sold")}
                          >
                            {t("listing.actionMarkSold")}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary w-full rounded-2xl"
                            onClick={() => requestStatusChange("archive")}
                          >
                            {t("listing.actionUnpublish")}
                          </button>
                        </div>
                      )}

                      {(isSold || isArchived) && (
                        <button
                          type="button"
                          className="btn btn-lagoon w-full rounded-2xl"
                          onClick={() => requestStatusChange("republish")}
                        >
                          {t("profile.republish")}
                        </button>
                      )}

                      <Link
                        to="/messages"
                        className="btn btn-secondary w-full rounded-2xl"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {t("listing.buyerMessages")}
                      </Link>
                    </>
                  ) : null}

                  {isOwner && (
                    <Link
                      to={`/edit/${ad._id || ad.id}`}
                      className="btn w-full rounded-2xl border-sun-200 bg-sun-50 text-sun-700 hover:bg-sun-100"
                    >
                      <Pencil className="h-5 w-5" />
                      {t("listing.editForm")}
                    </Link>
                  )}

              </section>
          </AdStickyAside>
        </div>
      </div>

      {!isOwner && canContact && (
        <div className="ad-mobile-bar">
          <div className="ad-mobile-bar__inner">
            <div className="min-w-0">
              <p className="ad-mobile-bar__price">{price}</p>
              {realEstatePricePerSqm ? (
                <p className="truncate text-xs font-semibold text-sun-700">
                  {realEstatePricePerSqm}
                </p>
              ) : null}
            </div>

            {ad.phone ? (
              phoneVisible ? (
                <a
                  href={`tel:${ad.phone}`}
                  className="btn btn-primary shrink-0 rounded-xl px-4 py-2.5"
                >
                  <Phone className="h-4 w-4" />
                  {t("seller.call")}
                </a>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary shrink-0 rounded-xl px-4 py-2.5"
                  onClick={revealPhone}
                >
                  <Phone className="h-4 w-4" />
                  {t("seller.showPhone")}
                </button>
              )
            ) : (
              <button
                type="button"
                className="btn btn-primary shrink-0 rounded-xl px-4 py-2.5"
                onClick={openSellerChat}
              >
                <MessageCircle className="h-4 w-4" />
                {t("seller.write")}
              </button>
            )}
          </div>
        </div>
      )}

      {reportOpen &&
        createPortal(
          <>
            <button
              type="button"
              aria-label={t("common.close")}
              className="sheet-backdrop sheet-backdrop--top"
              onClick={() => setReportOpen(false)}
            />

            <div
              className="sheet sheet--top sheet--dialog"
              role="dialog"
              aria-modal="true"
              aria-label={t("report.title")}
            >
              <div className="sheet__handle sm:hidden" aria-hidden="true" />

              <div className="sheet__header">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink">{t("report.title")}</h3>
                  <p className="mt-1 text-sm text-ink-500">{t("report.subtitle")}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="btn-ghost p-2"
                  aria-label={t("common.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="sheet__body space-y-2 pb-3">
                {REPORT_REASONS.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                      reportReason === item.id
                        ? "border-sun bg-sun-50"
                        : "border-ink/10 hover:border-ink/25"
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
                    <span className="text-sm font-medium text-ink-800">
                      {item.label}
                    </span>
                  </label>
                ))}

                {reportReason === "other" && (
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={4}
                    placeholder={t("report.placeholder")}
                    className="input mt-2 w-full resize-y"
                  />
                )}
              </div>

              <div className="sheet__footer sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="btn btn-secondary rounded-xl"
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
          </>,
          document.body
        )}

      {confirmAction &&
        createPortal(
          <>
            <button
              type="button"
              aria-label={t("common.close")}
              className="sheet-backdrop sheet-backdrop--top"
              onClick={() => setConfirmAction(null)}
            />

            <div
              className="sheet sheet--top sheet--dialog sheet--dialog-sm"
              role="dialog"
              aria-modal="true"
            >
              <div className="sheet__handle sm:hidden" aria-hidden="true" />

              <div className="sheet__body !flex-none px-5 py-4">
                <p className="text-sm text-ink-800">
                  {confirmPrompts[confirmAction] || t("listing.confirmStatus")}
                </p>
              </div>

              <div className="sheet__footer sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="btn btn-secondary rounded-xl"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const action = confirmAction;
                    setConfirmAction(null);
                    updateListingStatus(action);
                  }}
                  className="btn btn-primary rounded-xl"
                >
                  {t("common.yes")}
                </button>
              </div>
            </div>
          </>,
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
