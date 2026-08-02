import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";
import CompareFloatingBar from "../components/CompareFloatingBar";
import CookieConsent from "../components/CookieConsent";
import { connectChatSocket, disconnectChatSocket, getChatSocket } from "../lib/chatSocket";
import { TOKEN_KEY } from "../lib/auth";
import { useLayoutConfig } from "../lib/useLayoutConfig";

export default function App() {
  const layout = useLayoutConfig();

  React.useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem(TOKEN_KEY) || "";

      if (!token) {
        disconnectChatSocket();
        return null;
      }

      return connectChatSocket(token);
    };

    connect();

    const heartbeat = setInterval(() => {
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
      <Header variant={layout.headerVariant} />

      <main
        className={`flex-1 ${layout.animateMain ? "animate-fade-in-up" : ""} ${
          layout.mobileBottomPadding
            ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
            : ""
        }`}
      >
        <Outlet />
      </main>

      {layout.showFooter && (
        <div className="hidden lg:block">
          <Footer />
        </div>
      )}
      {layout.showMobileNav && <MobileNav />}
      {layout.showCompareBar && <CompareFloatingBar />}
      {layout.showCookieConsent && <CookieConsent />}
    </div>
  );
}