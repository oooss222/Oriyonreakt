import React from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

const VIEWER_KEY = "diyor_ad_viewer";

const SLOT_RATIO = {
  home_top: ["970 / 250", "320 / 100"],
  category_top: ["970 / 250", "320 / 100"],
  search_top: ["970 / 120", "320 / 100"],
  sidebar: ["300 / 600", "300 / 250"],
  listing_detail: ["728 / 90", "320 / 100"],
  mobile_sticky_bottom: ["320 / 50", "320 / 50"],
  post_success: ["728 / 90", "320 / 100"],
  home_mid: ["970 / 120", "320 / 100"],
  listing_top: ["970 / 120", "320 / 100"],
  footer: ["970 / 90", "320 / 100"],
  ad_sidebar: ["300 / 250", "300 / 250"],
};

function viewerId() {
  try {
    const current = localStorage.getItem(VIEWER_KEY);

    if (current) return current;

    const next = window.crypto?.randomUUID?.() || `web-${Date.now()}`;
    localStorage.setItem(VIEWER_KEY, next);
    return next;
  } catch {
    return "";
  }
}

function deviceKind() {
  if (typeof window === "undefined") return "desktop";

  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) {
    return { items: payload, interval: 8 };
  }

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    interval: Number(payload?.interval) || 8,
  };
}

export function clickHref(ad) {
  if (!ad) return "";

  const base = ad.clickPath || "";

  if (!base) return ad.linkUrl || "";

  const url = new URL(base, window.location.origin);
  const viewer = viewerId();

  if (viewer) url.searchParams.set("viewer", viewer);
  url.searchParams.set("platform", "web");

  return `${url.pathname}${url.search}`;
}

function trackImpression(ad, placement) {
  const campaignId = ad?.campaignId || ad?.id;

  if (!campaignId) return;

  api
    .trackAdImpression({
      campaignId,
      creativeId: ad.creativeId || "",
      placement,
      platform: "web",
      viewer: viewerId(),
    })
    .catch(() => {});
}

function AdLabel() {
  const { t } = useI18n();

  return (
    <span className="inline-flex items-center rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      {t("ads.label")}
    </span>
  );
}

function BannerAd({ ad, className = "" }) {
  const { t } = useI18n();
  const content = ad.imageUrl ? (
    <img
      src={ad.imageUrl}
      alt={ad.headline || ad.title || t("ads.label")}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className="flex h-full items-center justify-center bg-[#1f6f6a] px-4 text-center text-sm font-semibold text-white">
      {ad.headline || ad.title || t("ads.bannerFallback")}
    </div>
  );

  const frame = (
    <div className={`relative h-full overflow-hidden bg-mist-100 ${className}`}>
      <span className="absolute left-2 top-2 z-[1]">
        <AdLabel />
      </span>
      {content}
    </div>
  );

  if (!ad.linkUrl && !ad.clickPath) return frame;

  return (
    <a
      href={clickHref(ad)}
      target="_blank"
      rel="sponsored noopener"
      className="block h-full"
    >
      {frame}
    </a>
  );
}

