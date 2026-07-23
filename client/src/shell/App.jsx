import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function App() {
  const location = useLocation();

  const isMessagesPage = location.pathname === "/messages";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      {!isMessagesPage && <Footer />}
    </div>
  );
}