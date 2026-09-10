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

function RouteFallback() {
  return (
    <div className="page-container py-10" aria-busy="true">
      <div className="h-8 w-48 rounded-xl bg-mist animate-pulse" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-48 rounded-2xl bg-mist animate-pulse"
          />
        ))}
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
    <div className="page-shell min-h-screen flex flex-col overflow-x-clip">
      {/* Returns to the previous scroll position on Back instead of jumping. */}
      <ScrollRestoration />
      <Header variant={layout.headerVariant} />

      <main
        className={`flex-1 ${layout.animateMain ? "animate-fade-in-up" : ""} ${
          layout.mobileBottomPadding
            ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
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
  );
}