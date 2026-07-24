import React from "react";
import { api, API_BASE } from "../lib/api";

function resolveAdImage(src) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:")) return src;

  const server = API_BASE.replace(/\/api$/, "");
  return `${server}/${String(src).replace(/^\/+/, "")}`;
}

export default function AdSlot({
  placement,
  id,
  type = "banner",
  className = "",
  fallback = false,
}) {
  const slotPlacement = placement || id || "home_top";
  const [ad, setAd] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function loadAd() {
      try {
        setLoading(true);

        const data = await api.adByPlacement(slotPlacement);

        if (active) {
          setAd(data || null);
        }
      } catch (e) {
        console.error("AD_LOAD_ERROR:", e?.message);

        if (active) {
          setAd(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAd();

    return () => {
      active = false;
    };
  }, [slotPlacement]);

  const styles = {
    banner: "w-full h-24 md:h-28",
    sidebar: "w-full h-56",
    infeed: "w-full h-24",
  };

  if (loading) {
    return (
      <div
        className={`rounded-2xl bg-slate-100 animate-pulse ${styles[type]} ${className}`}
      />
    );
  }

  if (!ad?.imageUrl) {
    if (!fallback) return null;

    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50 grid place-items-center text-xs text-slate-400 ${styles[type]} ${className}`}
      >
        Рекламный блок
      </div>
    );
  }

  const imageSrc = resolveAdImage(ad.imageUrl);

  return (
    <a
      href={ad.targetUrl || "#"}
      target="_blank"
      rel="noreferrer"
      className={`block overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition ${styles[type]} ${className}`}
    >
      <img
        src={imageSrc}
        alt={ad.title || "Реклама"}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </a>
  );
}