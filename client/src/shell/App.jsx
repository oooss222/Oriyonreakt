import React from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";
import CompareFloatingBar from "../components/CompareFloatingBar";
import CookieConsent from "../components/CookieConsent";
import AdSlot, { useAdCreatives } from "../components/AdSlot";
import { disconnectChatSocket, getChatSocket } from "../lib/chatSocket";
import { TOKEN_KEY } from "../lib/auth";
import { useLayoutConfig } from "../lib/useLayoutConfig";
import Skeleton from "../components/ui/Skeleton";

function RouteFallback() {
  return (
    <div className="page-container py-10" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function StickyMobileAd() {
  const { pathname } = useLocation();
  const hiddenKey = "diyor_ad_sticky_hide_until";
  const [hidden, setHidden] = React.useState(() => {
    try {
      return Number(localStorage.getItem(hiddenKey) || 0) > Date.now();
    } catch {
      return false;
    }
  });

  const ads = useAdCreatives("mobile_sticky_bottom", { eager: true });

  if (
    hidden ||
    !ads.items.length ||
    pathname.startsWith("/add") ||
    pathname.startsWith("/edit") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 z-30 px-3 lg:hidden"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <div className="relative mx-auto max-w-lg">
        <button
          type="button"
          className="absolute -top-2 right-0 z-[1] grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-white"
          aria-label="Закрыть рекламу"
          onClick={() => {
            try {
              localStorage.setItem(hiddenKey, String(Date.now() + 60 * 60 * 1000));
            } catch {
              // Ignore storage failures and still hide the banner.
            }
            setHidden(true);
          }}
        >
          ×
        </button>
        <AdSlot placement="mobile_sticky_bottom" eager className="overflow-hidden rounded-xl shadow-sm" />
      </div>
    </div>
  );
}

export default function App() {
  const layout = useLayoutConfig();

  React.useEffect(() => {
    const heartbeat = setInterval(() => {
      const token = localStorage.getItem(TOKEN_KEY) || "";

      if (!token) {
        disconnectChatSocket();
        return;
      }

      const activeSocket = getChatSocket();

      if (activeSocket?.connected) {
        activeSocket.emit("presence:heartbeat");
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
    };
  }, []);

  return (
    <div className="page-shell min-h-screen min-w-0 max-w-full flex flex-col">
      {/* Returns to the previous scroll position on Back instead of jumping. */}
      <ScrollRestoration />
      {layout.headerVariant !== "hidden" && (
        <Header variant={layout.headerVariant} />
      )}

      <main
        className={`flex-1 min-w-0 ${layout.animateMain ? "animate-fade-in" : ""} ${
          layout.mobileBottomPadding
            ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
            : ""
        }`}
      >
        <React.Suspense fallback={<RouteFallback />}>
          <Outlet />
        </React.Suspense>
      </main>

      {layout.showFooter && <Footer />}
      {layout.showMobileNav && <StickyMobileAd />}
      {layout.showMobileNav && <MobileNav showPolicyLink={false} />}
      {layout.showCompareBar && <CompareFloatingBar />}
      {layout.showCookieConsent && <CookieConsent />}
    </div>
  );
}