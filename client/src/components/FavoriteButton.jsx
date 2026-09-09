import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "../lib/api";
import { goToAuth } from "../lib/auth";
import { trackFavorite } from "../lib/track";
import { cn } from "../ui";
import { useI18n } from "../i18n";

export default function FavoriteButton({
  id,
  defaultActive = false,
  onChange,
  compact = false,
  overlay = false,
  listing = null,
}) {
  const nav = useNavigate();
  const { t } = useI18n();
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

  const label = active ? t("favorites.remove") : t("favorites.add");

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "group/fav inline-flex shrink-0 items-center justify-center transition",
        // Overlay buttons sit on a photo, so they need their own surface and a
        // 40px hit area even though the icon itself is small.
        overlay &&
          "h-10 w-10 rounded-full bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white hover:shadow-md active:scale-95",
        !overlay &&
          !compact &&
          "h-10 w-10 rounded-full border border-ink-200 bg-white shadow-xs hover:border-danger-200 hover:bg-danger-50",
        compact && "h-9 w-9 rounded-full hover:bg-mist-200",
        loading && "cursor-not-allowed opacity-70"
      )}
    >
      <Heart
        size={overlay || compact ? 18 : 19}
        className={cn(
          "transition-colors",
          active
            ? "text-danger-500"
            : "text-ink-400 group-hover/fav:text-danger-500"
        )}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}
