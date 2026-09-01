const test = require("node:test");
const assert = require("node:assert/strict");

const { parsePriceValue } = require("../src/lib/priceValue");
const { toPublicListing, PRIVATE_FIELDS } = require("../src/lib/publicListing");
const { isAllowedMediaUrl, isAllowedLinkUrl } = require("../src/lib/mediaUrl");
const { sanitizeAdHtml, assertAdUrls } = require("../src/lib/adContent");
const {
  assertListingFields,
  ListingValidationError,
  TITLE_MAX,
  DESC_MAX,
} = require("../src/lib/listingValidation");
const { normalizeUrl } = require("../src/lib/compareImport/detectPlatform");

test("parsePriceValue reads the formats sellers actually type", () => {
  assert.equal(parsePriceValue("160 000"), 160000);
  assert.equal(parsePriceValue("1 200 сом"), 1200);
  assert.equal(parsePriceValue("1,5"), 1.5);
  assert.equal(parsePriceValue("0"), 0);
});

test("parsePriceValue returns null instead of throwing on bad input", () => {
  // A SQL cast would abort the whole insert for these.
  assert.equal(parsePriceValue("160.000.50"), null);
  assert.equal(parsePriceValue("абв"), null);
  assert.equal(parsePriceValue(""), null);
  assert.equal(parsePriceValue(null), null);
  assert.equal(parsePriceValue(undefined), null);
});

test("toPublicListing removes moderation bookkeeping but keeps the listing", () => {
  const listing = {
    id: "1",
    title: "Nokia",
    price: "500",
    status: "approved",
    owner: "u1",
    rejectionReason: "spam",
    moderatedBy: "mod-1",
    moderationFlags: ["dup"],
    previousSnapshot: { title: "old" },
    appealText: "please",
  };

  const publicView = toPublicListing(listing);

  for (const field of PRIVATE_FIELDS) {
    assert.equal(field in publicView, false, `${field} must not be exposed`);
  }

  assert.equal(publicView.title, "Nokia");
  assert.equal(publicView.status, "approved");
  assert.equal(publicView.owner, "u1");
  // The original must not be mutated: /listings/mine reuses these objects.
  assert.equal(listing.rejectionReason, "spam");
});

test("media URLs are limited to our own upload pipeline", () => {
  process.env.CLOUDINARY_CLOUD_NAME = "oriyoncloud";

  assert.equal(isAllowedMediaUrl("/uploads/a.webp"), true);
  assert.equal(
    isAllowedMediaUrl("https://res.cloudinary.com/oriyoncloud/image/upload/x.webp"),
    true
  );
  assert.equal(
    isAllowedMediaUrl("https://res.cloudinary.com/someoneelse/image/upload/x.webp"),
    false
  );
  assert.equal(isAllowedMediaUrl("https://evil.example.com/x.png"), false);
  assert.equal(isAllowedMediaUrl("/uploads/../../etc/passwd"), false);
  assert.equal(isAllowedMediaUrl("javascript:alert(1)"), false);
  assert.equal(isAllowedMediaUrl(""), false);
});

test("link URLs must be https", () => {
  assert.equal(isAllowedLinkUrl("https://example.tj"), true);
  assert.equal(isAllowedLinkUrl("http://example.tj"), false);
  assert.equal(isAllowedLinkUrl("javascript:alert(1)"), false);
});

test("ad HTML sanitizer strips script and unsafe URLs", () => {
  assert.equal(sanitizeAdHtml("<script>steal()</script><b>Скидка</b>"), "<b>Скидка</b>");
  assert.equal(
    sanitizeAdHtml('<img src="x" onerror="alert(1)">').includes("onerror"),
    false
  );
  assert.equal(
    sanitizeAdHtml('<a href="javascript:alert(1)">click</a>').includes("javascript:"),
    false
  );
  assert.ok(sanitizeAdHtml('<a href="https://ok.tj">click</a>').includes("https://ok.tj"));
  assert.equal(sanitizeAdHtml(""), "");
});

test("ad URLs are rejected unless https", () => {
  assert.throws(() => assertAdUrls({ linkUrl: "http://ok.tj" }), /https/);
  assert.throws(() => assertAdUrls({ imageUrl: "javascript:alert(1)" }), /https/);
  assert.doesNotThrow(() => assertAdUrls({ linkUrl: "https://ok.tj" }));
  assert.doesNotThrow(() => assertAdUrls({}));
});

test("listing validation mirrors the limits the form enforces", () => {
  process.env.CLOUDINARY_CLOUD_NAME = "oriyoncloud";

  assert.doesNotThrow(() =>
    assertListingFields({
      title: "Nokia 3310",
      description: "ok",
      price: "500",
      cat: "phones",
      images: [{ url: "/uploads/a.webp" }],
      specs: [{ name: "Память", value: "128 GB" }],
    })
  );

  assert.throws(
    () => assertListingFields({ title: "a".repeat(TITLE_MAX + 1) }),
    ListingValidationError
  );
  assert.throws(
    () => assertListingFields({ description: "a".repeat(DESC_MAX + 1) }),
    ListingValidationError
  );
  assert.throws(() => assertListingFields({ cat: "hacked" }), ListingValidationError);
  assert.throws(
    () => assertListingFields({ images: [{ url: "https://evil.example.com/x.png" }] }),
    ListingValidationError
  );
  assert.throws(
    () => assertListingFields({ price: "1".repeat(20) }),
    ListingValidationError
  );
});

test("compare import only accepts the supported marketplaces", () => {
  assert.ok(normalizeUrl("https://somon.tj/adv/123"));
  assert.ok(normalizeUrl("paydo.tj/item/5"));
  assert.equal(normalizeUrl("https://evil.example.com/adv/1"), null);
  assert.equal(normalizeUrl("http://169.254.169.254/latest/meta-data"), null);
  assert.equal(normalizeUrl("file:///etc/passwd"), null);
  assert.equal(normalizeUrl(""), null);
});

const {
  CATEGORY_PHOTO_LIMITS,
  getListingPhotoLimit,
} = require("../src/lib/listingPhotoLimits");
const sharedPhotoLimits = require("../../shared/listingPhotoLimits.json");
const { VIP_PLANS, getPromotionPlan } = require("../src/lib/promotionPlans");
const sharedPlans = require("../../shared/promotionPlans.json");

test("listing photo limits are shared with the client", () => {
  assert.deepEqual(CATEGORY_PHOTO_LIMITS, sharedPhotoLimits.CATEGORY_PHOTO_LIMITS);
  assert.equal(getListingPhotoLimit("realestate"), 8);
  assert.equal(getListingPhotoLimit("unknown-cat"), 6);
});

test("promotion plans are shared with the client", () => {
  assert.deepEqual(VIP_PLANS, sharedPlans.VIP_PLANS);
  assert.equal(getPromotionPlan("vip", 7)?.price, 15);
  assert.equal(getPromotionPlan("top", 30)?.price, 40);
  assert.equal(getPromotionPlan("vip", 99), null);
});
