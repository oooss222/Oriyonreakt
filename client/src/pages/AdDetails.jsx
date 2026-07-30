import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  MessageCircle,
  Heart,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Share2,
  Calendar,
  Tag,
  Check,
  ArrowRight,
  X,
  ZoomIn,
  Pencil,
  Eye,
  Flag,
  PackageSearch,
} from "lucide-react";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { resolveMediaUrl } from "../lib/media";
import { formatPrice, formatViewsLabel, getListingDisplayDate, formatMoney } from "../lib/format";
import { getPromotionPlan } from "../lib/promotionPlans";
import { markListingViewed, markViewRecorded, wasViewRecorded } from "../lib/viewedListings";
import { usePageMeta } from "../lib/usePageMeta";
import ListingCard from "../components/ListingCard";
import RealEstateHighlights from "../components/RealEstateHighlights";
import RealEstateListingCard from "../components/RealEstateListingCard";
import Breadcrumbs from "../components/Breadcrumbs";
import EmptyState from "../components/EmptyState";
import ListingPromotionActions from "../components/ListingPromotionActions";
import SellerContactButtons from "../components/SellerContactButtons";
import SellerReviewsPanel, { StarRating } from "../components/SellerReviewsPanel";
import AdSlot from "../components/AdSlot";
import { PromotionBadgeGroup } from "../components/PromotionBadge";
import BusinessBadge from "../components/BusinessBadge";
import { CAT_LABELS } from "../data/listingCategories";
import { enrichRealEstateListing, getSpecValue, isRealEstateListing } from "../lib/realEstate";
import { REPORT_REASONS } from "../data/reportReasons";

const TOKEN_KEY = "auth_token";

