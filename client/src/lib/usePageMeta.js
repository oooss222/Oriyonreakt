import React from "react";

export const DEFAULT_TITLE = "Oriyon.store — объявления";
export const DEFAULT_DESCRIPTION =
  "Oriyon.store — маркетплейс объявлений в Таджикистане. Покупка и продажа товаров и услуг.";

function upsertMeta(name, content, attr = "name") {
  if (!content) return;

  let element = document.querySelector(`meta[${attr}="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function usePageMeta({
  title,
  description,
  image,
  url,
  type = "website",
  enabled = true,
} = {}) {
  React.useEffect(() => {
    if (!enabled) return undefined;

    const pageTitle = title ? `${title} — Oriyon.store` : DEFAULT_TITLE;
    const pageDescription = description || DEFAULT_DESCRIPTION;

    document.title = pageTitle;
    upsertMeta("description", pageDescription);
    upsertMeta("og:title", pageTitle, "property");
    upsertMeta("og:description", pageDescription, "property");
    upsertMeta("og:type", type, "property");
    upsertMeta("og:site_name", "Oriyon.store", "property");

    if (image) {
      upsertMeta("og:image", image, "property");
    }

    if (url) {
      upsertMeta("og:url", url, "property");
    }

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta("description", DEFAULT_DESCRIPTION);
      upsertMeta("og:title", DEFAULT_TITLE, "property");
      upsertMeta("og:description", DEFAULT_DESCRIPTION, "property");
      upsertMeta("og:type", "website", "property");
    };
  }, [title, description, image, url, type, enabled]);
}
