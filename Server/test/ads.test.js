const test = require("node:test");
const assert = require("node:assert/strict");

const { pool } = require("../src/db");
const {
  isBotUserAgent,
  versionAtLeast,
  weightedPick,
  categoryAllowed,
  keywordAllowed,
  platformAllowed,
  isRenderableAdImage,
  isSafeAdDestination,
} = require("../src/lib/adDelivery");

test.after(async () => {
  await pool.end();
});

test("versionAtLeast compares dotted app versions", () => {
  assert.equal(versionAtLeast("1.2.0", ""), true);
  assert.equal(versionAtLeast("1.2.0", "1.2.0"), true);
  assert.equal(versionAtLeast("1.10.0", "1.2.0"), true);
  assert.equal(versionAtLeast("1.0.0", "1.2.0"), false);
});

test("weightedPick stays inside the highest priority", () => {
  const picked = weightedPick([
    { key: "low", priority: 1, weight: 100 },
    { key: "high", priority: 5, weight: 1 },
  ]);

  assert.equal(picked.key, "high");
});

test("category and keyword rules treat an empty list as everyone", () => {
  assert.equal(categoryAllowed({ categories: [], cat: "" }, ""), true);
  assert.equal(categoryAllowed({ categories: ["phones"], cat: "" }, ""), false);
  assert.equal(categoryAllowed({ categories: ["phones"], cat: "" }, "phones"), true);
  assert.equal(keywordAllowed([], "toyota", "search_top"), true);
  assert.equal(keywordAllowed(["toyota"], "", "search_top"), false);
  assert.equal(keywordAllowed(["toyota"], "Toyota Camry", "search_top"), true);
  assert.equal(keywordAllowed(["toyota"], "", "home_top"), true);
});

test("platform app matches ios and android", () => {
  assert.equal(platformAllowed(["app"], "ios"), true);
  assert.equal(platformAllowed(["web"], "android"), false);
  assert.equal(platformAllowed(["site"], "web"), true);
});

test("bots are ignored and ad destinations stay on https, site paths, or the app scheme", () => {
  assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBotUserAgent("Mozilla/5.0"), false);
  assert.equal(isRenderableAdImage("/ads/demo-banner.svg"), true);
  assert.equal(isRenderableAdImage("javascript:alert(1)"), false);
  assert.equal(isSafeAdDestination("https://diyor.tj/c/phones"), true);
  assert.equal(isSafeAdDestination("/c/phones"), true);
  assert.equal(isSafeAdDestination("diyor://listing/1"), true);
  assert.equal(isSafeAdDestination("javascript:alert(1)"), false);
});
