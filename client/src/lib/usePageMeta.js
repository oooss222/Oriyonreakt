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

function upsertLink(rel, href) {
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function upsertJsonLd(id, payload) {
  let element = document.getElementById(id);

  if (!payload) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
}

export function usePageMeta({
  title,
  description,
  image,
  url,
  type = "website",
  jsonLd = null,
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
    upsertMeta("twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("twitter:title", pageTitle);
    upsertMeta("twitter:description", pageDescription);

    if (image) {
      upsertMeta("og:image", image, "property");
      upsertMeta("twitter:image", image);
    }

    if (url) {
      upsertMeta("og:url", url, "property");
      upsertLink("canonical", url);
    }

    upsertJsonLd("page-json-ld", jsonLd);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta("description", DEFAULT_DESCRIPTION);
      upsertMeta("og:title", DEFAULT_TITLE, "property");
      upsertMeta("og:description", DEFAULT_DESCRIPTION, "property");
      upsertMeta("og:type", "website", "property");
      upsertJsonLd("page-json-ld", null);
    };
  }, [title, description, image, url, type, jsonLd, enabled]);
}
