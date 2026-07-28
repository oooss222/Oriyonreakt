import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { goToAuth, TOKEN_KEY, USER_KEY } from "../lib/auth";
import FavoriteButton from "../components/FavoriteButton";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import {
  User as UserIcon,
  LogOut,
  PlusCircle,
  Pencil,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  FolderHeart,
  Wallet,
  Shield,
  ClipboardCheck,
} from "lucide-react";
import {
  canAccessAdminPanel,
  canAccessAccountant,
} from "../lib/adminUtils";
import ModerationListingsPanel from "../components/admin/ModerationListingsPanel";
import ListingPromotionActions from "../components/ListingPromotionActions";

const WALLET_TYPE_LABELS = {
  top_up: "Пополнение",
  payment: "Списание",
  refund: "Возврат",
  manual_adjustment: "Корректировка",
};

const normalizeTab = (value) => {
  if (value === "favorites") return "fav";
  if (
    ["fav", "profile", "wallet", "admin", "moderation", "my"].includes(value)
  ) {
    return value;
  }
  return "my";
};

const getId = (item) => item?.id || item?._id;

const EmailBadge = React.memo(function EmailBadge({ status }) {
  if (status === "verified") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
        <CheckCircle2 size={14} />
        Верифицирован
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        <ShieldAlert size={14} />
        Письмо отправлено
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-50 text-slate-700 border inline-flex items-center gap-1">
      <ShieldCheck size={14} />
      Не подтверждён
    </span>
  );
});

const WalletTopUp = React.memo(function WalletTopUp({ token, onSuccess }) {
  const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

  const [amount, setAmount] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const value = React.useMemo(() => {
    return Number(String(amount).replace(",", "."));
  }, [amount]);

  const isValid = Number.isFinite(value) && value > 0;

  const submit = React.useCallback(
    async (e) => {
      e.preventDefault();

      setError("");
      setSuccess("");

      if (!isValid) {
        setError("Введите корректную сумму");
        return;
      }

      if (value < 1) {
        setError("Минимальная сумма пополнения — 1 TJS");
        return;
      }

      if (value > 10000) {
        setError("Максимальная сумма пополнения — 10 000 TJS");
        return;
      }

      try {
        setLoading(true);

        const user = await api.topUpWallet(token, value);

        onSuccess?.(user, {
          amount: value,
          type: "top_up",
          createdAt: new Date().toISOString(),
        });

        setSuccess(`Баланс пополнен на ${value.toLocaleString("ru-RU")} TJS`);
        setAmount("");
      } catch (e) {
        setError(e.message || "Ошибка пополнения");
      } finally {
        setLoading(false);
      }
    },
    [token, value, isValid, onSuccess]
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Быстрый выбор суммы</div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_AMOUNTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setAmount(String(item));
                setError("");
                setSuccess("");
              }}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                Number(amount) === item
                  ? "bg-sun text-white border-blue-600"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {item} TJS
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="text-sm font-medium mb-1">Сумма пополнения</div>

        <div className="relative">
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d.,]/g, ""));
              setError("");
              setSuccess("");
            }}
            placeholder="Например: 100"
            className="input w-full pr-14"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            TJS
          </span>
        </div>

        <div className="text-xs text-slate-500 mt-1">
          Минимум 1 TJS, максимум 10 000 TJS.
        </div>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 text-sm">
          {success}
        </div>
      )}

      <button
        disabled={loading || !isValid}
        className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-sun text-white hover:bg-sun-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Пополняем..." : "Пополнить баланс"}
      </button>
    </form>
  );
});

