import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { connectChatSocket, disconnectChatSocket, getChatSocket } from "../lib/chatSocket";

const TOKEN_KEY = "auth_token";

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
    <div className="page-shell min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 animate-fade-in-up">
        <Outlet />
      </main>

      {!isMessagesPage && <Footer />}
    </div>
  );
}