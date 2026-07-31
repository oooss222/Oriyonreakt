import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import { getPromotionPlan } from "../lib/promotionPlans";
import { formatMoney } from "../lib/format";
import {
  canAccessAdminPanel,
  canAccessAccountant,
} from "../lib/adminUtils";
import {
  getUnreadTotal,
  subscribeUnreadCount,
  subscribeUnreadRefresh,
} from "../lib/unread";
import ModerationListingsPanel from "../components/admin/ModerationListingsPanel";
import ListingPromotionPanel from "../components/ListingPromotionPanel";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import ProfileSettingsPanel from "../components/profile/ProfileSettingsPanel";
import WalletPanel from "../components/profile/WalletPanel";
import MyListingsPanel from "../components/profile/MyListingsPanel";
import ProfileListingsGrid from "../components/profile/ProfileListingsGrid";
import SavedSearchesTab from "../components/profile/SavedSearchesTab";
import { getId, normalizeTab } from "../components/profile/profileUtils";

export default function Profile() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [tab, setTabState] = React.useState(() => normalizeTab(searchParams.get("tab")));

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
    whatsapp: me?.whatsapp || "",
    telegram: me?.telegram || "",
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
  const [paymentReturnMessage, setPaymentReturnMessage] = React.useState("");
  const [promotionPrices, setPromotionPrices] = React.useState({
    vipPrice: 25,
    topPrice: 15,
    bumpPrice: 5,
  });
  const [promotingId, setPromotingId] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

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

  const loadUnread = React.useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.messageInbox(token);
      setUnreadCount(getUnreadTotal(data));
    } catch {
      setUnreadCount(0);
    }
  }, [token]);

  React.useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    return () => clearInterval(timer);
  }, [loadUnread]);

  React.useEffect(() => subscribeUnreadCount(setUnreadCount), []);
  React.useEffect(() => subscribeUnreadRefresh(loadUnread), [loadUnread]);

  React.useEffect(() => {
    api
      .siteSettings()
      .then((settings) => {
        if (!settings) return;
        setPromotionPrices({
          vipPrice: settings.vipPrice ?? 25,
          topPrice: settings.topPrice ?? 15,
          bumpPrice: settings.bumpPrice ?? 5,
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
          whatsapp: u.whatsapp || "",
          telegram: u.telegram || "",
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
    const oldWhatsapp = currentMe.whatsapp || "";
    const oldTelegram = currentMe.telegram || "";

    if (
      form.name === oldName &&
      form.phone === oldPhone &&
      form.whatsapp === oldWhatsapp &&
      form.telegram === oldTelegram
    ) {
      return;
    }

    const h = setTimeout(() => {
      api
        .updateMe(token, {
          name: form.name,
          phone: form.phone,
          whatsapp: form.whatsapp,
          telegram: form.telegram,
        })
        .then((u) => {
          if (!u) return;
          setMe(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        })
        .catch(() => {});
    }, 900);

    return () => clearTimeout(h);
  }, [form.name, form.phone, form.whatsapp, form.telegram, token]);

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
        if (alive) setWalletHistory(Array.isArray(data) ? data : []);
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
        setMyItems((arr) => arr.filter((x) => String(getId(x)) !== String(id)));
      } catch {}
    },
    [token]
  );

  const submitAppeal = React.useCallback(
    async (id) => {
      const text = prompt(
        "Опишите, почему объявление должно быть одобрено (минимум 10 символов):"
      );
      if (!text) return;

      try {
        const updated = await api.listingAppeal(token, id, text.trim());
        setMyItems((arr) =>
          arr.map((item) =>
            String(getId(item)) === String(id) ? { ...item, ...updated } : item
          )
        );
        alert("Апелляция отправлена на рассмотрение");
      } catch (e) {
        alert(e?.message || "Не удалось отправить апелляцию");
      }
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

  const onWalletSuccess = React.useCallback(
    (user) => {
      setMe(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      api
        .walletTransactions(token)
        .then((data) => setWalletHistory(Array.isArray(data) ? data : []))
        .catch(() => {});
    },
    [token]
  );

  React.useEffect(() => {
    if (!token || searchParams.get("payment") !== "return") return;

    const orderId = sessionStorage.getItem("alifPendingOrder");

    if (!orderId) {
      setPaymentReturnMessage(
        "Вы вернулись с оплаты. Если баланс не обновился, подождите несколько секунд и обновите страницу."
      );
      setSearchParams({ tab: "wallet" }, { replace: true });
      return;
    }

    let alive = true;
    setPaymentReturnMessage("Проверяем статус оплаты...");

    api
      .syncAlifPayment(token, orderId)
      .then((result) => {
        if (!alive) return;

        sessionStorage.removeItem("alifPendingOrder");

        if (result?.user) {
          onWalletSuccess(result.user);
          setPaymentReturnMessage("Оплата прошла успешно. Баланс обновлён.");
          return;
        }

        const status = result?.order?.status || result?.providerStatus?.status;

        if (status === "failed" || status === "cancelled") {
          setPaymentReturnMessage("Оплата не завершена или была отменена.");
          return;
        }

        setPaymentReturnMessage(
          "Оплата ещё обрабатывается. Баланс обновится автоматически после подтверждения."
        );
      })
      .catch((e) => {
        if (!alive) return;
        setPaymentReturnMessage(e?.message || "Не удалось проверить статус оплаты.");
      })
      .finally(() => {
        if (!alive) return;
        setSearchParams({ tab: "wallet" }, { replace: true });
      });

    return () => {
      alive = false;
    };
  }, [token, searchParams, setSearchParams, onWalletSuccess]);

  const updateListingStatus = React.useCallback(
    async (id, action) => {
      const prompts = {
        sold: "Отметить объявление как проданное?",
        archive: "Снять объявление с публикации?",
        republish: "Опубликовать объявление снова?",
      };

      if (!confirm(prompts[action] || "Изменить статус объявления?")) return;

      try {
        let updated;

        if (action === "sold") updated = await api.markListingSold(token, id);
        else if (action === "archive") updated = await api.archiveListing(token, id);
        else updated = await api.republishListing(token, id);

        setMyItems((items) =>
          items.map((item) => (String(getId(item)) === String(id) ? updated : item))
        );
      } catch (e) {
        alert(e.message || "Не удалось обновить статус");
      }
    },
    [token]
  );

  const bulkAction = React.useCallback(
    async (action, ids) => {
      const labels = {
        sold: "Отметить выбранные объявления как проданные?",
        archive: "Снять выбранные объявления с публикации?",
        delete: "Удалить выбранные объявления?",
      };

      if (!confirm(labels[action] || "Применить действие к выбранным объявлениям?")) {
        return;
      }

      try {
        for (const id of ids) {
          if (action === "delete") {
            await api.deleteListing(token, id);
          } else if (action === "sold") {
            await api.markListingSold(token, id);
          } else if (action === "archive") {
            await api.archiveListing(token, id);
          }
        }

        if (action === "delete") {
          setMyItems((items) =>
            items.filter((item) => !ids.includes(String(getId(item))))
          );
        } else {
          const refreshed = await api.myListings(token);
          setMyItems(Array.isArray(refreshed) ? refreshed : []);
        }
      } catch (e) {
        alert(e?.message || "Не удалось выполнить массовое действие");
      }
    },
    [token]
  );

  const promoteListing = React.useCallback(
    async (id, type, days) => {
      if (type === "bump") {
        const price = Number(promotionPrices.bumpPrice || 0);
        const priceLabel = price <= 0 ? "бесплатно" : formatMoney(price);
        const confirmText =
          price <= 0
            ? "Обновить дату объявления бесплатно?"
            : `Обновить дату объявления за ${priceLabel}?`;

        if (!confirm(confirmText)) return;
      } else if (!getPromotionPlan(type, days)) {
        alert("Выберите срок продвижения");
        return;
      }

      try {
        setPromotingId(`${id}-${type}`);

        const updated = await api.promoteListing(
          token,
          id,
          type,
          type === "bump" ? undefined : days
        );

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
            : type === "top"
              ? "TOP продвижение активировано"
              : "Дата объявления обновлена"
        );
      } catch (e) {
        const message = e?.message || "";

        if (message.includes("Insufficient balance") || message.includes("402")) {
          if (confirm("Недостаточно средств на кошельке. Перейти к пополнению?")) {
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <ProfileHeader
        me={me}
        role={role}
        emailStatus={emailStatus}
        walletBalance={walletBalance}
        unreadCount={unreadCount}
        onOpenWallet={() => setTab("wallet")}
        onOpenPromote={() => setTab("promote")}
        onLogout={logout}
      />

      <ProfileTabs
        tab={tab}
        setTab={setTab}
        myCount={myItems.length}
        favCount={favItems.length}
        canOpenAdmin={canOpenAdmin}
        canOpenModeration={canOpenModeration}
        canAccessAccountant={canAccessAccountant}
        role={role}
      />

      {tab === "moderation" && canOpenModeration && (
        <ModerationListingsPanel token={token} />
      )}

      {tab === "wallet" && (
        <WalletPanel
          walletBalance={walletBalance}
          walletHistory={walletHistory}
          paymentReturnMessage={paymentReturnMessage}
          token={token}
          onWalletSuccess={onWalletSuccess}
          onOpenPromote={() => setTab("promote")}
        />
      )}

      {tab === "profile" && (
        <ProfileSettingsPanel
          me={me}
          role={role}
          form={form}
          setForm={setForm}
          emailStatus={emailStatus}
          sendingEmail={sendingEmail}
          onRequestVerifyEmail={requestVerifyEmail}
          token={token}
          onUpdated={setMe}
        />
      )}

      {tab === "promote" && (
        <ListingPromotionPanel
          listings={myItems}
          bumpPrice={promotionPrices.bumpPrice}
          walletBalance={walletBalance}
          promotingId={promotingId}
          onPromote={promoteListing}
          initialListingId={searchParams.get("listing") || ""}
        />
      )}

      {tab === "my" && (
        <MyListingsPanel
          items={myItems}
          loading={loadingMy}
          canManage
          onRemove={remove}
          onStatusAction={updateListingStatus}
          onAppeal={submitAppeal}
          onBulkAction={bulkAction}
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
            <ProfileListingsGrid items={favItems} tab="fav" canManage={false} onRemove={remove} />
          )}
        </div>
      )}

      {tab === "searches" && <SavedSearchesTab />}
    </div>
  );
}
