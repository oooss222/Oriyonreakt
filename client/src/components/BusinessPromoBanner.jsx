import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MessageCircle, ChevronRight } from "lucide-react";
import { openBusinessSupportChat } from "../lib/openBusinessSupportChat";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export default function BusinessPromoBanner({
  className = "",
  hideForCompany = true,
  sellerType: sellerTypeProp,
}) {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sellerType, setSellerType] = React.useState(sellerTypeProp || "private");

  React.useEffect(() => {
    if (sellerTypeProp) {
      setSellerType(sellerTypeProp);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      setSellerType(user?.sellerType || "private");
    } catch {
      setSellerType("private");
    }
  }, [sellerTypeProp]);

  if (hideForCompany && sellerType === "company") {
    return null;
  }

  const handleClick = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      await openBusinessSupportChat({ nav, token });
    } catch (e) {
      setError(e.message || "Не удалось открыть чат");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`surface-panel overflow-hidden relative ${className}`}
      aria-label="Oriyon Premium"
    >
      <div
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sun to-lagoon"
        aria-hidden="true"
      />

      <div className="p-4 md:p-5 pl-5 md:pl-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sun-50 ring-1 ring-sun/15 grid place-items-center shrink-0">
            <Building2 className="text-sun" size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wide text-sun-700">
              Oriyon Premium
            </div>
            <h3 className="font-display font-bold text-lg text-ink mt-0.5">
              Продавайте с премиум-аккаунтом
            </h3>
            <p className="text-sm text-ink-400 mt-1 leading-relaxed">
              Логотип, Instagram, адреса магазинов и автообновление дат
              объявлений. Напишите администратору — обсудите подключение в чате.
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-2">{error}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="btn btn-primary shrink-0 w-full sm:w-auto justify-center py-3 px-5 disabled:opacity-60"
          >
            <MessageCircle size={18} />
            {loading ? "Открываем чат…" : "Написать администратору"}
            {!loading && <ChevronRight size={18} className="opacity-80" />}
          </button>
        </div>
      </div>
    </section>
  );
}