const ListingCard = React.memo(function ListingCard({
  ad,
  canManage,
  onRemove,
  onStatusAction,
  onPromote,
  promotionPrices,
  walletBalance,
  promotingId,
  compact = false,
  isFavorite = false,
}) {
  const id = getId(ad);
  const imgUrl = getListingThumb(ad);
  const more = Math.max(0, (ad.images?.length || 0) - 1);

  const status = ad.status || "pending";

  const statusMap = {
    pending: {
      label: "На модерации",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    approved: {
      label: "Опубликовано",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Отклонено",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    sold: {
      label: "Продано",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    archived: {
      label: "Снято",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const statusInfo = statusMap[status] || statusMap.pending;

  return (
    <div className="group rounded-3xl border bg-white p-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <Link
        to={`/ad/${id}`}
        onClick={() => sessionStorage.setItem("ad_preview", JSON.stringify(ad))}
        className="block"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={imgUrl}
            alt={ad.title || "Объявление"}
            className={`w-full object-cover bg-slate-100 transition-transform duration-500 group-hover:scale-105 ${
              compact ? "h-36" : "h-44"
            }`}
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <span
              className={`inline-flex px-2 py-0.5 text-[11px] rounded-full border bg-white/90 backdrop-blur ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>

            {ad.vip && (
              <span className="inline-flex px-2 py-0.5 text-[11px] rounded-full bg-sun text-white font-semibold">
                VIP
              </span>
            )}

            {ad.top && (
              <span className="inline-flex px-2 py-0.5 text-[11px] rounded-full bg-lagoon text-white font-semibold">
                TOP
              </span>
            )}
          </div>

          {more > 0 && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white rounded-full px-2 py-0.5">
              +{more}
            </span>
          )}
        </div>

        <div className="p-2">
          <div className="font-semibold text-sm line-clamp-2 group-hover:text-sun transition">
            {ad.title || "Без названия"}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="text-sun-700 font-extrabold">
              {formatPrice(ad.price, { emptyLabel: "—" })}
            </div>

            {!canManage && (
              <FavoriteButton id={id} defaultActive={isFavorite} compact />
            )}
          </div>

          <div className="text-xs text-slate-500 line-clamp-1 mt-1">
            {ad.location || ad.city || "Локация не указана"}
          </div>

          <div className="text-xs text-slate-400 mt-1">
            {ad.createdAt
              ? new Date(ad.createdAt).toLocaleDateString("ru-RU")
              : "Дата не указана"}
          </div>
        </div>
      </Link>

      {ad.rejectionReason && (
        <div className="mx-2 mb-2 rounded-xl border border-red-200 bg-red-50 text-red-700 p-2 text-xs">
          <b>Причина:</b> {ad.rejectionReason}
        </div>
      )}

      {canManage && (
        <div className="px-2 pb-2 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/edit/${id}`}
              className="inline-flex flex-1 justify-center items-center gap-1 px-3 py-2 rounded-xl bg-sun text-white hover:bg-sun-600 transition text-sm"
            >
              <Pencil size={16} />
              Редактировать
            </Link>

            <button
              type="button"
              className="inline-flex justify-center items-center gap-1 px-3 py-2 rounded-xl border text-red-600 hover:bg-red-50 transition text-sm"
              onClick={() => onRemove(id)}
            >
              <Trash2 size={16} />
              Удалить
            </button>
          </div>

          {status === "approved" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex flex-1 justify-center px-3 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 transition text-sm"
                onClick={() => onStatusAction?.(id, "sold")}
              >
                Продано
              </button>

              <button
                type="button"
                className="inline-flex flex-1 justify-center px-3 py-2 rounded-xl border text-slate-700 hover:bg-slate-50 transition text-sm"
                onClick={() => onStatusAction?.(id, "archive")}
              >
                Снять с публикации
              </button>
            </div>
          )}

          {status === "approved" && onPromote && (
            <ListingPromotionActions
              listing={ad}
              vipPrice={promotionPrices?.vipPrice}
              topPrice={promotionPrices?.topPrice}
              walletBalance={walletBalance}
              promoting={promotingId}
              compact
              onPromote={(type) => onPromote(id, type)}
            />
          )}

          {(status === "sold" || status === "archived") && (
            <button
              type="button"
              className="inline-flex w-full justify-center px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition text-sm"
              onClick={() => onStatusAction?.(id, "republish")}
            >
              Опубликовать снова
            </button>
          )}
        </div>
      )}
    </div>
  );
});

const ListingsGrid = React.memo(function ListingsGrid({
  items,
  tab,
  canManage,
  onRemove,
  onStatusAction,
  onPromote,
  promotionPrices,
  walletBalance,
  promotingId,
  compact = false,
}) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-sun-50 grid place-items-center mb-3">
          <PlusCircle className="text-sun" size={26} />
        </div>

        <div className="text-slate-800 font-semibold mb-1">
          {tab === "fav" ? "В избранном пока пусто" : "Пока нет объявлений"}
        </div>

        <div className="text-sm text-slate-500 mb-4">
          {tab === "fav"
            ? "Добавляйте объявления в избранное, чтобы быстро вернуться к ним."
            : "Создайте первое объявление, и после модерации оно появится на сайте."}
        </div>

        {tab === "my" ? (
          <Link
            to="/add"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sun text-white hover:bg-sun-600 transition"
          >
            <PlusCircle size={18} />
            Подать объявление
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border hover:bg-slate-50 transition"
          >
            На главную
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        compact
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      }`}
    >
      {items.map((ad) => (
        <ListingCard
          key={getId(ad)}
          ad={ad}
          canManage={canManage}
          onRemove={onRemove}
          onStatusAction={onStatusAction}
          onPromote={onPromote}
          promotionPrices={promotionPrices}
          walletBalance={walletBalance}
          promotingId={promotingId}
          compact={compact}
          isFavorite={tab === "fav"}
        />
      ))}
    </div>
  );
});

function MyListingsPanel({
  items,
  loading,
  canManage,
  onRemove,
  onStatusAction,
  onPromote,
  promotionPrices,
  walletBalance,
  promotingId,
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [view, setView] = React.useState("grid");

  const stats = React.useMemo(() => {
    return items.reduce(
      (acc, ad) => {
        const status = ad.status || "pending";

        acc.total += 1;
        acc[status] = (acc[status] || 0) + 1;

        return acc;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        sold: 0,
        archived: 0,
      }
    );
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((ad) => {
      const status = ad.status || "pending";

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (!q) return true;

      const title = String(ad.title || "").toLowerCase();
      const description = String(ad.description || "").toLowerCase();
      const location = String(ad.location || ad.city || "").toLowerCase();
      const cat = String(ad.cat || "").toLowerCase();
      const subcategory = String(ad.subcategory || "").toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        location.includes(q) ||
        cat.includes(q) ||
        subcategory.includes(q)
      );
    });
  }, [items, query, statusFilter]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 md:p-5">
        <ListingGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border bg-white p-4 md:p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
              <PlusCircle size={16} />
              Личный кабинет
            </div>

            <h2 className="text-2xl font-bold">Мои объявления</h2>

            <p className="text-sm text-slate-500 mt-1">
              Управляйте объявлениями, отслеживайте модерацию и статус публикации.
            </p>
          </div>

          <Link
            to="/add"
            className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-sun text-white hover:bg-sun-600 transition"
          >
            <PlusCircle size={18} />
            Подать объявление
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "all"
                ? "bg-sun-50 border-sun-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-slate-500">Всего</div>
            <div className="text-2xl font-extrabold">{stats.total}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "approved"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-emerald-700">Опубликовано</div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {stats.approved}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "pending"
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-amber-700">На модерации</div>
            <div className="text-2xl font-extrabold text-amber-700">
              {stats.pending}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="text-xs text-red-700">Отклонено</div>
            <div className="text-2xl font-extrabold text-red-700">
              {stats.rejected}
            </div>
          </button>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, категории или городу"
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="all">Все статусы</option>
            <option value="approved">Опубликованные</option>
            <option value="pending">На модерации</option>
            <option value="rejected">Отклонённые</option>
            <option value="sold">Проданные</option>
            <option value="archived">Снятые</option>
          </select>

          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-sun/40"
          >
            <option value="grid">Сетка</option>
            <option value="compact">Компактно</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <div>
            Показано:{" "}
            <span className="font-medium text-slate-800">
              {filtered.length}
            </span>{" "}
            из{" "}
            <span className="font-medium text-slate-800">
              {items.length}
            </span>
          </div>

          {!canManage && (
            <div className="rounded-full bg-slate-100 border px-3 py-1">
              Редактирование доступно только модератору, администратору и супер-админу
            </div>
          )}
        </div>
      </div>

      <ListingsGrid
        items={filtered}
        tab="my"
        canManage={canManage}
        onRemove={onRemove}
        onStatusAction={onStatusAction}
        onPromote={onPromote}
        promotionPrices={promotionPrices}
        walletBalance={walletBalance}
        promotingId={promotingId}
        compact={view === "compact"}
      />
    </div>
  );
}

export default function Profile() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [tab, setTabState] = React.useState(() =>
    normalizeTab(searchParams.get("tab"))
  );

  const [me, setMe] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });

  const [form, setForm] = React.useState({
    name: me?.name || "",
    email: me?.email || "",
    phone: me?.phone || "",
   
  });

  const [emailStatus, setEmailStatus] = React.useState(
    me?.emailVerified ? "verified" : "unknown"
  );

  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [myItems, setMyItems] = React.useState([]);
  const [favItems, setFavItems] = React.useState([]);
  const [loadingMy, setLoadingMy] = React.useState(false);
  const [loadingFav, setLoadingFav] = React.useState(false);
  const [walletHistory, setWalletHistory] = React.useState([]);
  const [promotionPrices, setPromotionPrices] = React.useState({
    vipPrice: 25,
    topPrice: 15,
  });
  const [promotingId, setPromotingId] = React.useState(null);

  const meRef = React.useRef(me);
  const firstProfileSave = React.useRef(true);

  React.useEffect(() => {
    meRef.current = me;
  }, [me]);

  const setTab = React.useCallback(
    (nextTab) => {
      setTabState(nextTab);
      setSearchParams({ tab: nextTab });
    },
    [setSearchParams]
  );

  React.useEffect(() => {
    setTabState(normalizeTab(searchParams.get("tab")));
  }, [searchParams]);

  React.useEffect(() => {
    if (searchParams.get("tab") === "admin") {
      nav("/admin", { replace: true });
    }
  }, [searchParams, nav]);

  React.useEffect(() => {
    api
      .siteSettings()
      .then((settings) => {
        if (!settings) return;

        setPromotionPrices({
          vipPrice: settings.vipPrice ?? 25,
          topPrice: settings.topPrice ?? 15,
        });
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    api
      .me(token)
      .then((u) => {
        if (!alive || !u) return;

        setMe(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          
        });
        setEmailStatus(u.emailVerified ? "verified" : "unknown");
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token) return;

    if (firstProfileSave.current) {
      firstProfileSave.current = false;
      return;
    }

    const currentMe = meRef.current;
    if (!currentMe) return;

    const oldName = currentMe.name || "";
    const oldPhone = currentMe.phone || "";

    if (form.name === oldName && form.phone === oldPhone) return;

    const h = setTimeout(() => {
      api
        .updateMe(token, {
          name: form.name,
          phone: form.phone,
          
        })
        .then((u) => {
          if (!u) return;
          setMe(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {});
    }, 900);

    return () => clearTimeout(h);
  }, [form.name, form.phone, token]);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    api
      .getVerification(token)
      .then((res) => {
        if (!alive) return;

        if (res?.emailVerified) setEmailStatus("verified");
        else if (res?.pending) setEmailStatus("pending");
        else setEmailStatus("unknown");
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token) return;

    let alive = true;

    setLoadingMy(true);

    api
      .myListings(token)
      .then((items) => {
        if (alive) setMyItems(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (alive) setMyItems([]);
      })
      .finally(() => {
        if (alive) setLoadingMy(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  React.useEffect(() => {
    if (!token || tab !== "fav") return;

    let alive = true;

    setLoadingFav(true);

    api
      .favorites(token)
      .then((items) => {
        if (alive) setFavItems(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (alive) setFavItems([]);
      })
      .finally(() => {
        if (alive) setLoadingFav(false);
      });

    return () => {
      alive = false;
    };
  }, [tab, token]);

  React.useEffect(() => {
    if (!token || tab !== "wallet") return undefined;

    let alive = true;

    api
      .walletTransactions(token)
      .then((data) => {
        if (alive) {
          setWalletHistory(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (alive) setWalletHistory([]);
      });

    return () => {
      alive = false;
    };
  }, [token, tab]);

  const remove = React.useCallback(
    async (id) => {
      if (!confirm("Удалить объявление?")) return;

      try {
        await api.deleteListing(token, id);
        setMyItems((arr) =>
          arr.filter((x) => String(getId(x)) !== String(id))
        );
      } catch {}
    },
    [token]
  );

  const logout = React.useCallback(() => {
    if (!confirm("Выйти из аккаунта?")) return;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    nav("/auth");
  }, [nav]);

  const requestVerifyEmail = React.useCallback(async () => {
    try {
      setSendingEmail(true);
      await api.requestEmailVerification(token);
      setEmailStatus("pending");
      alert("Письмо для подтверждения отправлено. Проверьте почту!");
    } catch (e) {
      alert("Ошибка: " + (e?.message || "не удалось отправить письмо"));
    } finally {
      setSendingEmail(false);
    }
  }, [token]);

  const onWalletSuccess = React.useCallback((user) => {
    setMe(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    api
      .walletTransactions(token)
      .then((data) => {
        setWalletHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [token]);

  const updateListingStatus = React.useCallback(
    async (id, action) => {
      const prompts = {
        sold: "Отметить объявление как проданное?",
        archive: "Снять объявление с публикации?",
        republish: "Опубликовать объявление снова?",
      };

      if (!confirm(prompts[action] || "Изменить статус объявления?")) {
        return;
      }

      try {
        let updated;

        if (action === "sold") {
          updated = await api.markListingSold(token, id);
        } else if (action === "archive") {
          updated = await api.archiveListing(token, id);
        } else {
          updated = await api.republishListing(token, id);
        }

        setMyItems((items) =>
          items.map((item) =>
            String(getId(item)) === String(id) ? updated : item
          )
        );
      } catch (e) {
        alert(e.message || "Не удалось обновить статус");
      }
    },
    [token]
  );

  const promoteListing = React.useCallback(
    async (id, type) => {
      const price =
        type === "vip" ? promotionPrices.vipPrice : promotionPrices.topPrice;
      const label = type === "vip" ? "VIP (7 дней)" : "TOP (3 дня)";

      if (
        !confirm(
          `Подключить ${label} за ${Number(price).toLocaleString("ru-RU")} TJS?`
        )
      ) {
        return;
      }

      try {
        setPromotingId(`${id}-${type}`);

        const updated = await api.promoteListing(token, id, type);

        setMyItems((items) =>
          items.map((item) =>
            String(getId(item)) === String(id) ? { ...item, ...updated } : item
          )
        );

        const user = await api.me(token);

        if (user) {
          setMe(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }

        alert(
          type === "vip"
            ? "VIP продвижение активировано"
            : "TOP продвижение активировано"
        );
      } catch (e) {
        const message = e?.message || "";

        if (
          message.includes("Insufficient balance") ||
          message.includes("402")
        ) {
          if (
            confirm(
              "Недостаточно средств на кошельке. Перейти к пополнению?"
            )
          ) {
            setTab("wallet");
          }

          return;
        }

        alert(message || "Не удалось подключить продвижение");
      } finally {
        setPromotingId(null);
      }
    },
    [token, promotionPrices, setTab]
  );

  const walletBalance = Number(me?.walletBalance || 0);
  const role = me?.role || "user";

  const canOpenAdmin = canAccessAdminPanel(role);
  const canOpenModeration =
    role === "moderator" || role === "admin" || role === "super_admin";

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="text-slate-600">Вы не авторизованы.</p>
          <Link to="/auth" className="btn btn-primary">
            Войти / Зарегистрироваться
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl border bg-white p-4 md:p-5 flex items-center gap-4">
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-slate-100 to-white border grid place-items-center overflow-hidden">
          <UserIcon className="text-slate-500" size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
              <ShieldCheck size={14} />
              Личный кабинет
            </span>

            <span className="px-2 py-0.5 text-xs rounded-full bg-sun-50 text-sun-700 border border-sun-100">
              {role}
            </span>

            <EmailBadge status={emailStatus} />
          </div>

          <h1 className="text-2xl font-bold leading-tight truncate">
            {me?.name || "Без имени"}
          </h1>

          <div className="text-slate-600 text-sm flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            {me?.email && (
              <span className="inline-flex items-center gap-1">
                <Mail size={16} className="text-slate-400" />
                {me.email}
              </span>
            )}

            {me?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={16} className="text-slate-400" />
                {me.phone}
              </span>
            )}

            <span className="inline-flex items-center gap-1">
              <Wallet size={16} className="text-slate-400" />
              Баланс: {walletBalance.toLocaleString("ru-RU")} TJS
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/add"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sun text-white hover:bg-sun-600 transition shadow-sm"
          >
            <PlusCircle size={18} />
            Добавить
          </Link>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50 transition"
            onClick={logout}
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-2">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
            <UserIcon size={18} />
            Профиль
          </TabButton>

          <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")}>
            <Wallet size={18} />
            Кошелёк
          </TabButton>

          {canOpenAdmin && (
            <Link
              to={canAccessAccountant(role) ? "/admin?section=finance" : "/admin"}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-slate-50 transition"
            >
              {canAccessAccountant(role) ? (
                <Wallet size={18} />
              ) : (
                <Shield size={18} />
              )}
              {canAccessAccountant(role) ? "Финансы" : "Админка"}
            </Link>
          )}

          {canOpenModeration && (
            <TabButton
              active={tab === "moderation"}
              onClick={() => setTab("moderation")}
            >
              <ClipboardCheck size={18} />
              Модерация
            </TabButton>
          )}

          <TabButton active={tab === "my"} onClick={() => setTab("my")}>
            Мои объявления
            <span className="ml-1 rounded-full border px-2 py-0.5 text-xs bg-white text-slate-700">
              {myItems.length}
            </span>
          </TabButton>

          <TabButton active={tab === "fav"} onClick={() => setTab("fav")}>
            <FolderHeart size={18} />
            Избранное
            <span className="ml-1 rounded-full border px-2 py-0.5 text-xs bg-white text-slate-700">
              {favItems.length}
            </span>
          </TabButton>
        </div>
      </div>

      {tab === "moderation" && canOpenModeration && (
        <ModerationListingsPanel token={token} />
      )}

      

     {tab === "wallet" && (
  <div className="space-y-6">
    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-sun-700 bg-sun-50 border border-sun-100 rounded-full px-3 py-1 mb-2">
            <Wallet className="w-4 h-4" />
            Финансы
          </div>

          <h2 className="text-xl font-bold">Кошелёк</h2>

          <p className="text-sm text-slate-500 mt-1">
            Баланс используется для платных услуг и продвижения объявлений.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border bg-gradient-to-br from-ink-700 to-ink-900 p-6 text-white shadow-soft overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-sun/20" />
          <div className="absolute right-10 bottom-6 w-20 h-20 rounded-full bg-lagoon/20" />

          <div className="relative">
            <div className="text-sm text-white/70">Текущий баланс</div>

            <div className="text-4xl font-extrabold mt-2">
              {walletBalance.toLocaleString("ru-RU")} TJS
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">
                Аккаунт: {me?.email || "—"}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1">
                Роль: {role}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-slate-50 p-5 space-y-3">
          <div className="text-sm text-slate-500">Статус кошелька</div>

          <div className="text-lg font-bold text-emerald-700">
            Активен
          </div>

          <div className="text-sm text-slate-600">
            Пополнения сейчас выполняются в тестовом режиме через внутренний API.
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border bg-white p-4 md:p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Пополнить баланс</h3>
          <p className="text-sm text-slate-500 mt-1">
            Выберите сумму или введите свою.
          </p>
        </div>

        <WalletTopUp token={token} onSuccess={onWalletSuccess} />
      </div>

      <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
        <h3 className="text-lg font-semibold">Информация</h3>

        <div className="space-y-3 text-sm text-slate-600">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Платные услуги</div>
            <div className="mt-1">
              Баланс можно использовать для VIP, TOP и продвижения объявлений.
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Безопасность</div>
            <div className="mt-1">
              Никому не передавайте данные аккаунта. Операции выполняются только после авторизации.
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Валюта</div>
            <div className="mt-1">
              Все суммы отображаются в TJS.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border bg-white p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Последние операции</h3>

        <span className="text-sm text-slate-500">
          История операций
        </span>
      </div>

      {walletHistory.length === 0 ? (
        <div className="rounded-xl border bg-slate-50 p-5 text-center text-slate-500">
          Операций пока нет.
        </div>
      ) : (
        <div className="space-y-2">
          {walletHistory.map((operation) => (
            <div
              key={operation.id || operation._id}
              className="rounded-xl border p-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-medium">
                  {WALLET_TYPE_LABELS[operation.type] || operation.description || "Операция"}
                </div>

                <div className="text-xs text-slate-500">
                  {operation.createdAt
                    ? new Date(operation.createdAt).toLocaleString("ru-RU")
                    : ""}
                </div>
              </div>

              <div
                className={`font-bold ${
                  Number(operation.amount || 0) >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {Number(operation.amount || 0) >= 0 ? "+" : ""}
                {Number(operation.amount || 0).toLocaleString("ru-RU")} TJS
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

     {tab === "profile" && (
  <div className="space-y-6">
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-5">
        <div className="rounded-3xl border bg-white overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-ink-800 via-ink-700 to-lagoon-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,106,0,0.28),transparent_42%)]" />
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-14 flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-28 h-28 rounded-3xl border-4 border-white bg-white shadow-lg overflow-hidden grid place-items-center">
                <UserIcon size={42} className="text-slate-400" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {me?.name || "Без имени"}
                  </h2>

                  <span className="px-2 py-0.5 text-xs rounded-full bg-sun-50 text-sun-700 border border-sun-100">
                    {role}
                  </span>

                  <EmailBadge status={emailStatus} />
                </div>

                <div className="text-sm text-slate-500 mt-2 flex flex-wrap gap-4">
                  <div className="inline-flex items-center gap-1">
                    <Mail size={15} />
                    {me?.email || "Email не указан"}
                  </div>

                  <div className="inline-flex items-center gap-1">
                    <Phone size={15} />
                    {me?.phone || "Телефон не указан"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Объявлений
                </div>

                <div className="text-2xl font-bold mt-1">
                  {myItems.length}
                </div>
              </div>

              <div className="rounded-2xl border bg-emerald-50 p-4">
                <div className="text-xs text-emerald-700">
                  Избранное
                </div>

                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  {favItems.length}
                </div>
              </div>

              <div className="rounded-2xl border bg-sun-50 p-4">
                <div className="text-xs text-sun-700">
                  Баланс
                </div>

                <div className="text-2xl font-bold text-sun-700 mt-1">
                  {walletBalance.toLocaleString("ru-RU")} TJS
                </div>
              </div>

              <div className="rounded-2xl border bg-purple-50 p-4">
                <div className="text-xs text-purple-700">
                  Статус
                </div>

                <div className="text-lg font-bold text-purple-700 mt-1">
                  {emailStatus === "verified"
                    ? "Подтверждён"
                    : "Ожидает"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Настройки профиля
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Информация обновляется автоматически.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              <CheckCircle2 size={16} />
              Автосохранение
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium mb-2">
                Имя пользователя
              </div>

              <input
                className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-sun/40"
                value={form.name}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    name: e.target.value,
                  }))
                }
                placeholder="Введите имя"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-2">
                Email
              </div>

              <input
                className="h-12 rounded-2xl border px-4 w-full bg-slate-50"
                type="email"
                value={form.email}
                readOnly
              />
            </label>

            <label className="block md:col-span-2">
              <div className="text-sm font-medium mb-2">
                Телефон
              </div>

              <input
  className="h-12 rounded-2xl border px-4 w-full outline-none focus:ring-2 focus:ring-sun/40"
  placeholder="+992 ..."
  value={form.phone}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      phone: e.target.value,
    }))
  }
