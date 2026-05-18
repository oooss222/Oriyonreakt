import React from "react";
import { api } from "../lib/api";

export default function AdSlot({
  placement = "home_top",
  type = "banner",
  className = "",
}) {
  const [ad, setAd] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function loadAd() {
      try {
        setLoading(true);

        const data = await api.adByPlacement(placement);

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
  }, [placement]);

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
    return null;
  }

  return (
    <a
      href={ad.targetUrl || "#"}
      target="_blank"
      rel="noreferrer"
      className={`block overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition ${styles[type]} ${className}`}
    >
      <img
        src={ad.imageUrl}
        alt={ad.title || "Реклама"}
        className="w-full h-full object-cover"
      />
    </a>
  );
}