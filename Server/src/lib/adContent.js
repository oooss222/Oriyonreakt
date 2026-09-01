const sanitizeHtml = require("sanitize-html");
const { isAllowedLinkUrl } = require("./mediaUrl");

// Ad HTML is authored in the admin panel and injected into every visitor's page,
// so a compromised admin account must not be able to ship script.
const AD_HTML_OPTIONS = {
  allowedTags: [
    "a",
    "b",
    "br",
    "div",
    "em",
    "figure",
    "figcaption",
    "h3",
    "h4",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "picture",
    "small",
    "source",
    "span",
    "strong",
    "u",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "srcset", "alt", "width", "height", "loading"],
    source: ["srcset", "type", "media"],
    "*": ["class", "style"],
  },
  allowedSchemes: ["https"],
  allowedSchemesByTag: {
    img: ["https", "data"],
  },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\(/],
      "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\(/],
      "text-align": [/^left$|^right$|^center$/],
      "font-size": [/^\d+(?:px|em|rem|%)$/],
      "font-weight": [/^\d{3}$|^bold$|^normal$/],
      width: [/^\d+(?:px|em|rem|%)$/],
      height: [/^\d+(?:px|em|rem|%)$/],
      margin: [/^[\d\s.a-z%]+$/i],
      padding: [/^[\d\s.a-z%]+$/i],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer sponsored",
    }),
  },
};

function sanitizeAdHtml(rawHtml) {
  const value = String(rawHtml || "").trim();

  if (!value) return "";

  return sanitizeHtml(value, AD_HTML_OPTIONS);
}

class AdValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "AdValidationError";
    this.status = 400;
    this.field = field;
  }
}

function assertAdUrls({ linkUrl, imageUrl } = {}) {
  if (linkUrl && !isAllowedLinkUrl(linkUrl)) {
    throw new AdValidationError("Link URL must be https", "linkUrl");
  }

  if (imageUrl && !isAllowedLinkUrl(imageUrl)) {
    throw new AdValidationError("Image URL must be https", "imageUrl");
  }
}

module.exports = {
  sanitizeAdHtml,
  assertAdUrls,
  AdValidationError,
};