/>

            </label>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">
                Безопасность аккаунта
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Подтверждение электронной почты и защита аккаунта.
              </p>
            </div>

            <EmailBadge status={emailStatus} />
          </div>

          {emailStatus === "verified" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center">
                <ShieldCheck className="text-emerald-600" />
              </div>

              <div>
                <div className="font-semibold text-emerald-700">
                  Почта подтверждена
                </div>

                <div className="text-sm text-emerald-600">
                  Ваш аккаунт успешно защищён.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center border">
                  <Mail className="text-sun" />
                </div>

                <div className="flex-1">
                  <div className="font-semibold">
                    Подтвердите адрес электронной почты
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    После подтверждения аккаунт станет более защищённым.
                  </p>

                  <button
                    onClick={requestVerifyEmail}
                    disabled={
                      sendingEmail ||
                      emailStatus === "pending"
                    }
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sun text-white hover:bg-sun-600 transition disabled:opacity-60"
                  >
                    <Mail size={18} />

                    {emailStatus === "pending"
                      ? "Письмо отправлено"
                      : sendingEmail
                      ? "Отправляем..."
                      : "Отправить письмо"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border bg-white p-5">
          <h3 className="font-bold text-lg mb-4">
            Активность аккаунта
          </h3>

          <div className="space-y-3">
            <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Мои объявления
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Управление публикациями
                </div>
              </div>

              <div className="text-xl font-bold">
                {myItems.length}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Избранные товары
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Сохранённые объявления
                </div>
              </div>

              <div className="text-xl font-bold">
                {favItems.length}
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Статус аккаунта
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Текущая роль
                </div>
              </div>

              <div className="text-sm font-bold text-sun-700 uppercase">
                {role}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-gradient-to-br from-ink-800 to-lagoon-700 text-white p-5 overflow-hidden relative">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-sun/20" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 text-sm bg-white/10 border border-white/20 rounded-xl px-3 py-1">
              <ShieldCheck size={15} />
              Oriyon Security
            </div>

            <h3 className="font-display text-xl font-bold mt-4">
              Безопасный аккаунт
            </h3>

            <p className="text-sm text-white/70 mt-2">
              Все объявления проходят модерацию для защиты пользователей.
            </p>

            <Link
              to="/add"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-sun-700 font-semibold hover:bg-sun-50 transition"
            >
              <PlusCircle size={18} />
              Подать объявление
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {tab === "my" && (
  <MyListingsPanel
    items={myItems}
    loading={loadingMy}
    canManage={true}
    onRemove={remove}
    onStatusAction={updateListingStatus}
    onPromote={promoteListing}
    promotionPrices={promotionPrices}
    walletBalance={walletBalance}
    promotingId={promotingId}
  />
)}

      {tab === "fav" && (
        <div className="rounded-2xl border bg-white p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Избранное</h2>
            <div className="text-sm text-slate-500">Всего: {favItems.length}</div>
          </div>

          {loadingFav ? (
            <ListingGridSkeleton />
          ) : (
            <ListingsGrid
              items={favItems}
              tab={tab}
              canManage={false}
              onRemove={remove}
            />
          )}
        </div>
      )}
    </div>
  );
}

const TabButton = React.memo(function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
        active
          ? "bg-sun text-white border-blue-600"
          : "hover:bg-slate-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
});