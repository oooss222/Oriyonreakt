import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useParams, useSearchParams, Navigate } from "react-router-dom";

import App from "./shell/App.jsx";
import { DEFAULT_REAL_ESTATE_BROWSE_PATH } from "./lib/realestateSeo.js";
import { useI18n } from "./i18n";

// Routes are split so a visitor landing on the catalogue does not download the
// admin panel, chat, compare and listing-form code they may never open.
// App renders the shared Suspense boundary.
const Home = React.lazy(() => import("./pages/Home.jsx"));
const Listing = React.lazy(() => import("./pages/Listing.jsx"));
const AdDetails = React.lazy(() => import("./pages/AdDetails.jsx"));
const Seller = React.lazy(() => import("./pages/Seller.jsx"));
const Auth = React.lazy(() => import("./pages/Auth.jsx"));
const Policy = React.lazy(() => import("./pages/Policy.jsx"));
const Profile = React.lazy(() => import("./pages/Profile.jsx"));
const Messages = React.lazy(() => import("./pages/Messages.jsx"));
const AddListing = React.lazy(() => import("./pages/AddListing.jsx"));
const EditListing = React.lazy(() => import("./pages/EditListing.jsx"));
const Admin = React.lazy(() => import("./pages/Admin.jsx"));
const CompareHub = React.lazy(() => import("./pages/CompareHub.jsx"));
const RealEstateDevelopment = React.lazy(
  () => import("./pages/RealEstateDevelopment.jsx")
);
const Sections = React.lazy(() => import("./pages/Sections.jsx"));
const Advertise = React.lazy(() => import("./pages/Advertise.jsx"));

import "./styles/index.css";
import { I18nProvider } from "./i18n/index.jsx";

function LegacyCompareRedirect({ cat }) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const next = new URLSearchParams();
  const key = cat || slug;
  if (key) next.set("cat", key);
  const share = params.get("share");
  if (share) next.set("share", share);
  const query = next.toString();
  return <Navigate to={query ? `/sravnenie?${query}` : "/sravnenie"} replace />;
}

function CategoryListingRoute() {
  const { slug } = useParams();

  if (slug === "realestate") {
    return <Navigate to={DEFAULT_REAL_ESTATE_BROWSE_PATH} replace />;
  }

  if (slug === "repair") {
    return <Navigate to="/c/construction" replace />;
  }

  return <Listing />;
}

function NotFound() {
  const { t } = useI18n();

  return (
    <div className="page-container py-10">
      <div className="surface-panel p-8 space-y-3 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("notFound.title")}
        </h1>

        <p className="text-ink-400">
          {t("notFound.body")}
        </p>

        <a className="btn btn-primary mt-4" href="/">
          {t("notFound.home")}
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
        path: "sravnenie",
        element: <CompareHub />,
      },
      {
        path: "c/:slug/sravnenie",
        element: <LegacyCompareRedirect />,
      },
      {
        path: "realestate",
        element: <Navigate to={DEFAULT_REAL_ESTATE_BROWSE_PATH} replace />,
      },
      {
        path: "realestate/zhk/:slug",
        element: <RealEstateDevelopment />,
      },
      {
        path: "realestate/sravnenie",
        element: <LegacyCompareRedirect cat="realestate" />,
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
        path: "sections",
        element: <Sections />,
      },
      {
        path: "policy",
        element: <Policy />,
      },
      {
        path: "advertise",
        element: <Advertise />,
      },
      {
        path: "admin/ads",
        element: <Navigate to="/admin?section=ads" replace />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "admin",
        element: <Admin />,
        handle: {
          layout: {
            showFooter: false,
            showMobileNav: false,
            showCompareBar: false,
            showCookieConsent: false,
            headerVariant: "hidden",
            animateMain: false,
            mobileBottomPadding: false,
          },
        },
      },

      {
        path: "messages",
        element: <Messages />,
        handle: {
          layout: {
            showFooter: false,
            showCompareBar: false,
            animateMain: false,
            mobileBottomPadding: false,
          },
        },
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
  <I18nProvider>
    <RouterProvider router={router} />
  </I18nProvider>
);