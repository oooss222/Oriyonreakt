import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Archive,
  CalendarClock,
  Check,
  Crown,
  FileText,
  RotateCcw,
  ListTree,
  MapPin,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Pencil,
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
import MortgageCalculator from "../components/MortgageCalculator";
import PriceAdequacyBadge from "../components/PriceAdequacyBadge";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import AdSlot from "../components/AdSlot";
import { PromotionBadgeGroup } from "../components/PromotionBadge";
import {
  Modal,
  Radio,
  useConfirm,
  Textarea,
  SectionCard,
  Alert,
  StatusBadge,
  Skeleton,
  SkeletonText,
  useToast,
} from "../ui";
import { CAT_LABELS } from "../data/listingCategories";
import { enrichRealEstateListing, getSpecValue, isRealEstateListing } from "../lib/realEstate";
import { REPORT_REASONS } from "../data/reportReasons";
import { useI18n } from "../i18n";
import { getUserFacingErrorMessage } from "../lib/apiError";
import { listingStatusLabel, listingStatusTone } from "../lib/messagesUtils";

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
    <div className="page-container py-6 space-y-6" aria-busy="true">
      <Skeleton className="h-4 w-64" />

      <div className="flex flex-col gap-6 xl:flex-row xl:gap-8">
        <div className="min-w-0 space-y-5 xl:flex-[7]">
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-20 rounded-xl" />
            ))}
          </div>
          <div className="card space-y-3 p-5">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <SkeletonText lines={4} />
          </div>
        </div>

        <div className="xl:flex-[5] xl:min-w-[320px]">
          <div className="card space-y-4 p-5">
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const { showToast } = useToast();
  const confirm = useConfirm();
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
  const [reportError, setReportError] = React.useState("");
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
        showToast(t("favorites.removed"), "success");
      } else {
        await api.addFavorite(token, adId);
        setIsFav(true);
        showToast(t("favorites.added"), "success");
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
      showToast(t("seller.unavailable"), "error");
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
    setReportError("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!token || !ad) {
      goToAuth(nav);
      return;
    }

    if (reportReason === "other" && reportDetails.trim().length < 5) {
      setReportError(t("report.describe"));
      return;
    }

    try {
      setReportSending(true);

      await api.reportListing(token, ad._id || ad.id, {
        reason: reportReason,
        details: reportDetails.trim(),
      });

      setReportOpen(false);
      showToast(t("report.sent"), "success");
    } catch (e) {
      const message = e.message || t("errors.sendReport");

      if (message.includes("already reported") || message.includes("409")) {
        showToast(t("errors.reportDuplicate"), "error");
        setReportOpen(false);
        return;
      }

      if (message.includes("Invalid token") || message.includes("401")) {
        goToAuth(nav);
        return;
      }

      setReportError(getUserFacingErrorMessage(e, t));
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

    const confirmed = await confirm({
      message: prompts[action] || t("listing.confirmStatus"),
      tone: action === "republish" ? "primary" : "danger",
    });

    if (!confirmed) return;

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
      showToast(
        action === "sold"
          ? t("listing.statusSold")
          : action === "archive"
          ? t("listing.statusArchived")
          : t("listing.statusRepublished"),
        "success"
      );
    } catch (e) {
      showToast(getUserFacingErrorMessage(e, t) || t("listing.statusUpdateFailed"), "error");
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
      showToast(t("listing.linkCopied"), "success");
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
      <div className="page-container py-12">
        <EmptyState
          icon={PackageSearch}
          title={t("errors.loadFailed")}
          description={t("seller.notFoundDesc")}
          actionLabel={t("empty.goCatalog")}
          actionTo="/listing"
          secondaryAction={
            <Link to="/" className="btn">
              {t("empty.goHome")}
            </Link>
          }
        />
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
    <div className="min-h-screen pb-16 lg:pb-10">
      <div className="page-container py-4">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="page-container pb-6">
        {(moderationStatus === "pending" || moderationStatus === "rejected") && (
          <Alert
            tone={moderationStatus === "rejected" ? "danger" : "warning"}
            className="mb-6"
          >
            {moderationStatus === "pending"
              ? isOwner
                ? t("listing.moderationPending")
                : t("listing.moderationReview")
              : isOwner
                ? `${t("listing.moderationRejected")}${ad.rejectionReason ? `: ${ad.rejectionReason}` : ""}`
                : t("listing.moderationRejected")}
          </Alert>
        )}

        {(isSold || isArchived) && (
          <Alert tone="info" icon={PackageSearch} className="mb-6">
            {isSold
              ? isOwner
                ? t("listing.soldOwner")
                : t("listing.soldOther")
              : t("listing.archived")}
          </Alert>
        )}

        <div className="flex flex-col xl:flex-row xl:items-stretch gap-6 xl:gap-8">
          {/* Left column */}
          <div className="xl:flex-[7] min-w-0 space-y-5">
            {/* Gallery */}
            <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xs">
              <div className="flex flex-col md:flex-row">
                {images.length > 1 && (
                  <div
                    ref={desktopThumbsRef}
                    className="hidden md:flex max-h-[520px] w-[88px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-ink-200 p-3 scrollbar-hide"
                  >
                    {thumbImages.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        data-active={activeImageIndex === index ? "true" : "false"}
                        onClick={() => setActiveImageIndex(index)}
                        aria-current={activeImageIndex === index}
                        aria-label={t("a11y.photoOf", {
                          index: index + 1,
                          total: thumbImages.length,
                        })}
                        className={`overflow-hidden rounded-lg border-2 transition ${
                          activeImageIndex === index
                            ? "border-sun-500"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-full bg-mist-100 object-cover"
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
                  role="group"
                  aria-roledescription={t("a11y.gallery")}
                  aria-label={t("a11y.photoOf", {
                    index: activeImageIndex + 1,
                    total: images.length,
                  })}
                  onTouchStart={onGalleryTouchStart}
                  onTouchEnd={onGalleryTouchEnd}
                  onKeyDown={(event) => {
                    if (images.length <= 1) return;
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      goPrev();
                    } else if (event.key === "ArrowRight") {
                      event.preventDefault();
                      goNext();
                    }
                  }}
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
                      className="aspect-[4/3] w-full bg-mist-100 object-contain"
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
                    <span
                      className="absolute bottom-3 right-3 z-10 rounded-full bg-ink-900/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                      aria-hidden
                    >
                      {activeImageIndex + 1} / {images.length}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900/65 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-ink-900/80"
                  >
                    <ZoomIn className="h-3.5 w-3.5" aria-hidden />
                    {t("listing.zoom")}
                  </button>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-95"
                        aria-label={t("a11y.photoPrev")}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-md backdrop-blur-sm transition hover:bg-white active:scale-95"
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
                  className="flex md:hidden gap-2 p-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory border-t border-ink-200"
                >
                  {thumbImages.map((src, index) => (
                    <button
                      key={`mob-${src}-${index}`}
                      type="button"
                      data-active={activeImageIndex === index ? "true" : "false"}
                      onClick={() => setActiveImageIndex(index)}
                      aria-current={activeImageIndex === index}
                      aria-label={t("a11y.photoOf", {
                        index: index + 1,
                        total: thumbImages.length,
                      })}
                      className={`shrink-0 snap-start overflow-hidden rounded-lg border-2 transition ${
                        activeImageIndex === index
                          ? "border-sun-500"
                          : "border-transparent opacity-80"
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-20 bg-mist-100 object-cover"
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

            <section className="card p-4 sm:p-5 xl:hidden">
              <AdListingHeader
                title={ad.title}
                publicId={publicId}
                location={ad.location || ad.city}
                published={published}
                views={ad.views}
              />
            </section>

            {!isOwner && (
              <section className="card p-4 sm:p-5 xl:hidden">
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
              <SectionCard title={t("listing.locationSection")} icon={MapPin}>
                <p className="text-sm leading-relaxed text-ink-700">
                  {[ad.location || t("location.dushanbe"), getSpecValue(ad.specs, "Район"), getSpecValue(ad.specs, "Адрес")]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </SectionCard>
            )}

            {isRealEstateListing(ad) &&
              (realEstateEnriched?.realEstateSummary?.deal === "Купить" ||
                getSpecValue(ad.specs, "Тип сделки") === "Купить") && (
              <MortgageCalculator price={ad.price} />
            )}

            {/* Specs */}
            {filteredSpecs.length > 0 && (
              <SectionCard title={t("form.specs")} icon={ListTree} bodyClassName="p-0">
                <dl className="divide-y divide-ink-200">
                  {filteredSpecs.map((spec, index) => (
                    <div
                      key={`${spec.name}-${index}`}
                      className="grid grid-cols-1 gap-0.5 px-4 py-3 text-sm sm:grid-cols-2 sm:gap-4 sm:px-5"
                    >
                      <dt className="text-ink-400">{spec.name}</dt>
                      <dd className="font-semibold text-ink-900 sm:text-right">
                        {String(spec.value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            )}

            <AdSlot
              placement="ad_details_mid"
              cat={ad.cat || ""}
              variant="native"
            />

            {/* Description */}
            <SectionCard title={t("listing.descriptionSection")} icon={FileText}>
              <p className="whitespace-pre-wrap break-anywhere leading-7 text-ink-700">
                {ad.description || t("listing.noDescription")}
              </p>
            </SectionCard>

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
              <section className="card space-y-4 p-5">
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

                {isOwner && (
                  <>
                    <div className="flex items-center justify-between gap-2 xl:border-b xl:border-ink-200 xl:pb-4">
                      <h2 className="text-base font-bold text-ink-900">
                        {t("listing.ownerPanel")}
                      </h2>
                      <StatusBadge
                        tone={listingStatusTone(moderationStatus)}
                        label={listingStatusLabel(moderationStatus, t)}
                      />
                    </div>

                    {ad.expiresAt && (
                      <Alert tone="warning" icon={CalendarClock}>
                        {t("listing.expiresOn", {
                          date: new Date(ad.expiresAt).toLocaleDateString("ru-RU"),
                        })}{" "}
                        <Link
                          to="/profile?tab=promote"
                          className="font-semibold underline"
                        >
                          {t("listing.connectPromotion")}
                        </Link>
                      </Alert>
                    )}

                    <Link
                      to={`/edit/${ad._id || ad.id}`}
                      className="btn btn-primary btn-block"
                    >
                      <Pencil className="h-[18px] w-[18px]" aria-hidden />
                      {t("listing.editForm")}
                    </Link>

                    {moderationStatus === "approved" && (
                      <Link
                        to={`/profile?tab=promote&listing=${listingId}`}
                        className="btn btn-block border-sun-200 bg-sun-50 text-sun-800 hover:bg-sun-100"
                      >
                        <Crown className="h-[18px] w-[18px]" aria-hidden />
                        {t("listing.promoteAction")}
                      </Link>
                    )}

                    {moderationStatus === "approved" && (
                      <div className="grid gap-2">
                        <button
                          type="button"
                          className="btn btn-block"
                          onClick={() => updateListingStatus("sold")}
                        >
                          <Check className="h-[18px] w-[18px]" aria-hidden />
                          {t("listing.markSold")}
                        </button>

                        <button
                          type="button"
                          className="btn btn-block"
                          onClick={() => updateListingStatus("archive")}
                        >
                          <Archive className="h-[18px] w-[18px]" aria-hidden />
                          {t("listing.unpublishAction")}
                        </button>
                      </div>
                    )}

                    {(isSold || isArchived) && (
                      <button
                        type="button"
                        className="btn btn-block border-success-200 bg-success-50 text-success-700 hover:bg-success-100"
                        onClick={() => updateListingStatus("republish")}
                      >
                        <RotateCcw className="h-[18px] w-[18px]" aria-hidden />
                        {t("listing.republishAction")}
                      </button>
                    )}

                    <Link to="/messages" className="btn btn-block">
                      <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
                      {t("listing.buyerMessages")}
                    </Link>
                  </>
                )}
              </section>
          </AdStickyAside>
        </div>
      </div>

      {!isOwner && canContact ? (
        <div
          className="fixed inset-x-0 border-t border-ink-200 bg-white/95 backdrop-blur-md lg:hidden"
          style={{
            zIndex: "var(--z-sticky-bar)",
            bottom: "var(--mobile-nav-height)",
          }}
        >
          <div className="page-container flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-extrabold leading-none tracking-tight text-ink-900">
                {price}
              </div>
              {realEstatePricePerSqm ? (
                <div className="mt-0.5 truncate text-2xs font-medium text-ink-400">
                  {realEstatePricePerSqm}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={openSellerChat}
              className="btn btn-icon shrink-0"
              aria-label={t("seller.writeSeller")}
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </button>

            {ad.phone ? (
              phoneVisible ? (
                <a href={`tel:${ad.phone}`} className="btn btn-primary shrink-0">
                  <Phone className="h-[18px] w-[18px]" aria-hidden />
                  {t("seller.call")}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={revealPhone}
                  className="btn btn-primary shrink-0"
                >
                  <Phone className="h-[18px] w-[18px]" aria-hidden />
                  {t("seller.showPhone")}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={openSellerChat}
                className="btn btn-primary shrink-0"
              >
                {t("seller.write")}
              </button>
            )}
          </div>
        </div>
      ) : null}

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t("report.title")}
        description={t("report.subtitle")}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="btn"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={reportSending}
              className="btn btn-primary"
            >
              {reportSending ? t("report.sending") : t("report.send")}
            </button>
          </div>
        }
      >
        <fieldset className="space-y-2">
          <legend className="field-label">{t("report.reasonLegend")}</legend>
          {REPORT_REASONS.map((item) => (
            <Radio
              key={item.id}
              name="report-reason"
              value={item.id}
              checked={reportReason === item.id}
              onChange={() => setReportReason(item.id)}
              label={item.label}
              boxed
            />
          ))}
        </fieldset>

        {reportReason === "other" && (
          <Textarea
            className="mt-3"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={4}
            placeholder={t("report.placeholder")}
            aria-label={t("report.placeholder")}
          />
        )}

        {reportError && (
          <Alert tone="danger" className="mt-3">
            {reportError}
          </Alert>
        )}
      </Modal>

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
