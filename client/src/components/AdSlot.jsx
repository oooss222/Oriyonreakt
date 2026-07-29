import React from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../lib/api";

function trackAd(id, type) {
  if (!id) return;

  api.trackAd(id, type).catch(() => {});
}

function AdLabel() {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      Реклама
    </span>
  );
}

function BannerAd({ ad, className = "" }) {
  const content = (
    <>
      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.headline || ad.title || "Реклама"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full min-h-[90px] items-center justify-center bg-slate-100 px-4 text-center text-sm text-slate-500">
          {ad.headline || ad.title || "Рекламный блок"}
        </div>
      )}
    </>
  );

  if (!ad.linkUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
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
      className={`block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md ${className}`}
    >
      {content}
    </a>
  );
}

function NativeAd({ ad, className = "", compact = false }) {
  const body = (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-3 ${
        ad.linkUrl ? "transition hover:shadow-md" : ""
      } ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <AdLabel />
        {ad.advertiser ? (
          <span className="truncate text-xs text-slate-400">{ad.advertiser}</span>
        ) : null}
      </div>

      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.headline || ad.title || "Реклама"}
          className={`mb-3 w-full rounded-xl object-cover bg-slate-100 ${
            compact ? "h-28" : "h-36"
          }`}
          loading="lazy"
        />
      ) : null}

      <div className="space-y-1">
        <div className={`font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}>
          {ad.headline || ad.title || "Рекламное предложение"}
        </div>
        {ad.description ? (
          <p className={`text-slate-500 ${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}>
            {ad.description}
          </p>
        ) : null}
      </div>

      {ad.linkUrl ? (
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sun-700">
          Подробнее
          <ExternalLink size={14} />
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
      className="block"
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
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 ${className}`}>
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
