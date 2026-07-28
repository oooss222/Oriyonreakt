import React from "react";

const STORAGE_KEY = "oriyon_viewed_listings";
const MAX_ITEMS = 500;
const VIEW_EVENT = "listing-viewed";

function readViewedIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

export function isListingViewed(id) {
  if (!id) return false;

  return readViewedIds().includes(String(id));
}

export function markListingViewed(id) {
  if (!id) return;

  const value = String(id);
  const ids = readViewedIds().filter((item) => item !== value);

  ids.push(value);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(ids.slice(-MAX_ITEMS))
    );
  } catch {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(VIEW_EVENT, {
      detail: { id: value },
    })
  );
}

export function wasViewRecorded(id) {
  if (!id) return false;

  return sessionStorage.getItem(`listing_view_recorded_${id}`) === "1";
}

export function markViewRecorded(id) {
  if (!id) return;

  sessionStorage.setItem(`listing_view_recorded_${String(id)}`, "1");
}

export function useListingViewed(id) {
  const [viewed, setViewed] = React.useState(() => isListingViewed(id));

  React.useEffect(() => {
    setViewed(isListingViewed(id));

    const handleViewed = (event) => {
      if (String(event.detail?.id) === String(id)) {
        setViewed(true);
      }
    };

    window.addEventListener(VIEW_EVENT, handleViewed);

    return () => {
      window.removeEventListener(VIEW_EVENT, handleViewed);
    };
  }, [id]);

  return viewed;
}
