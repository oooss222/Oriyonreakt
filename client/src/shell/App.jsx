import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileNav from "../components/MobileNav";
import CompareFloatingBar from "../components/CompareFloatingBar";
import { connectChatSocket, disconnectChatSocket, getChatSocket } from "../lib/chatSocket";
import { TOKEN_KEY } from "../lib/auth";

export default function App() {
  const location = useLocation();

  const isMessagesPage = location.pathname === "/messages";

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
    <div className="page-shell min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className={`flex-1 animate-fade-in-up ${isMessagesPage ? "" : "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"}`}>
        <Outlet />
      </main>

      {!isMessagesPage && (
        <div className="hidden lg:block">
          <Footer />
        </div>
      )}
      <MobileNav />
      <CompareFloatingBar />
    </div>
  );
}