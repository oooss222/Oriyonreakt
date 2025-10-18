import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Основная оболочка
import App from "./shell/App.jsx";

// Страницы
import Home from "./pages/Home.jsx";
import Listing from "./pages/Listing.jsx";
import Auth from "./pages/Auth.jsx";
import Category from "./pages/Category.jsx";
import Policy from "./pages/Policy.jsx";
import AdDetails from "./pages/AdDetails.jsx";
import Profile from "./pages/Profile.jsx";
import AddListing from "./pages/AddListing.jsx";

// Стили
import "./styles/index.css";

// 404
function NotFound() {
  return (
    <div className="container-x py-10">
      <div className="card p-6 space-y-3 text-center">
        <h1 className="text-2xl font-bold text-brand">
          Страница не найдена (404)
        </h1>
        <p className="text-slate-600">
          Проверьте адрес или вернитесь на главную.
        </p>
        <a className="btn mt-4" href="/">
          На главную
        </a>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "listing", element: <Listing /> },
      { path: "ad/:id", element: <AdDetails /> },
      { path: "auth", element: <Auth /> },
      { path: "c/:slug", element: <Category /> },
      { path: "policy", element: <Policy /> },
      { path: "profile", element: <Profile /> },
      { path: "add", element: <AddListing /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
