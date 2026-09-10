import React from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

function trackAd(id, type) {
  if (!id) return;

  api.trackAd(id, type).catch(() => {});
}

/**
 * Paid placements have to disclose themselves, so the label is always rendered
 * and never collapses. Over a creative it needs its own backdrop to stay
 * legible whatever the artwork behind it looks like.
 */
function AdLabel({ onMedia = false }) {
  const { t } = useI18n();

  return (
    <span
      className={`badge badge-neutral uppercase tracking-wide ${
        onMedia ? "border-white/70 bg-white/95 text-ink-700 backdrop-blur-sm" : ""
      }`}
    >
      {t("ads.label")}
    </span>
  );
}

function BannerAd({ ad, className = "" }) {
  const { t } = useI18n();
  const headline = ad.headline || ad.title || "";

  const content = (
    <div className="relative">
      {ad.imageUrl ? (
        // Fixed ratio box: the creative streams in without shifting the page.
        <div className="aspect-[3/1] w-full overflow-hidden bg-mist-100 sm:aspect-[5/1] lg:aspect-[8/1]">
          <img
            src={ad.imageUrl}
            alt={headline || t("ads.imageAlt")}
            width={1200}
            height={150}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex min-h-[5.625rem] items-center justify-center bg-mist-50 px-4 py-6 text-center text-sm font-medium text-ink-500">
          {headline || t("ads.blockFallback")}
        </div>
      )}

      <span className="pointer-events-none absolute left-2 top-2">
        <AdLabel onMedia={Boolean(ad.imageUrl)} />
      </span>
    </div>
  );

  if (!ad.linkUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-ink-200 bg-white ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackAd(ad.id, "click")}
      className={`block overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-500 focus-visible:ring-offset-2 ${className}`}
    >
      {content}
    </a>
  );
}

function NativeAd({ ad, className = "", compact = false }) {
  const { t } = useI18n();
  const headline = ad.headline || ad.title || t("ads.offerFallback");

  const body = (
    // A tinted surface separates the placement from the white organic cards
    // around it without dressing it up as one of them.
    <div
      className={`rounded-2xl border border-ink-200 bg-mist-50 p-3 ${
        ad.linkUrl ? "transition-shadow duration-200 hover:shadow-md" : ""
      } ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <AdLabel />
        {ad.advertiser ? (
          <span className="truncate text-xs text-ink-400">{ad.advertiser}</span>
        ) : null}
      </div>

      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.headline || ad.title || t("ads.imageAlt")}
          width={640}
          height={compact ? 224 : 288}
          loading="lazy"
          decoding="async"
          className={`mb-3 w-full rounded-xl bg-mist-200 object-cover ${
            compact ? "h-28" : "h-36"
          }`}
        />
      ) : null}

      <div className="space-y-1">
        <div className={`font-semibold text-ink-900 ${compact ? "text-sm" : "text-base"}`}>
          {headline}
        </div>
        {ad.description ? (
          <p className={`text-ink-500 ${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}>
            {ad.description}
          </p>
        ) : null}
      </div>

      {ad.linkUrl ? (
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sun-700">
          {t("ads.more")}
          <ExternalLink size={14} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );

  if (!ad.linkUrl) {
    return body;
  }

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackAd(ad.id, "click")}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-500 focus-visible:ring-offset-2"
    >
      {body}
    </a>
  );
}

function HtmlAd({ ad, className = "" }) {
  if (!ad.htmlCode) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-ink-200 bg-white p-2 ${className}`}>
      <div className="mb-2 px-1">
        <AdLabel />
      </div>
      <div
        className="ad-html-slot"
        dangerouslySetInnerHTML={{ __html: ad.htmlCode }}
      />
    </div>
  );
}

export function AdCreative({ ad, variant = "banner", className = "", compact = false }) {
  if (!ad) {
    return null;
  }

  if (ad.format === "html") {
    return <HtmlAd ad={ad} className={className} />;
  }

  if (ad.format === "native" || variant === "native" || variant === "feed") {
    return <NativeAd ad={ad} className={className} compact={compact || variant === "feed"} />;
  }

  return <BannerAd ad={ad} className={className} />;
}

export function useAdPlacement(placement, cat = "") {
  const [ad, setAd] = React.useState(null);

  React.useEffect(() => {
    let active = true;

    api
      .ads({ placement, cat })
      .then((items) => {
        if (!active) return;

        const list = Array.isArray(items) ? items : [];

        if (!list.length) {
          setAd(null);
          return;
        }

        const index = Math.floor(Math.random() * list.length);
        setAd(list[index] || null);
      })
      .catch(() => {
        if (active) {
          setAd(null);
        }
      });

    return () => {
      active = false;
    };
  }, [placement, cat]);

  return ad;
}

function useAdImpressionTracker(ad) {
  const rootRef = React.useRef(null);
  const trackedRef = React.useRef(false);

  React.useEffect(() => {
    if (!ad?.id || !rootRef.current) {
      return undefined;
    }

    const node = rootRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);

        if (visible && !trackedRef.current) {
          trackedRef.current = true;
          trackAd(ad.id, "impression");
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [ad?.id]);

  return rootRef;
}

export default function AdSlot({
  placement,
  cat = "",
  variant = "banner",
  className = "",
  compact = false,
}) {
  const ad = useAdPlacement(placement, cat);
  const rootRef = useAdImpressionTracker(ad);

  if (!ad) {
    return null;
  }

  return (
    <div ref={rootRef} className={className}>
      <AdCreative ad={ad} variant={variant} compact={compact} />
    </div>
  );
}

export function AdFeedCard({ ad, className = "" }) {
  const rootRef = useAdImpressionTracker(ad);

  if (!ad) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className={`col-span-2 sm:col-span-3 md:col-span-4 xl:col-span-5 ${className}`}
    >
      <AdCreative ad={ad} variant="feed" compact />
    </div>
  );
}
