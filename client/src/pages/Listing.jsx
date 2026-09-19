import React from "react";
import { useSearchParams, useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { getUserFacingErrorMessage } from "../lib/apiError";
import { useI18n, getCategoryLabel, formatNightsLabel, formatListingTimeAgo } from "../i18n";
import ListingGridSkeleton from "../components/ListingGridSkeleton";
import ListingCard from "../components/ListingCard";
import EmptyState from "../components/EmptyState";
import Breadcrumbs from "../components/Breadcrumbs";
import ListingFiltersPanel from "../components/ListingFiltersPanel";
import ListingFiltersSidebar from "../components/ListingFiltersSidebar";
import RealEstateFiltersSidebar from "../components/RealEstateFiltersSidebar";
import SubcategoryChips from "../components/SubcategoryChips";
import SimilarListingsSection from "../components/SimilarListingsSection";
import AdSlot, { AdFeedCard, useAdPlacement } from "../components/AdSlot";
import RealEstateSearchHero from "../components/RealEstateSearchHero";
import RealEstateListingCard from "../components/RealEstateListingCard";
import RealEstateMoreFiltersModal from "../components/RealEstateMoreFiltersModal";
import RealEstateDailyFilterBar from "../components/realestate/RealEstateDailyFilterBar";
import SaveSearchButton from "../components/SaveSearchButton";
import { isDailyDeal, countNights } from "../data/realEstate";
import { buildFeedWithAds } from "../lib/adFeed";
import {
  buildRealEstateListingUrl,
  isRealEstateSeoPath,
  parseRealEstateSeoParams,
  buildRealEstatePageTitle,
  buildRealEstateMetaDescription,
  buildRealEstateBreadcrumbs,
  DEFAULT_REAL_ESTATE_BROWSE_PATH,
} from "../lib/realestateSeo";
import { FEED_AD_INTERVAL } from "../lib/adPlacements";
import { usePageMeta } from "../lib/usePageMeta";
import { sortListingsByMode } from "../lib/listingSort";
import { CATS, parseSpecsParam } from "../data/listingCategories";
import { resolveLegacyCategoryFilters } from "../data/categoryConsolidation";
import ClothingQuickFilters from "../components/clothing/ClothingQuickFilters";
import FoodQuickFilters from "../components/food/FoodQuickFilters";
import KidsQuickFilters from "../components/kids/KidsQuickFilters";
import TravelQuickFilters from "../components/travel/TravelQuickFilters";
import ConstructionQuickFilters from "../components/construction/ConstructionQuickFilters";
import BusinessQuickFilters from "../components/business/BusinessQuickFilters";
import { REAL_ESTATE_CAT } from "../data/realEstate";
import { sanitizeRealEstateDraft } from "../lib/filterConflicts";
import {
  getCategorySlugFromPath,
  isCategoryBrowsePath,
} from "../lib/categoryRoutes";
import CatalogToolbar, { persistCatalogView, readCatalogView } from "../components/CatalogToolbar";
import Pagination from "../components/Pagination";
import { LISTING_PAGE_SIZE, getPageFromSearchParams, getTotalPages } from "../lib/pagination";
import {
  Search,
  SlidersHorizontal,
  X,
  PackageSearch,
} from "lucide-react";

function buildListingParams(draft, urlCat = "") {
  const next = {};
  const normalizedSearch = String(draft?.search || "").trim();
  const effectiveCat = draft.cat || urlCat;

  if (normalizedSearch) {
    next.search = normalizedSearch;
    next.q = normalizedSearch;
  }

  if (effectiveCat) next.cat = effectiveCat;
  if (draft.subcategory) next.subcategory = draft.subcategory;
  if (draft.priceFrom) next.priceFrom = draft.priceFrom;
  if (draft.priceTo) next.priceTo = draft.priceTo;
  if (draft.location) next.location = draft.location;
  if (draft.region && !draft.location) next.region = draft.region;
  if (draft.sort) next.sort = draft.sort;
  if (draft.areaFrom) next.areaFrom = draft.areaFrom;
  if (draft.areaTo) next.areaTo = draft.areaTo;
  if (draft.floorFrom) next.floorFrom = draft.floorFrom;
  if (draft.floorTo) next.floorTo = draft.floorTo;
  if (draft.floorNotFirst) next.floorNotFirst = "1";
  if (draft.floorNotLast) next.floorNotLast = "1";
  if (draft.sellerType) next.sellerType = draft.sellerType;
  if (draft.pricePerSqmFrom) next.pricePerSqmFrom = draft.pricePerSqmFrom;
  if (draft.pricePerSqmTo) next.pricePerSqmTo = draft.pricePerSqmTo;
  if (draft.checkIn) next.checkIn = draft.checkIn;
  if (draft.checkOut) next.checkOut = draft.checkOut;
  if (draft.guests) next.guests = draft.guests;
  if (draft.yearFrom) next.yearFrom = draft.yearFrom;
  if (draft.yearTo) next.yearTo = draft.yearTo;
  if (draft.mileageFrom) next.mileageFrom = draft.mileageFrom;
  if (draft.mileageTo) next.mileageTo = draft.mileageTo;
  if (draft.onlyWithPhotos) next.onlyWithPhotos = "1";
  if (draft.verifiedOnly) next.verifiedOnly = "1";

  const specEntries = Object.entries(draft.specs || {}).filter(
    ([name, value]) => String(name).trim() && String(value).trim()
  );

  if (specEntries.length) {
    next.specs = JSON.stringify(Object.fromEntries(specEntries));
  }

  return next;
}

function searchParamsToDraft(params) {
  return {
    search: params.get("search") || params.get("q") || "",
    cat: params.get("cat") || "",
    subcategory: params.get("subcategory") || "",
    priceFrom: params.get("priceFrom") || "",
    priceTo: params.get("priceTo") || "",
    location: params.get("location") || "",
    region: params.get("region") || "",
    sort: params.get("sort") || "new",
    areaFrom: params.get("areaFrom") || "",
    areaTo: params.get("areaTo") || "",
    floorFrom: params.get("floorFrom") || "",
    floorTo: params.get("floorTo") || "",
    floorNotFirst: params.get("floorNotFirst") === "1",
    floorNotLast: params.get("floorNotLast") === "1",
    sellerType: params.get("sellerType") || "",
    pricePerSqmFrom: params.get("pricePerSqmFrom") || "",
    pricePerSqmTo: params.get("pricePerSqmTo") || "",
    checkIn: params.get("checkIn") || "",
    checkOut: params.get("checkOut") || "",
    guests: params.get("guests") || "",
    yearFrom: params.get("yearFrom") || "",
    yearTo: params.get("yearTo") || "",
    mileageFrom: params.get("mileageFrom") || "",
    mileageTo: params.get("mileageTo") || "",
    onlyWithPhotos: params.get("onlyWithPhotos") === "1",
    verifiedOnly: params.get("verifiedOnly") === "1",
    specs: parseSpecsParam(params.get("specs")),
  };
}

function buildListingQueryFromSearchParams(params, { limit = LISTING_PAGE_SIZE, offset = 0 } = {}) {
  const draft = searchParamsToDraft(params);
  const query = {
    ...buildListingParams(draft, draft.cat),
    sort: draft.sort || "new",
    limit,
    offset,
  };

  if (draft.guests) {
    query.guestsMin = draft.guests;
  }

  return query;
}

function buildListingQueryFromDraft(
  draft,
  urlCat = "",
  { limit = LISTING_PAGE_SIZE, offset = 0 } = {}
) {
  const query = {
    ...buildListingParams(draft, urlCat),
    sort: draft.sort || "new",
    limit,
    offset,
  };

  if (draft.guests) {
    query.guestsMin = draft.guests;
  }

  return query;
}

function draftsMatch(appliedDraft, nextDraft, urlCat = "") {
  return (
    JSON.stringify(buildListingParams(appliedDraft, urlCat)) ===
    JSON.stringify(buildListingParams(nextDraft, urlCat))
  );
}

export default function Listing() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const params = useParams();
  const locationPath = useLocation().pathname;

  const seoDraft = React.useMemo(() => {
    if (!isRealEstateSeoPath(locationPath)) return null;
    return parseRealEstateSeoParams(params);
  }, [locationPath, params]);

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [previewTotal, setPreviewTotal] = React.useState(0);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [reMoreFiltersOpen, setReMoreFiltersOpen] = React.useState(false);
  const [catalogView, setCatalogView] = React.useState(readCatalogView);
  const [categoryStats, setCategoryStats] = React.useState({
    total: 0,
    bySubcategory: {},
  });

  const categoryFromPath = React.useMemo(
    () => getCategorySlugFromPath(locationPath),
    [locationPath]
  );
  const isCategoryBrowse = isCategoryBrowsePath(locationPath);

  const cat = searchParams.get("cat") || categoryFromPath || "";
  const subcategory = searchParams.get("subcategory") || "";
  const search =
    searchParams.get("search") || searchParams.get("q") || "";
  const paramsKey = searchParams.toString();
  const currentPage = getPageFromSearchParams(searchParams);

  React.useEffect(() => {
    if (locationPath !== "/listing") return;

    const catParam = searchParams.get("cat");
    if (!catParam || catParam === REAL_ESTATE_CAT) return;

    const next = new URLSearchParams(searchParams);
    next.delete("cat");
    const query = next.toString();

    nav(`/c/${catParam}${query ? `?${query}` : ""}`, { replace: true });
  }, [locationPath, paramsKey, searchParams, nav]);

  React.useEffect(() => {
    const legacy = resolveLegacyCategoryFilters(
      cat || searchParams.get("cat") || "",
      searchParams.get("subcategory") || ""
    );
    if (!legacy) return;

    if (legacy.path) {
      nav(legacy.path, { replace: true });
      return;
    }

    if (
      legacy.cat === "kids" ||
      legacy.cat === "services" ||
      legacy.cat === "construction"
    ) {
      const next = new URLSearchParams(searchParams);
      next.delete("cat");
      if (legacy.subcategory) {
        next.set("subcategory", legacy.subcategory);
      } else {
        next.delete("subcategory");
      }
      const query = next.toString();
      nav(`/c/${legacy.cat}${query ? `?${query}` : ""}`, { replace: true });
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (isCategoryBrowse) {
      next.delete("cat");
    } else {
      next.set("cat", legacy.cat);
    }
    if (legacy.subcategory) {
      next.set("subcategory", legacy.subcategory);
    } else {
      next.delete("subcategory");
    }
    setSearchParams(next, { replace: true });
  }, [paramsKey, searchParams, setSearchParams, cat, isCategoryBrowse, nav]);

  const appliedDraft = React.useMemo(() => {
    const fromQuery = searchParamsToDraft(searchParams);

    if (categoryFromPath) {
      fromQuery.cat = categoryFromPath;
    }

    if (!seoDraft) return fromQuery;

    return {
      ...fromQuery,
      ...seoDraft,
      cat: REAL_ESTATE_CAT,
      specs: {
        ...(seoDraft.specs || {}),
        ...(fromQuery.specs || {}),
      },
    };
  }, [paramsKey, searchParams, seoDraft, categoryFromPath]);

  const activeSpecs = appliedDraft.specs;
  const priceFrom = appliedDraft.priceFrom;
  const priceTo = appliedDraft.priceTo;
  const location = appliedDraft.location;
  const region = appliedDraft.region;
  const sort = appliedDraft.sort;

  const [draft, setDraft] = React.useState(appliedDraft);

  React.useEffect(() => {
    setDraft(appliedDraft);
  }, [paramsKey, appliedDraft]);

  React.useEffect(() => {
    if (!mobileFiltersOpen) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  const listingQuery = React.useMemo(() => {
    const offset = (currentPage - 1) * LISTING_PAGE_SIZE;
    const urlCat = categoryFromPath || cat || (seoDraft ? REAL_ESTATE_CAT : "");

    return buildListingQueryFromDraft(appliedDraft, urlCat, {
      limit: LISTING_PAGE_SIZE,
      offset,
    });
  }, [appliedDraft, categoryFromPath, cat, seoDraft, currentPage]);

  const draftIsDirty = React.useMemo(
    () => !draftsMatch(appliedDraft, draft, cat),
    [appliedDraft, draft, cat]
  );

  const activeCat = draft.cat || cat || categoryFromPath || (seoDraft ? REAL_ESTATE_CAT : "");
  const isRealEstate = activeCat === REAL_ESTATE_CAT;

  React.useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        // Both calls are independent; running them in series added a full
        // round trip to every page load and filter change.
        const [data, countData] = await Promise.all([
          api.listings(listingQuery),
          // Count is optional on older API builds.
          api.listingCount(listingQuery).catch(() => null),
        ]);

        const count = Number(
          countData?.total ?? (Array.isArray(data) ? data.length : 0)
        );

        if (active) {
          const list = Array.isArray(data) ? data.filter(Boolean) : [];
          setItems(sortListingsByMode(list, sort || "new"));
          setTotal(count);
          setPreviewTotal(count);
        }
      } catch (e) {
        if (active) {
          setError(getUserFacingErrorMessage(e, t) || t("errors.loadListings"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      active = false;
    };
  }, [listingQuery, sort, t]);

  React.useEffect(() => {
    if (!draftIsDirty) {
      setPreviewTotal(total);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const countData = await api.listingCount(
          buildListingQueryFromDraft(
            draft,
            activeCat || cat || (seoDraft ? REAL_ESTATE_CAT : "")
          )
        );

        if (active) {
          setPreviewTotal(Number(countData?.total || 0));
        }
      } catch {
        if (active) {
          setPreviewTotal(total);
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [draft, total, activeCat, cat, seoDraft, draftIsDirty]);

  React.useEffect(() => {
    if (!activeCat) {
      setCategoryStats({ total: 0, bySubcategory: {} });
      return undefined;
    }

    let active = true;

    api
      .listingStats(activeCat, appliedDraft.location || "")
      .then((data) => {
        if (active) {
          setCategoryStats(data || { total: 0, bySubcategory: {} });
        }
      })
      .catch(() => {
        if (active) {
          setCategoryStats({ total: 0, bySubcategory: {} });
        }
      });

    return () => {
      active = false;
    };
  }, [activeCat, appliedDraft.location]);

  const feedAd = useAdPlacement("listing_feed", activeCat);
  const feedRows = React.useMemo(
    () => buildFeedWithAds(items, feedAd, FEED_AD_INTERVAL),
    [items, feedAd]
  );
  const effectiveListingCat = cat || categoryFromPath || (seoDraft ? REAL_ESTATE_CAT : "");
  const catConfig = effectiveListingCat ? CATS[effectiveListingCat] : null;
  const availableSubcategories = React.useMemo(() => {
    const config = activeCat ? CATS[activeCat] : null;
    if (!config) return [];
    // Lifestyle: Paydo-style group tiles in the filter (server expands to items).
    if (
      (activeCat === "clothing" ||
        activeCat === "food" ||
        activeCat === "kids" ||
        activeCat === "travel" ||
        activeCat === "construction" ||
        activeCat === "business") &&
      Array.isArray(config.subGroups)
    ) {
      return config.subGroups.map(({ group }) => group);
    }
    return config.subs || [];
  }, [activeCat]);

  const effectiveSubcategory = appliedDraft.subcategory || subcategory;
  const effectiveLocation = appliedDraft.location || location;
  const effectiveDeal = appliedDraft.specs?.["Тип сделки"] || "";
  const isDailyListing = isRealEstate && isDailyDeal(effectiveDeal);
  const stayNights = countNights(appliedDraft.checkIn, appliedDraft.checkOut);

  const localizedCatTitle = catConfig
    ? getCategoryLabel(effectiveListingCat, t)
    : "";

  const pageTitle = React.useMemo(() => {
    if (isRealEstate) {
      return buildRealEstatePageTitle(appliedDraft);
    }

    if (catConfig) {
      return localizedCatTitle;
    }

    if (search) {
      return t("listing.searchTitle", { query: search });
    }

    return t("listing.listingsInDushanbe");
  }, [
    isRealEstate,
    appliedDraft,
    effectiveSubcategory,
    catConfig,
    localizedCatTitle,
    search,
    t,
  ]);

  const pageDescription = React.useMemo(() => {
    if (isRealEstate) {
      return buildRealEstateMetaDescription(appliedDraft);
    }

    if (catConfig) {
      return t("listing.categoryMeta", { title: pageTitle });
    }

    return t("listing.listingsMeta");
  }, [isRealEstate, appliedDraft, catConfig, pageTitle, t]);

  const breadcrumbItems = React.useMemo(() => {
    if (isRealEstate) {
      return buildRealEstateBreadcrumbs(appliedDraft);
    }

    const crumbs = [{ label: t("nav.home"), to: "/" }];

    if (catConfig) {
      crumbs.push({
        label: localizedCatTitle,
        to: catConfig.landingPath || `/c/${effectiveListingCat}`,
      });
    }

    if (effectiveSubcategory) {
      crumbs.push({
        label: effectiveSubcategory,
      });
    } else if (!catConfig && search) {
      crumbs.push({ label: t("listing.search") });
    } else if (!catConfig) {
      crumbs.push({ label: t("listing.listings") });
    }

    return crumbs;
  }, [
    isRealEstate,
    appliedDraft,
    catConfig,
    effectiveListingCat,
    effectiveSubcategory,
    effectiveLocation,
    search,
    localizedCatTitle,
    t,
  ]);

  usePageMeta({
    title: pageTitle,
    description: pageDescription,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  const applyFilters = React.useCallback(
    (nextDraft) => {
      let payload =
        nextDraft &&
        typeof nextDraft === "object" &&
        typeof nextDraft.search === "string"
          ? nextDraft
          : draft;

      const effectiveCat = payload.cat || cat || (seoDraft ? REAL_ESTATE_CAT : "");

      if (effectiveCat === REAL_ESTATE_CAT) {
        payload = sanitizeRealEstateDraft(payload, {
          dealType: payload.specs?.["Тип сделки"],
          subcategory: payload.subcategory,
        });
      }

      setDraft(payload);

      if (effectiveCat === REAL_ESTATE_CAT) {
        nav(
          buildRealEstateListingUrl({
            city: payload.location,
            subcategory: payload.subcategory,
            dealType: payload.specs?.["Тип сделки"],
            rooms: payload.specs?.["Комнат"],
            priceFrom: payload.priceFrom,
            priceTo: payload.priceTo,
            specs: payload.specs,
            sort: payload.sort,
            areaFrom: payload.areaFrom,
            areaTo: payload.areaTo,
            floorFrom: payload.floorFrom,
            floorTo: payload.floorTo,
            floorNotFirst: payload.floorNotFirst,
            floorNotLast: payload.floorNotLast,
            sellerType: payload.sellerType,
            pricePerSqmFrom: payload.pricePerSqmFrom,
            pricePerSqmTo: payload.pricePerSqmTo,
            checkIn: payload.checkIn,
            checkOut: payload.checkOut,
            guests: payload.guests,
          })
        );
      } else {
        const urlParams = buildListingParams(payload, effectiveCat);
        if (isCategoryBrowse) {
          delete urlParams.cat;
        }
        setSearchParams(urlParams);
      }

      setMobileFiltersOpen(false);
    },
    [draft, cat, seoDraft, nav, setSearchParams, isCategoryBrowse]
  );

  const resetFilters = () => {
    if (isRealEstate) {
      nav(DEFAULT_REAL_ESTATE_BROWSE_PATH);
      return;
    }

    setDraft({
      search: "",
      cat: cat || "",
      subcategory: "",
      priceFrom: "",
      priceTo: "",
      location: "",
      region: "",
      sort: "new",
      areaFrom: "",
      areaTo: "",
      floorFrom: "",
      floorTo: "",
      floorNotFirst: false,
      floorNotLast: false,
      sellerType: "",
      pricePerSqmFrom: "",
      pricePerSqmTo: "",
      checkIn: "",
      checkOut: "",
      guests: "",
      yearFrom: "",
      yearTo: "",
      mileageFrom: "",
      mileageTo: "",
      specs: {},
    });
    if (isCategoryBrowse && categoryFromPath) {
      nav(`/c/${categoryFromPath}`);
    } else if (cat) {
      setSearchParams({ cat });
    } else {
      setSearchParams({});
    }

    setMobileFiltersOpen(false);
  };

  const hasActiveFilters =
    search ||
    subcategory ||
    priceFrom ||
    priceTo ||
    location ||
    region ||
    sort !== "new" ||
    appliedDraft.areaFrom ||
    appliedDraft.areaTo ||
    appliedDraft.floorFrom ||
    appliedDraft.floorTo ||
    appliedDraft.floorNotFirst ||
    appliedDraft.floorNotLast ||
    appliedDraft.sellerType ||
    appliedDraft.pricePerSqmFrom ||
    appliedDraft.pricePerSqmTo ||
    appliedDraft.checkIn ||
    appliedDraft.checkOut ||
    appliedDraft.guests ||
    appliedDraft.yearFrom ||
    appliedDraft.yearTo ||
    appliedDraft.mileageFrom ||
    appliedDraft.mileageTo ||
    appliedDraft.onlyWithPhotos ||
    appliedDraft.verifiedOnly ||
    Object.keys(activeSpecs).length > 0;

  const activeFilterCount =
    Number(Boolean(search)) +
    Number(Boolean(subcategory)) +
    Number(Boolean(priceFrom || priceTo)) +
    Number(Boolean(location || region)) +
    Number(sort !== "new") +
    Number(Boolean(appliedDraft.areaFrom || appliedDraft.areaTo)) +
    Number(Boolean(appliedDraft.floorFrom || appliedDraft.floorTo)) +
    Number(Boolean(appliedDraft.floorNotFirst || appliedDraft.floorNotLast)) +
    Number(Boolean(appliedDraft.sellerType)) +
    Number(Boolean(appliedDraft.pricePerSqmFrom || appliedDraft.pricePerSqmTo)) +
    Number(Boolean(appliedDraft.checkIn || appliedDraft.checkOut)) +
    Number(Boolean(appliedDraft.guests)) +
    Number(Boolean(appliedDraft.yearFrom || appliedDraft.yearTo)) +
    Number(Boolean(appliedDraft.mileageFrom || appliedDraft.mileageTo)) +
    Number(Boolean(appliedDraft.onlyWithPhotos)) +
    Number(Boolean(appliedDraft.verifiedOnly)) +
    Object.keys(activeSpecs).length;

  const showSubcategoryChips =
    Boolean(effectiveListingCat) && availableSubcategories.length > 0;

  const sortLabels = React.useMemo(
    () => ({
      new: t("filter.sortNew"),
      views_desc: t("filter.sortPopular"),
      price_asc: t("filter.sortPriceAsc"),
      price_desc: t("filter.sortPriceDesc"),
    }),
    [t]
  );

  const updatedLabel = React.useMemo(() => {
    if (!items.length) return "";
    return formatListingTimeAgo(items[0], t);
  }, [items, t]);

  const changeCatalogView = (next) => {
    setCatalogView(next);
    persistCatalogView(next);
  };

  const selectSubcategory = React.useCallback(
    (value) => {
      const dealType = appliedDraft.specs?.["Тип сделки"] || "";
      const nextSpecs = dealType ? { "Тип сделки": dealType } : {};

      applyFilters({
        ...appliedDraft,
        subcategory: value,
        specs: nextSpecs,
        areaFrom: "",
        areaTo: "",
        floorFrom: "",
        floorTo: "",
        floorNotFirst: false,
        floorNotLast: false,
      });
    },
    [appliedDraft, applyFilters]
  );

  const visibleListingIds = React.useMemo(
    () => items.map((ad) => ad._id || ad.id).filter(Boolean),
    [items]
  );

  const totalPages = getTotalPages(total, LISTING_PAGE_SIZE);

  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      const next = new URLSearchParams(searchParams);
      if (totalPages <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(totalPages));
      }
      setSearchParams(next, { replace: true });
    }
  }, [currentPage, totalPages, searchParams, setSearchParams]);

  const goToPage = React.useCallback(
    (page) => {
      const nextPage = Math.max(1, Math.min(page, totalPages || 1));
      const next = new URLSearchParams(searchParams);

      if (nextPage <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(nextPage));
      }

      setSearchParams(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchParams, setSearchParams, totalPages]
  );

  return (
    <div className="container-x py-4 xs:py-6">
      {isRealEstate && (
        <div className="mb-5 space-y-5 lg:hidden">
          <Breadcrumbs items={breadcrumbItems} />

          <RealEstateSearchHero
            compact
            listingPage
            initialCity={draft.location || "Душанбе"}
            initialSubcategory={draft.subcategory || ""}
            initialDeal={draft.specs?.["Тип сделки"] || ""}
            initialRooms={draft.specs?.["Комнат"] || ""}
            initialPriceFrom={draft.priceFrom || ""}
            initialPriceTo={draft.priceTo || ""}
            initialCheckIn={draft.checkIn || ""}
            initialCheckOut={draft.checkOut || ""}
            initialGuests={draft.guests || ""}
            totalCount={total}
          />

          {isDailyListing && (
            <RealEstateDailyFilterBar
              subcategory={effectiveSubcategory}
              priceFrom={appliedDraft.priceFrom}
              priceTo={appliedDraft.priceTo}
              guests={appliedDraft.guests}
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setReMoreFiltersOpen(true)}
              onSubcategoryChange={(value) =>
                applyFilters({ ...appliedDraft, subcategory: value })
              }
              onPricePreset={({ from, to }) =>
                applyFilters({ ...appliedDraft, priceFrom: from, priceTo: to })
              }
              onGuestsChange={(value) =>
                applyFilters({ ...appliedDraft, guests: value })
              }
            />
          )}
        </div>
      )}

      <div className="lg:flex lg:items-start lg:gap-6">
        {isRealEstate ? (
          <aside className="filter-sidebar-anchor hidden lg:block">
            <RealEstateFiltersSidebar
              draft={draft}
              setDraft={setDraft}
              onApply={applyFilters}
              onReset={resetFilters}
              previewTotal={draftIsDirty ? previewTotal : total}
              previewLoading={previewLoading}
              hasActiveFilters={hasActiveFilters}
              categoryTotal={categoryStats.total || total}
              statsBySubcategory={categoryStats.bySubcategory || {}}
              activeCat={activeCat}
              appliedDraft={appliedDraft}
            />
          </aside>
        ) : (
          <aside className="filter-sidebar-anchor hidden lg:block">
            <ListingFiltersSidebar
              draft={draft}
              setDraft={setDraft}
              activeCat={activeCat}
              availableSubcategories={availableSubcategories}
              categoryTotal={categoryStats.total || total}
              statsBySubcategory={categoryStats.bySubcategory || {}}
              onApply={applyFilters}
              onReset={resetFilters}
              previewTotal={draftIsDirty ? previewTotal : total}
              previewLoading={previewLoading}
              hasActiveFilters={hasActiveFilters}
              hideSort
            />
          </aside>
        )}

        <div className="flex-1 min-w-0 space-y-4">
          <div className={isRealEstate ? "hidden lg:block" : undefined}>
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <div className="catalog-head px-1">
            <div className="min-w-0">
              <h1 className="catalog-title">{pageTitle}</h1>

              <p className="catalog-meta">
                {loading
                  ? "…"
                  : [
                      t("listing.count", {
                        count: total.toLocaleString("ru-RU"),
                      }),
                      updatedLabel
                        ? t("listing.updatedAgo", { time: updatedLabel })
                        : "",
                      totalPages > 1
                        ? t("listing.pageOf", {
                            page: currentPage,
                            total: totalPages,
                          }).replace(/^·\s*/, "")
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>

            {isDailyListing &&
              (appliedDraft.checkIn ||
                appliedDraft.checkOut ||
                appliedDraft.guests) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {effectiveLocation && (
                    <span className="chip chip-active text-xs">
                      {effectiveLocation}
                    </span>
                  )}
                  {appliedDraft.checkIn && appliedDraft.checkOut && (
                    <span className="chip chip-active text-xs">
                      {new Date(`${appliedDraft.checkIn}T12:00:00`).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      –{" "}
                      {new Date(`${appliedDraft.checkOut}T12:00:00`).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                      {stayNights > 0 && ` · ${formatNightsLabel(stayNights, t)}`}
                    </span>
                  )}
                  {appliedDraft.guests && (
                    <span className="chip chip-active text-xs">
                      {appliedDraft.guests === "1" ? "1 гость" : `${appliedDraft.guests} гостей`}
                    </span>
                  )}
                </div>
              )}
          </div>

          {!isRealEstate && (
            <CatalogToolbar
              t={t}
              sort={appliedDraft.sort || "new"}
              sortLabels={sortLabels}
              onSortChange={(value) =>
                applyFilters({ ...appliedDraft, sort: value })
              }
              view={catalogView}
              onViewChange={changeCatalogView}
            />
          )}

          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:hidden">
            {isRealEstate ? (
              <>
                <button
                  type="button"
                  onClick={() => setReMoreFiltersOpen(true)}
                  className="mobile-btn border bg-white hover:bg-mist"
                >
                  <SlidersHorizontal size={18} />
                  {t("listing.moreFilters")}
                  {activeFilterCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-sun text-white text-xs grid place-items-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <SaveSearchButton
                  draft={appliedDraft}
                  activeCat={activeCat}
                  compact
                />
              </>
            ) : (
              <>
                <SaveSearchButton
                  draft={appliedDraft}
                  activeCat={activeCat}
                  compact
                />
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="mobile-btn border bg-white hover:bg-mist"
                >
                  <SlidersHorizontal size={18} />
                  {t("listing.filters")}
                  {activeFilterCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-sun text-white text-xs grid place-items-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {showSubcategoryChips && (
          <div className="listing-sticky-chips">
            <SubcategoryChips
              subcategories={availableSubcategories}
              activeSubcategory={effectiveSubcategory}
              onSelect={selectSubcategory}
            />
          </div>
        )}

        {effectiveListingCat === "clothing" && <ClothingQuickFilters />}
        {effectiveListingCat === "food" && <FoodQuickFilters />}
        {effectiveListingCat === "kids" && <KidsQuickFilters />}
        {effectiveListingCat === "travel" && <TravelQuickFilters />}
        {effectiveListingCat === "construction" && <ConstructionQuickFilters />}
        {effectiveListingCat === "business" && <BusinessQuickFilters />}

      {loading && (
        <ListingGridSkeleton
          wide={isRealEstate}
          className={
            isRealEstate || catalogView !== "list" ? "" : "listing-grid--list"
          }
        />
      )}

      {!loading && error && (
        <EmptyState
          icon={PackageSearch}
          title={t("errors.loadListings")}
          description={error}
          actionLabel={t("empty.tryAgain")}
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && !error && items.length === 0 && total === 0 && (
        <EmptyState
          icon={Search}
          title={t("empty.noResults")}
          description={t("empty.noResultsHint")}
          actionLabel={t("empty.resetFilters")}
          onAction={resetFilters}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <AdSlot
            placement="listing_top"
            cat={activeCat}
            className="overflow-hidden rounded-2xl"
          />

          <div
            className={
              isRealEstate
                ? "listing-grid listing-grid--wide"
                : catalogView === "list"
                  ? "listing-grid listing-grid--list"
                  : "listing-grid"
            }
          >
          {feedRows.map((row, idx) => {
            if (row.type === "ad") {
              return <AdFeedCard key={`ad-${idx}`} ad={row.item} />;
            }

            const ad = row.item;
            const id = ad._id || ad.id;

            if (isRealEstate) {
              return (
                <RealEstateListingCard
                  key={id}
                  item={ad}
                  nights={isDailyListing ? stayNights : 0}
                />
              );
            }

            return (
              <ListingCard
                key={id}
                item={ad}
                trackSource="listing"
                layout={catalogView === "list" ? "list" : "grid"}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              />
            );
          })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="pt-4"
          />
        </>
      )}

        </div>
      </div>

      {mobileFiltersOpen && !isRealEstate && (
        <>
          <button
            type="button"
            aria-label={t("a11y.closeFilters")}
            className="sheet-backdrop lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div
            className="sheet lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t("listing.filters")}
          >
            <div className="sheet__handle" aria-hidden="true" />

            <div className="sheet__header">
              <h2 className="text-lg font-semibold text-ink">{t("listing.filters")}</h2>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="btn-ghost p-2"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sheet__body">
              <ListingFiltersPanel
                draft={draft}
                setDraft={setDraft}
                activeCat={activeCat}
                availableSubcategories={availableSubcategories}
                showCategorySelect={!cat}
                onApply={applyFilters}
                onReset={resetFilters}
                previewTotal={draftIsDirty ? previewTotal : total}
                previewLoading={previewLoading}
                hasActiveFilters={hasActiveFilters}
                hideSubcategoryField={showSubcategoryChips}
                compact
                hideActions
              />
            </div>

            <div className="sheet__footer">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-1.5 h-11 px-4 text-sm text-ink-500 hover:text-ink-700 transition"
                >
                  <X size={15} />
                  {t("filter.reset")}
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}

              <button
                type="button"
                onClick={() => applyFilters()}
                className="inline-flex flex-1 justify-center items-center gap-2 h-11 px-5 rounded-xl bg-sun text-white hover:bg-sun-600 transition text-sm font-semibold shadow-sm sm:flex-none sm:min-w-[12rem]"
              >
                <Search size={16} />
                {previewLoading
                  ? t("filter.showLoading")
                  : t("filter.showCount", {
                      count: (draftIsDirty ? previewTotal : total).toLocaleString("ru-RU"),
                    })}
              </button>
            </div>
          </div>
        </>
      )}

      {isRealEstate && (
        <RealEstateMoreFiltersModal
          open={reMoreFiltersOpen}
          onClose={() => setReMoreFiltersOpen(false)}
          dealType={appliedDraft.specs?.["Тип сделки"] || "Купить"}
          city={appliedDraft.location || "Душанбе"}
          subcategory={appliedDraft.subcategory || ""}
          rooms={appliedDraft.specs?.["Комнат"] || ""}
          guests={appliedDraft.guests || ""}
          checkIn={appliedDraft.checkIn || ""}
          checkOut={appliedDraft.checkOut || ""}
          priceFrom={appliedDraft.priceFrom || ""}
          priceTo={appliedDraft.priceTo || ""}
          pricePerSqmFrom={appliedDraft.pricePerSqmFrom || ""}
          pricePerSqmTo={appliedDraft.pricePerSqmTo || ""}
          areaFrom={appliedDraft.areaFrom || ""}
          areaTo={appliedDraft.areaTo || ""}
          floorFrom={appliedDraft.floorFrom || ""}
          floorTo={appliedDraft.floorTo || ""}
          floorNotFirst={appliedDraft.floorNotFirst}
          floorNotLast={appliedDraft.floorNotLast}
          sellerType={appliedDraft.sellerType || ""}
          onlyWithPhotos={appliedDraft.onlyWithPhotos}
          verifiedOnly={appliedDraft.verifiedOnly}
          sort={appliedDraft.sort || "new"}
          specs={appliedDraft.specs || {}}
          onNavigate={(url) => {
            setReMoreFiltersOpen(false);
            nav(url);
          }}
        />
      )}

      {effectiveListingCat && !loading && !error && (
        <SimilarListingsSection
          cat={effectiveListingCat}
          subcategory={effectiveSubcategory}
          excludeIds={visibleListingIds}
        />
      )}
    </div>
  );
}
