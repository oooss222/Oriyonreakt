import React from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";
import CompareFloatingBar from "../components/CompareFloatingBar";
import CookieConsent from "../components/CookieConsent";
import { disconnectChatSocket, getChatSocket } from "../lib/chatSocket";
import { TOKEN_KEY } from "../lib/auth";
import { useLayoutConfig } from "../lib/useLayoutConfig";
import { ToastProvider, ConfirmProvider, Skeleton } from "../ui";
import { useI18n } from "../i18n";

function RouteFallback() {
  return (
    <div className="page-container py-8" aria-busy="true">
      <Skeleton className="h-7 w-48" />
      <div className="mt-5 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-56" rounded="rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function SkipLink() {
  const { t } = useI18n();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]
                 focus:rounded-xl focus:bg-ink-900 focus:px-4 focus:py-2.5
                 focus:text-sm focus:font-semibold focus:text-white"
    >
      {t("a11y.skipToContent")}
    </a>
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
    <ToastProvider>
      <ConfirmProvider>
        <div className="page-shell flex min-h-screen flex-col overflow-x-clip">
          <SkipLink />
          {/* Returns to the previous scroll position on Back instead of jumping. */}
          <ScrollRestoration />
          <Header variant={layout.headerVariant} />

          <main
            id="main"
            tabIndex={-1}
            className={`flex-1 outline-none ${layout.animateMain ? "animate-fade-in" : ""} ${
              layout.mobileBottomPadding
                ? "pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] lg:pb-0"
                : ""
            }`}
          >
            <React.Suspense fallback={<RouteFallback />}>
              <Outlet />
            </React.Suspense>
          </main>

          {layout.showFooter && (
            <div className="hidden lg:block">
              <Footer />
            </div>
          )}
          {layout.showMobileNav && <MobileNav showPolicyLink={layout.showFooter} />}
          {layout.showCompareBar && <CompareFloatingBar />}
          {layout.showCookieConsent && <CookieConsent />}
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
