import React from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";
import { api, API_BASE } from "../lib/api";
import AdSlot from "../components/AdSlot";
import ListingCard from "../components/ListingCard";

const TOKEN_KEY = "auth_token";

const CAT_LABELS = {
  transport: "Авто",
  furniture: "Мебель",
  phones: "Телефоны",
  electronics: "Бытовая техника",
  computers: "Компьютеры",
  repair: "Ремонт",
};

function imageUrl(src) {
  if (!src) return "/img/placeholder.jpg";
  if (src.startsWith("http")) return src;

  const server = API_BASE.replace(/\/api$/, "");
  const clean = String(src).replace(/^\/+/, "");

  return `${server}/${clean}`;
}

function formatPrice(value) {
  if (value == null || value === "") return "Договорная";

  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));

  if (!Number.isFinite(n)) return String(value);

  return `${n.toLocaleString("ru-RU")} TJS`;
}

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
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [ad, setAd] = React.useState(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [related, setRelated] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isFav, setIsFav] = React.useState(false);
  const [phoneVisible, setPhoneVisible] = React.useState(false);
  const [messageOpen, setMessageOpen] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [messageSending, setMessageSending] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [copied, setCopied] = React.useState(false);
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

    async function loadAd() {
      try {
        setLoading(true);
        sessionStorage.removeItem("ad_preview");

        const data = await api.listingById(id);

        if (active) {
          setAd(data);
          setActiveImageIndex(0);
          setPhoneVisible(false);
          setMessageOpen(false);
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
      return ad.images.map((i) => imageUrl(i.url || i));
    }

    if (ad.img) return [imageUrl(ad.img)];

    return ["/img/placeholder.jpg"];
  }, [ad]);

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
      window.location.href = "/auth";
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

  const sendSellerMessage = async () => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    const text = messageText.trim();

    if (!text) {
      setToast("Введите сообщение");
      return;
    }

    try {
      setMessageSending(true);

      await api.sendMessage(
        token,
        ad._id || ad.id,
        text,
        ad.owner
      );

      setMessageText("");
      setMessageOpen(false);
      setToast("Сообщение отправлено");
    } catch (e) {
      const msg = e.message || "Не удалось отправить";

      if (msg.includes("Invalid token") || msg.includes("401")) {
        window.location.href = "/auth";
        return;
      }

      setToast(msg);
    } finally {
      setMessageSending(false);
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

  const price = formatPrice(ad.price);
  const sellerName = getSellerName(ad) || "Продавец";
  const publicId = ad.publicId || ad.public_id || ad._id || ad.id;
  const catLabel = CAT_LABELS[ad.cat] || ad.cat;
  const published = formatDate(ad.createdAt);
  const listingUrl = `/listing${ad.cat ? `?cat=${encodeURIComponent(ad.cat)}` : ""}${
    ad.subcategory
      ? `${ad.cat ? "&" : "?"}subcategory=${encodeURIComponent(ad.subcategory)}`
      : ""
  }`;

  const isOwner =
    currentUserId &&
    ad.owner &&
    String(currentUserId) === String(ad.owner);

  return (
    <div className="pb-28 xl:pb-10">
      <Toast message={toast} onClose={() => setToast("")} />

      {/* Breadcrumbs */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container-x py-3">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-blue-600 transition shrink-0">
              Главная
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />

            {ad.cat && (
              <>
                <Link
                  to={`/c/${ad.cat}`}
                  className="hover:text-blue-600 transition shrink-0"
                >
                  {catLabel}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </>
            )}

            {ad.subcategory && (
              <>
                <Link
                  to={listingUrl}
                  className="hover:text-blue-600 transition shrink-0"
                >
                  {ad.subcategory}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </>
            )}

            <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-xs">
              {ad.title || "Объявление"}
            </span>
          </nav>
        </div>
      </div>

      <div className="container-x py-6">
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

                  <div className="absolute top-3 left-3 flex gap-2">
                    {ad.vip && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white shadow">
                        VIP
                      </span>
                    )}
                    {ad.top && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-600 text-white shadow">
                        TOP
                      </span>
                    )}
                  </div>

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
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    {catLabel}
                    {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                  </Link>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {ad.title || "Без названия"}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {ad.location || ad.city || "Душанбе"}
                </span>
                {published && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {published}
                  </span>
                )}
              </div>

              <div className="text-2xl font-extrabold text-blue-700">{price}</div>
            </section>

            {/* Description */}
            <section className="card p-5 md:p-6 rounded-3xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Описание
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-7 text-[15px]">
                {ad.description || "Описание отсутствует."}
              </p>
            </section>

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
                    className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline shrink-0"
                  >
                    Все
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin">
                  {related.map((item) => (
                    <div
                      key={item._id || item.id}
                      className="min-w-[200px] sm:min-w-[230px] max-w-[230px] snap-start"
                    >
                      <ListingCard item={item} />
                    </div>
                  ))}
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
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                    >
                      {catLabel}
                      {ad.subcategory ? ` · ${ad.subcategory}` : ""}
                    </Link>
                  )}
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                  {ad.title || "Без названия"}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {ad.location || ad.city || "Душанбе"}
                  </span>
                  {published && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {published}
                    </span>
                  )}
                </div>
              </section>

              {/* Price & actions card */}
              <section className="card p-6 rounded-3xl space-y-5 shadow-md">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Цена</div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {price}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div className="text-sm text-slate-500">Продавец</div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {getInitials(sellerName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {sellerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {published ? `Объявление ${published.toLowerCase()}` : "На сайте"}
                      </div>
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
                  {ad.phone ? (
                    phoneVisible ? (
                      <a
                        href={`tel:${ad.phone}`}
                        className="btn btn-primary w-full py-3 text-base rounded-2xl"
                      >
                        <Phone className="w-5 h-5" />
                        {ad.phone}
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary w-full py-3 text-base rounded-2xl"
                        onClick={() => setPhoneVisible(true)}
                      >
                        <Phone className="w-5 h-5" />
                        Показать телефон
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      className="btn w-full py-3 rounded-2xl opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <Phone className="w-5 h-5" />
                      Телефон не указан
                    </button>
                  )}

                  {!isOwner ? (
                    <>
                      <button
                        type="button"
                        className="btn w-full py-3 rounded-2xl"
                        onClick={() => setMessageOpen((v) => !v)}
                      >
                        <MessageCircle className="w-5 h-5" />
                        Написать продавцу
                      </button>

                      {messageOpen && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 animate-fade-in-up">
                          <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            rows={4}
                            placeholder="Здравствуйте! Интересует ваше объявление..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white"
                          />
                          <button
                            type="button"
                            onClick={sendSellerMessage}
                            disabled={messageSending}
                            className="btn btn-primary w-full rounded-xl disabled:opacity-60"
                          >
                            {messageSending ? "Отправляем..." : "Отправить"}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/messages"
                      className="btn w-full py-3 rounded-2xl"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Сообщения покупателей
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
                </div>
              </section>

              <AdSlot placement="details_sidebar" type="sidebar" />
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

          {!isOwner && ad.phone ? (
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

          {!isOwner ? (
            <button
              type="button"
              className="btn shrink-0 rounded-2xl px-4"
              onClick={() => {
                setMessageOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          ) : (
            <Link to="/messages" className="btn shrink-0 rounded-2xl px-4">
              <MessageCircle className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

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