function formatDate(dateStr) {
  if (!dateStr || Number.isNaN(Date.parse(dateStr))) return null;

  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "П";

  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
    <div className="fixed bottom-24 xl:bottom-8 left-1/2 -translate-x-1/2 z-[110] animate-fade-in-up">
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
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [ad, setAd] = React.useState(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [related, setRelated] = React.useState([]);
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
  const [promotionPrices, setPromotionPrices] = React.useState({
    vipPrice: 25,
    topPrice: 15,
    bumpPrice: 5,
  });
  const [promotingType, setPromotingType] = React.useState(null);
  const [walletBalance, setWalletBalance] = React.useState(0);
  const [sellerReviews, setSellerReviews] = React.useState({
    summary: { average: 0, count: 0 },
    items: [],
  });

  React.useEffect(() => {
    api
      .siteSettings()
      .then((settings) => {
        if (!settings) return;

        setPromotionPrices({
          vipPrice: settings.vipPrice ?? 25,
          topPrice: settings.topPrice ?? 15,
          bumpPrice: settings.bumpPrice ?? 5,
        });
      })
      .catch(() => {});
  }, []);

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
          setWalletBalance(Number(user?.walletBalance || 0));
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
    if (!ad) return;

    let active = true;

    async function loadRelated() {
      try {
        const data = await api.listings({
          cat: ad.cat || undefined,
          subcategory: ad.subcategory || undefined,
          limit: 12,
        });

        const currentId = String(ad._id || ad.id);

        const list = Array.isArray(data)
          ? data.filter((item) => String(item._id || item.id) !== currentId)
          : [];

        if (active) setRelated(list.slice(0, 10));
      } catch {
        if (active) setRelated([]);
      }
    }

    loadRelated();
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

  const images = React.useMemo(() => {
    if (!ad) return ["/img/placeholder.jpg"];

    if (ad.images?.length) {
      return ad.images.map((i) => resolveMediaUrl(i.url || i));
    }

    if (ad.img) return [resolveMediaUrl(ad.img)];

    return ["/img/placeholder.jpg"];
  }, [ad]);

  usePageMeta({
    enabled: Boolean(ad),
    title: ad?.title || "Объявление",
    description: [
      formatPrice(ad?.price, { emptyLabel: "Договорная" }),
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
          name: ad.title || "Объявление",
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
    if (!lightboxOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);

      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) =>
          prev === 0 ? images.length - 1 : prev - 1
        );
      }

      if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) =>
          prev === images.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, images.length]);

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
        setToast("Убрано из избранного");
      } else {
        await api.addFavorite(token, adId);
        setIsFav(true);
        setToast("Добавлено в избранное");
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
      setToast("Продавец недоступен");
      return;
    }

    const listingId = ad._id || ad.id;

    nav(
      `/messages?listingId=${listingId}&peerId=${ad.owner}&title=${encodeURIComponent(ad.title || "Объявление")}`
    );
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
      setToast("Опишите проблему подробнее");
      return;
    }

    try {
      setReportSending(true);

      await api.reportListing(token, ad._id || ad.id, {
        reason: reportReason,
        details: reportDetails.trim(),
      });

      setReportOpen(false);
      setToast("Жалоба отправлена. Спасибо!");
    } catch (e) {
      const message = e.message || "Не удалось отправить жалобу";

      if (message.includes("already reported") || message.includes("409")) {
        setToast("Вы уже жаловались на это объявление");
        setReportOpen(false);
        return;
      }

      if (message.includes("Invalid token") || message.includes("401")) {
        goToAuth(nav);
        return;
      }

      setToast(message);
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
      sold: "Отметить объявление как проданное?",
      archive: "Снять объявление с публикации?",
      republish: "Опубликовать объявление снова?",
    };

    if (!confirm(prompts[action] || "Изменить статус объявления?")) {
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
          ? "Объявление отмечено как проданное"
          : action === "archive"
          ? "Объявление снято с публикации"
          : "Объявление снова опубликовано"
      );
    } catch (e) {
      setToast(e.message || "Не удалось обновить статус");
    }
  };

  const promoteListing = async (type, days) => {
    if (!token || !ad) {
      goToAuth(nav);
      return;
    }

    if (type === "bump") {
      const price = Number(promotionPrices.bumpPrice || 0);
      const priceLabel = price <= 0 ? "бесплатно" : formatMoney(price);
      const confirmText =
        price <= 0
          ? "Обновить дату объявления бесплатно?"
          : `Обновить дату объявления за ${priceLabel}?`;

      if (!confirm(confirmText)) {
        return;
      }
    } else {
      const plan = getPromotionPlan(type, days);

      if (!plan) {
        setToast("Выберите срок продвижения");
        return;
      }
    }

    const listingId = ad._id || ad.id;

    try {
      setPromotingType(type);

      const updated = await api.promoteListing(
        token,
        listingId,
        type,
        type === "bump" ? undefined : days
      );
      setAd((current) => ({ ...current, ...updated }));

      const user = await api.me(token);

      if (user) {
        setWalletBalance(Number(user.walletBalance || 0));
      }

      setToast(
        type === "vip"
          ? "VIP продвижение активировано"
          : type === "top"
          ? "TOP продвижение активировано"
          : "Дата объявления обновлена"
      );
    } catch (e) {
      const message = e?.message || "";

      if (
        message.includes("Insufficient balance") ||
        message.includes("402")
      ) {
        if (
          confirm(
            "Недостаточно средств на кошельке. Перейти к пополнению?"
          )
        ) {
          nav("/profile?tab=wallet");
        }

        return;
      }

      setToast(message || "Не удалось подключить продвижение");
    } finally {
      setPromotingType(null);
    }
  };

  const shareAd = async () => {
    const url = window.location.href;
    const title = ad?.title || "Объявление";

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      setToast("Ссылка скопирована");
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

  if (loading) return <PageSkeleton />;

  if (!ad) {
    return (
      <div className="container-x py-16">
        <div className="max-w-md mx-auto text-center space-y-5 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 grid place-items-center text-4xl">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Объявление не найдено
          </h1>
          <p className="text-slate-500">
            Возможно, оно было удалено или ссылка устарела.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/listing" className="btn">
              К каталогу
            </Link>
            <Link to="/" className="btn btn-primary">
              На главную
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

  const price = formatPrice(ad.price, { emptyLabel: "Договорная" });
  const realEstateEnriched = isRealEstateListing(ad)
    ? enrichRealEstateListing(ad)
    : null;
  const realEstatePricePerSqm =
    realEstateEnriched?.realEstateSummary?.pricePerSqm || "";
  const sellerName = getSellerName(ad) || "Продавец";
  const publicId = ad.publicId || ad.public_id || ad._id || ad.id;
  const listingId = ad._id || ad.id;
  const catLabel = CAT_LABELS[ad.cat] || ad.cat;
  const published = formatDate(getListingDisplayDate(ad) || ad.createdAt);
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
          title="Объявление снято с публикации"
          description="Продавец временно убрал это объявление из каталога."
          actionLabel="К каталогу"
          onAction={() => nav("/listing")}
        />
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Главная", to: "/" },
    ...(ad.cat
      ? [{ label: catLabel, to: `/c/${ad.cat}` }]
      : []),
    ...(ad.subcategory
      ? [{ label: ad.subcategory, to: listingUrl }]
      : []),
    { label: ad.title || "Объявление" },
  ];

  return (
    <div className="pb-28 xl:pb-10">
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container-x py-3 overflow-x-auto">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <div className="container-x py-6">
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
                  ? "Объявление на модерации. Оно появится в каталоге после одобрения."
                  : "Объявление проходит модерацию."}
              </p>
            ) : (
              <p>
                {isOwner
                  ? `Объявление отклонено${ad.rejectionReason ? `: ${ad.rejectionReason}` : "."} Вы можете отредактировать и отправить снова.`
                  : "Объявление отклонено модератором."}
              </p>
            )}
          </div>
        )}

        {(isSold || isArchived) && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
            {isSold
              ? isOwner
                ? "Вы отметили это объявление как проданное. Оно больше не показывается в каталоге."
                : "Это объявление уже продано."
              : "Объявление снято с публикации и скрыто из каталога."}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
          {/* Left column */}
          <div className="xl:col-span-7 space-y-5 animate-fade-in-up">
            {/* Gallery */}
            <section className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row">
                {images.length > 1 && (
                  <div className="hidden md:flex flex-col gap-2 p-3 w-24 shrink-0 border-r border-slate-100 max-h-[520px] overflow-y-auto">
                    {images.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`rounded-xl overflow-hidden border-2 transition-all ${
                          activeImageIndex === index
                            ? "border-blue-600 ring-2 ring-blue-100"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
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

                <div className="relative flex-1 group">
                  <button
                    type="button"
                    className="w-full block cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                    aria-label="Открыть фото в полном размере"
                  >
                    <img
                      src={images[activeImageIndex] || images[0]}
                      alt={ad.title || "Фото объявления"}
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
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                      {activeImageIndex + 1} / {images.length}
                    </div>
                  )}

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs">
                      <ZoomIn className="w-3.5 h-3.5" />
                      Увеличить
                    </span>
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                        aria-label="Предыдущее фото"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                        aria-label="Следующее фото"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex md:hidden gap-2 p-3 overflow-x-auto border-t border-slate-100">
                  {images.map((src, index) => (
                    <button
                      key={`mob-${src}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`shrink-0 rounded-xl overflow-hidden border-2 ${
                        activeImageIndex === index
                          ? "border-blue-600"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
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

            {/* Title & meta — visible on mobile, hidden price duplicate handled in sidebar */}
            <section className="xl:hidden space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  <Tag className="w-3 h-3" />
                  №{publicId}
                </span>
                {ad.cat && (
                  <Link
                    to={listingUrl}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sun-50 text-sun-700 hover:bg-sun-100 transition"
                  >
                    {catLabel}
                    {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                  </Link>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {ad.title || "Без названия"}
              </h1>

              {(ad.vip || ad.top) && (
                <PromotionBadgeGroup vip={ad.vip} top={ad.top} size="md" />
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-sun" />
                  {ad.location || ad.city || "Душанбе"}
                </span>
                {published && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {published}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatViewsLabel(ad.views)}
                </span>
              </div>

              <div className="text-2xl text-price">{price}</div>
            </section>

            {isRealEstateListing(ad) && <RealEstateHighlights ad={ad} />}

            {isRealEstateListing(ad) && (
              <div className="space-y-3">
                <PriceAdequacyBadge item={ad} />
                <CompareListingButton listingId={ad.id || ad._id} />
              </div>
            )}

            {isRealEstateListing(ad) && (
              <section className="card p-5 md:p-6 rounded-3xl space-y-2">
                <h2 className="text-lg font-bold text-slate-900">Расположение</h2>
                <p className="text-slate-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sun shrink-0 mt-1" />
                  <span>
                    {[ad.location || "Душанбе", getSpecValue(ad.specs, "Район"), getSpecValue(ad.specs, "Адрес")]
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

            {/* Description */}
            <section className="card p-5 md:p-6 rounded-3xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Описание
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-7 text-[15px]">
                {ad.description || "Описание отсутствует."}
              </p>
            </section>

            <AdSlot
              placement="ad_details_mid"
              cat={ad.cat || ""}
              variant="native"
            />

            {/* Specs */}
            {filteredSpecs.length > 0 && (
              <section className="card p-5 md:p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Характеристики
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                  {filteredSpecs.map((spec, index) => (
                    <div
                      key={`${spec.name}-${index}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-white px-4 py-3 text-sm"
                    >
                      <span className="text-slate-500">{spec.name}</span>
                      <span className="font-semibold text-slate-800 sm:text-right">
                        {String(spec.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {ad.owner && (
              <SellerReviewsPanel
                sellerId={ad.owner}
                listingId={listingId}
                token={token}
                canReview={canContact && Boolean(token)}
                summary={sellerReviews.summary}
                items={sellerReviews.items}
                onSubmitted={(result) => {
                  setSellerReviews({
                    summary: result.summary || sellerReviews.summary,
                    items: result.review
                      ? [result.review, ...sellerReviews.items]
                      : sellerReviews.items,
                  });
                }}
              />
            )}

            {/* Related */}
            {related.length > 0 && (
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Похожие объявления
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Из категории «{catLabel}»
                    </p>
                  </div>
                  <Link
                    to={listingUrl}
                    className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-sun hover:underline shrink-0"
                  >
                    Все
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {related.map((item) =>
                    isRealEstateListing(item) ? (
                      <RealEstateListingCard
                        key={item._id || item.id}
                        item={item}
                      />
                    ) : (
                      <ListingCard key={item._id || item.id} item={item} />
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="xl:col-span-5 space-y-4 animate-fade-in-up">
            <div className="xl:sticky xl:top-[72px] space-y-4">
              {/* Desktop title block */}
              <section className="hidden xl:block card p-6 rounded-3xl space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    <Tag className="w-3 h-3" />
                    №{publicId}
                  </span>
                  {ad.cat && (
                    <Link
                      to={listingUrl}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-sun-50 text-sun-700 hover:bg-sun-100 transition"
                    >
                      {catLabel}
                      {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                    </Link>
                  )}
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                  {ad.title || "Без названия"}
                </h1>

                {(ad.vip || ad.top) && (
                  <PromotionBadgeGroup vip={ad.vip} top={ad.top} size="md" />
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-sun" />
                    {ad.location || ad.city || "Душанбе"}
                  </span>
                  {published && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {published}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatViewsLabel(ad.views)}
                  </span>
                </div>
              </section>

              {/* Price & actions card */}
              <section className="card p-6 rounded-3xl space-y-5 shadow-md">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Цена</div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {price}
                  </div>
                  {realEstatePricePerSqm && (
                      <div className="text-sm font-semibold text-sun-700 mt-1">
                        {realEstatePricePerSqm}
                      </div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div className="text-sm text-slate-500">Продавец</div>

                  <div className="flex items-center gap-3">
                    {ad.owner ? (
                      <Link
                        to={`/seller/${ad.owner}`}
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sun to-lagoon flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 hover:opacity-90 transition overflow-hidden"
                      >
                        {ad.ownerCompanyLogo ? (
                          <img
                            src={ad.ownerCompanyLogo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(sellerName)
                        )}
                      </Link>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sun to-lagoon flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {getInitials(sellerName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      {ad.owner ? (
                        <Link
                          to={`/seller/${ad.owner}`}
                          className="font-bold text-slate-900 truncate block hover:text-sun transition"
                        >
                          {sellerName}
                        </Link>
                      ) : (
                        <div className="font-bold text-slate-900 truncate">
                          {sellerName}
                        </div>
                      )}
                      <div className="mt-1">
                        <BusinessBadge
                          sellerType={ad.ownerSellerType}
                          businessVerified={ad.ownerBusinessVerified}
                          size="lg"
                        />
                      </div>
                      <div className="text-xs text-slate-500">
                        {published ? `Объявление ${published.toLowerCase()}` : "На сайте"}
                      </div>
                      {sellerReviews.summary.count > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating value={sellerReviews.summary.average} size={14} />
                          <span className="text-xs text-slate-500">
                            {Number(sellerReviews.summary.average).toFixed(1)} (
                            {sellerReviews.summary.count})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      Встречайтесь лично и проверяйте товар перед оплатой
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {canContact ? (
                    <SellerContactButtons
                      phone={ad.phone}
                      whatsapp={ad.sellerWhatsapp}
                      telegram={ad.sellerTelegram}
                      phoneVisible={phoneVisible}
                      onRevealPhone={() => setPhoneVisible(true)}
                      onChat={openSellerChat}
                      canContact={canContact}
                    />
                  ) : !isOwner && isInactive ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Связаться с продавцом по этому объявлению нельзя.
                    </div>
                  ) : null}
                </div>

                {isOwner && ad.expiresAt && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Объявление активно до{" "}
                    {new Date(ad.expiresAt).toLocaleDateString("ru-RU")}. После этой
                    даты оно будет автоматически снято — опубликуйте снова или
                    подключите VIP/TOP.
                  </div>
                )}

                <AdSlot
                  placement="ad_sidebar"
                  cat={ad.cat || ""}
                  variant="native"
                  className="hidden xl:block"
                />

                {isOwner ? (
                    <>
                      {moderationStatus === "approved" && (
                        <ListingPromotionActions
                          listing={ad}
                          bumpPrice={promotionPrices.bumpPrice}
                          walletBalance={walletBalance}
                          promoting={
                            promotingType
                              ? `${listingId}-${promotingType}`
                              : null
                          }
                          onPromote={promoteListing}
                        />
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
                      Редактировать объявление
                    </Link>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`btn py-2.5 rounded-2xl ${
                        isFav ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : ""
                      }`}
                      onClick={toggleFav}
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? "fill-current" : ""}`}
                      />
                      {isFav ? "В избранном" : "В избранное"}
                    </button>

                    <button
                      type="button"
                      className="btn py-2.5 rounded-2xl"
                      onClick={shareAd}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                      Поделиться
                    </button>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      className="btn w-full py-2.5 rounded-2xl text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                      onClick={openReport}
                    >
                      <Flag className="w-4 h-4" />
                      Пожаловаться
                    </button>
                  )}
              </section>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 xl:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 safe-area-pb">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">Цена</div>
            <div className="font-extrabold text-lg text-slate-900 truncate">
              {price}
            </div>
          </div>

          {canContact && ad.phone ? (
            phoneVisible ? (
              <a
                href={`tel:${ad.phone}`}
                className="btn btn-primary shrink-0 rounded-2xl px-5"
              >
                <Phone className="w-4 h-4" />
                Звонок
              </a>
            ) : (
              <button
                type="button"
                className="btn btn-primary shrink-0 rounded-2xl px-5"
                onClick={() => setPhoneVisible(true)}
              >
                <Phone className="w-4 h-4" />
                Позвонить
              </button>
            )
          ) : null}

          {canContact ? (
            <button
              type="button"
              className="btn shrink-0 rounded-2xl px-4"
              onClick={openSellerChat}
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          ) : isOwner ? (
            <Link to="/messages" className="btn shrink-0 rounded-2xl px-4">
              <MessageCircle className="w-4 h-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-xl border p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Пожаловаться</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Расскажите, что не так с этим объявлением.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="p-2 rounded-xl border hover:bg-slate-50"
                aria-label="Закрыть"
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
                placeholder="Опишите проблему..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sun/40 resize-y"
              />
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="btn rounded-xl"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={submitReport}
                disabled={reportSending}
                className="btn btn-primary rounded-xl disabled:opacity-60"
              >
                {reportSending ? "Отправляем..." : "Отправить жалобу"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                aria-label="Предыдущее"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                aria-label="Следующее"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
                {activeImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          <img
            src={images[activeImageIndex] || images[0]}
            alt={ad.title || "Фото объявления"}
            className="max-w-[95vw] max-h-[90vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
