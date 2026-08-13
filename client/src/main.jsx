import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useParams, Navigate } from "react-router-dom";

import App from "./shell/App.jsx";
import Messages from "./pages/Messages.jsx";
import Home from "./pages/Home.jsx";
import Listing from "./pages/Listing.jsx";
import Auth from "./pages/Auth.jsx";
import Policy from "./pages/Policy.jsx";
import AdDetails from "./pages/AdDetails.jsx";
import Profile from "./pages/Profile.jsx";
import AddListing from "./pages/AddListing.jsx";
import EditListing from "./pages/EditListing.jsx";
import Seller from "./pages/Seller.jsx";
import Admin from "./pages/Admin.jsx";
import RealEstate from "./pages/RealEstate.jsx";
import RealEstateCompare from "./pages/RealEstateCompare.jsx";
import ListingCompare from "./pages/ListingCompare.jsx";
import RealEstateDevelopment from "./pages/RealEstateDevelopment.jsx";

import "./styles/index.css";

function CategoryCompareRoute() {
  const { slug } = useParams();
  return <ListingCompare cat={slug} />;
}

function CategoryListingRoute() {
  const { slug } = useParams();

  if (slug === "realestate") {
    return <Navigate to="/realestate" replace />;
  }

  if (slug === "repair") {
    return <Navigate to="/c/services" replace />;
  }

  return <Listing />;
}

function NotFound() {
  return (
    <div className="page-container py-10">
      <div className="surface-panel p-8 space-y-3 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          Страница не найдена (404)
        </h1>

        <p className="text-ink-400">
          Проверьте адрес или вернитесь на главную.
        </p>

        <a className="btn btn-primary mt-4" href="/">
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
      {
        index: true,
        element: <Home />,
      },
      {
        path: "listing",
        element: <Listing />,
      },
      {
        path: "ad/:id",
        element: <AdDetails />,
        handle: {
          layout: {
            animateMain: false,
          },
        },
      },
      {
        path: "seller/:id",
        element: <Seller />,
      },
      {
        path: "auth",
        element: <Auth />,
        handle: {
          layout: {
            showFooter: false,
            showMobileNav: false,
            showCompareBar: false,
            showCookieConsent: false,
            headerVariant: "minimal",
            animateMain: false,
            mobileBottomPadding: false,
          },
        },
      },
      {
        path: "c/:slug",
        element: <CategoryListingRoute />,
      },
      {
        path: "c/:slug/sravnenie",
        element: <CategoryCompareRoute />,
      },
      {
        path: "realestate",
        element: <RealEstate />,
      },
      {
        path: "realestate/zhk/:slug",
        element: <RealEstateDevelopment />,
      },
      {
        path: "realestate/sravnenie",
        element: <RealEstateCompare />,
      },
      {
        path: "realestate/:citySlug",
        element: <Listing />,
      },
      {
        path: "realestate/:citySlug/:subSlug",
        element: <Listing />,
      },
      {
        path: "realestate/:citySlug/:subSlug/:dealSlug",
        element: <Listing />,
      },
      {
        path: "realestate/:citySlug/:subSlug/:dealSlug/:roomsSlug",
        element: <Listing />,
      },
      {
        path: "policy",
        element: <Policy />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "admin",
        element: <Admin />,
      },

      {
        path: "messages",
        element: <Messages />,
      },

      {
        path: "add",
        element: <AddListing />,
      },
      {
         path: "edit/:id",
         element: <EditListing />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);