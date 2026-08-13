import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { trackFavorite } from "../lib/track";

export default function FavoriteButton({
  id,
  defaultActive = false,
  onChange,
  compact = false,
  overlay = false,
  listing = null,
}) {
  const nav = useNavigate();
  const token = localStorage.getItem("auth_token") || "";

  const [active, setActive] = React.useState(Boolean(defaultActive));
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setActive(Boolean(defaultActive));
  }, [defaultActive]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) {
      console.error("FavoriteButton: missing listing id");
      return;
    }

    if (!token) {
      goToAuth(nav);
      return;
    }

    if (loading) return;

    const next = !active;

    setLoading(true);
    setActive(next);

    try {
      if (next) {
        await api.addFavorite(token, id);
        if (listing) trackFavorite(listing);
      } else {
        await api.removeFavorite(token, id);
      }

      onChange?.(next);
    } catch (error) {
      console.error("Favorite toggle failed:", error);
      setActive(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={active ? "Убрать из избранного" : "В избранное"}
      title={active ? "Убрать из избранного" : "В избранное"}
      className={`inline-flex items-center justify-center transition group shrink-0 ${
        overlay
          ? "h-9 w-9 rounded-full border border-ink/10 bg-white shadow-sm hover:shadow-md"
          : compact
            ? "p-1"
            : "rounded-full border bg-white/90 backdrop-blur px-2.5 py-2 shadow-sm hover:shadow"
      } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      <Heart
        size={overlay ? 16 : 18}
        className={`transition-colors ${
          active
            ? "text-red-600"
            : "text-gray-700 group-hover:text-red-600"
        }`}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}
