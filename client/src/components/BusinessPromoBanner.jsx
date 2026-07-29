import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  MessageCircle,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import { openBusinessSupportChat } from "../lib/openBusinessSupportChat";
import { BUSINESS_BENEFITS } from "../lib/businessAccount";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export default function BusinessPromoBanner({
  compact = false,
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
      setError(e.message || "Не удалось открыть чат с администратором");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div
        className={`rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 md:p-5 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-100 bg-white/10 rounded-full px-3 py-1">
              <Sparkles size={14} />
              Oriyon Бизнес
            </div>
            <h3 className="text-lg font-bold mt-2">
              Продавайте как компания — до 100 объявлений
            </h3>
            <p className="text-sm text-blue-100/90 mt-1">
              Обсудите подключение с администратором в чате
            </p>
            {error && (
              <p className="text-xs text-red-200 mt-2">{error}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition disabled:opacity-60 shrink-0"
          >
            <MessageCircle size={18} />
            {loading ? "Открываем чат…" : "Узнать условия"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white shadow-lg ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,106,0,0.22),transparent_40%)]" />
      <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

      <div className="relative p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-100 bg-white/10 rounded-full px-3 py-1">
              <Building2 size={14} />
              Бизнес-аккаунт
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mt-3 leading-tight">
              Масштабируйте продажи с{" "}
              <span className="text-sun-200">Oriyon Бизнес</span>
            </h2>

            <p className="text-sm md:text-base text-blue-100/90 mt-3 max-w-2xl">
              Для агентств, автосалонов и компаний: бренд-страница, бейдж
              «Компания», верификация и до 100 активных объявлений. Нажмите —
              и администратор ответит в чате.
            </p>

            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-50/95">
              {BUSINESS_BENEFITS.slice(0, 4).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <BadgeCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>

            {error && (
              <p className="text-sm text-red-200 mt-4">{error}</p>
            )}
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5 md:p-6 space-y-4">
            <div className="text-sm text-blue-100">
              Подключение через администратора
            </div>
            <div className="text-3xl font-bold">Oriyon Бизнес</div>
            <p className="text-sm text-blue-100/85">
              Обсудите тариф, верификацию и настройку профиля компании в
              личном чате — без звонков и ожидания.
            </p>

            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-sun text-white font-bold hover:bg-sun-600 transition disabled:opacity-60"
            >
              <MessageCircle size={18} />
              {loading ? "Открываем чат…" : "Написать администратору"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