function NativeAd({ ad, className = "", compact = false }) {
  const { t } = useI18n();
  const body = (
    <div className={`rounded-2xl border border-mist-200 bg-white p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <AdLabel />
        {ad.advertiser ? (
          <span className="truncate text-xs text-ink-400">{ad.advertiser}</span>
        ) : null}
      </div>
      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt=""
          className={`mb-3 w-full rounded-xl object-cover bg-mist-100 ${compact ? "h-28" : "h-36"}`}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="font-semibold text-ink">{ad.headline || ad.title || t("ads.nativeFallback")}</div>
      {ad.description ? (
        <p className="mt-1 line-clamp-3 text-sm text-ink-500">{ad.description}</p>
      ) : null}
      {ad.linkUrl ? (
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sun-700">
          {t("ads.readMore")}
          <ExternalLink size={14} />
        </div>
      ) : null}
    </div>
  );

  if (!ad.linkUrl && !ad.clickPath) return body;

  return (
    <a href={clickHref(ad)} target="_blank" rel="sponsored noopener" className="block">
      {body}
    </a>
  );
}

function HtmlAd({ ad, className = "" }) {
  if (!ad.htmlCode) return <BannerAd ad={ad} className={className} />;

  return (
    <div className={`overflow-hidden rounded-2xl border border-mist-200 bg-white p-2 ${className}`}>
      <div className="mb-2 px-1">
        <AdLabel />
      </div>
      <div className="ad-html-slot" dangerouslySetInnerHTML={{ __html: ad.htmlCode }} />
    </div>
  );
}

export function AdCreative({ ad, variant = "banner", className = "", compact = false }) {
  if (!ad) return null;

  if (ad.format === "html" || ad.format === "network") {
    return <HtmlAd ad={ad} className={className} />;
  }

  if (ad.format === "native" || variant === "native" || variant === "feed") {
    return <NativeAd ad={ad} className={className} compact={compact || variant === "feed"} />;
  }

  return <BannerAd ad={ad} className={className} />;
}

export function useAdCreatives(placement, catOrOptions = "") {
  const options = typeof catOrOptions === "string" ? { cat: catOrOptions } : catOrOptions || {};
  const { lang } = useI18n();
  const [state, setState] = React.useState({ items: [], interval: 8, ready: false });
  const [visible, setVisible] = React.useState(Boolean(options.eager));
  const sentinelRef = React.useRef(null);

  React.useEffect(() => {
    if (options.eager) {
      setVisible(true);
      return undefined;
    }

    const node = sentinelRef.current;

    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [options.eager, placement]);

  React.useEffect(() => {
    if (!visible) return undefined;

    let active = true;

    api
      .ads({
        placement,
        cat: options.cat || "",
        city: options.city || "",
        q: options.q || "",
        platform: "web",
        device: deviceKind(),
        lang,
        viewer: viewerId(),
      })
      .then((payload) => {
        if (!active) return;
        setState({ ...normalizePayload(payload), ready: true });
      })
      .catch(() => {
        if (active) setState({ items: [], interval: 8, ready: true });
      });

    return () => {
      active = false;
    };
  }, [visible, placement, options.cat, options.city, options.q, lang]);

  return { ...state, sentinelRef };
}

export function useAdPlacement(placement, cat = "") {
  const data = useAdCreatives(placement, { cat, eager: true });

  return data.items[0] || null;
}

function useAdImpressionTracker(ad, placement) {
  const rootRef = React.useRef(null);
  const trackedRef = React.useRef("");

  React.useEffect(() => {
    const node = rootRef.current;
    const key = ad?.creativeId || ad?.id;

    if (!node || !key) return undefined;

    let timer = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.intersectionRatio >= 0.5);

        if (visible && trackedRef.current !== key && !timer) {
          timer = window.setTimeout(() => {
            trackedRef.current = key;
            trackImpression(ad, placement);
          }, 1000);
        }

        if (!visible && timer) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [ad, placement]);

  return rootRef;
}

function slotStyle(placement) {
  const pair = SLOT_RATIO[placement];

  if (!pair) return undefined;

  const mobile = deviceKind() === "mobile";

  return { aspectRatio: mobile ? pair[1] : pair[0] };
}

export default function AdSlot({
  placement,
  cat = "",
  city = "",
  q = "",
  variant = "banner",
  className = "",
  compact = false,
  eager = false,
}) {
  const data = useAdCreatives(placement, { cat, city, q, eager });
  const [index, setIndex] = React.useState(0);
  const ad = data.items[index] || data.items[0] || null;
  const rootRef = useAdImpressionTracker(ad, placement);

  React.useEffect(() => {
    if (data.items.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % data.items.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [data.items.length]);

  if (!data.ready || !data.items.length) {
    return <div ref={data.sentinelRef} className="h-0 overflow-hidden" aria-hidden="true" />;
  }

  return (
    <div ref={rootRef} className={className} style={slotStyle(placement)}>
      <AdCreative ad={ad} variant={variant} className="h-full" compact={compact} />
      {data.items.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5">
          {data.items.map((item, itemIndex) => (
            <button
              key={item.id || itemIndex}
              type="button"
              aria-label={`${itemIndex + 1}`}
              onClick={() => setIndex(itemIndex)}
              className={`h-1.5 w-1.5 rounded-full ${itemIndex === index ? "bg-ink" : "bg-ink/20"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdFeedCard({ ad, className = "" }) {
  const rootRef = useAdImpressionTracker(ad, "feed_native");

  if (!ad) return null;

  return (
    <div ref={rootRef} className={className}>
      <AdCreative ad={ad} variant="feed" compact />
    </div>
  );
}

export function feedIntervalFrom(payload, fallback = 8) {
  return Number(payload?.interval) || fallback;
}
