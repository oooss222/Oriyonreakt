import React from "react";
import { Heart } from "lucide-react";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";

export default function FavoriteButton({
  id,
  defaultActive = false,
  onChange,
  compact = false,
}) {
  const token = localStorage.getItem(TOKEN_KEY) || "";

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
      window.location.href = "/auth";
      return;
    }

    if (loading) return;

    const next = !active;

    setLoading(true);
    setActive(next);

    try {
      if (next) {
        await api.addFavorite(token, id);
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
        compact
          ? "p-1"
          : "rounded-full border bg-white/90 backdrop-blur px-2.5 py-2 shadow-sm hover:shadow"
      } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      <Heart
        size={18}
        className={`transition-colors ${
          active
            ? "text-red-600"
            : "text-slate-500 group-hover:text-red-500"
        }`}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}