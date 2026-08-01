const { parsePrice } = require("./weights");

function freshnessScore(createdAt) {
  const ts = Date.parse(createdAt || "");
  if (Number.isNaN(ts)) return 0.3;

  const days = (Date.now() - ts) / (24 * 60 * 60 * 1000);
  if (days <= 1) return 1;
  if (days <= 3) return 0.85;
  if (days <= 7) return 0.7;
  if (days <= 14) return 0.55;
  if (days <= 30) return 0.4;
  return 0.25;
}

function priceBandFit(priceRaw, band) {
  if (!band) return 0.5;

  const price = parsePrice(priceRaw);
  if (price == null) return 0.5;
  if (price >= band.min && price <= band.max) return 1;

  const distance =
    price < band.min ? band.min - price : price - band.max;
  const span = Math.max(band.max - band.min, band.min, 1);

  return Math.max(0, 1 - distance / span);
}

function scoreListing(listing, profile) {
  const listingId = String(listing.id || listing._id || "");
  const cat = listing.cat || "";
  const subcategory = listing.subcategory || "";

  const catEntry = profile.categories.find((item) => item.cat === cat);
  const catScore = catEntry?.score || 0;

  const subWeight = profile.subcategoryScores[cat]?.[subcategory] || 0;
  const catTotal = profile.categoryTotals[cat] || 1;
  const subScore = subWeight / catTotal;

  const priceFit = priceBandFit(listing.price, profile.priceBand);
  const freshness = freshnessScore(listing.createdAt || listing.created_at);
  const popularity = Math.min(1, Math.log1p(Number(listing.views || 0)) / 8);

  const now = Date.now();
  const vipUntil = listing.vipUntil || listing.vip_until;
  const topUntil = listing.topUntil || listing.top_until;
  const vip =
    vipUntil && !Number.isNaN(Date.parse(vipUntil))
      ? Date.parse(vipUntil) > now
      : Boolean(listing.vip);
  const top =
    topUntil && !Number.isNaN(Date.parse(topUntil))
      ? Date.parse(topUntil) > now
      : Boolean(listing.top);

  const promoBoost = vip ? 0.15 : top ? 0.08 : 0;
  const retargetBoost = profile.viewedWithoutContact.has(listingId) ? 0.25 : 0;

  return (
    0.35 * catScore +
    0.2 * subScore +
    0.15 * priceFit +
    0.15 * freshness +
    0.1 * popularity +
    promoBoost +
    retargetBoost
  );
}

function diversify(scored, limit = 20) {
  const result = [];
  const seen = new Set();
  const catCount = {};
  const maxPerCat = Math.max(2, Math.ceil(limit * 0.45));

  for (const entry of scored) {
    const id = String(entry.item.id || entry.item._id || "");
    if (!id || seen.has(id)) continue;

    const cat = entry.item.cat || "other";
    if ((catCount[cat] || 0) >= maxPerCat) continue;

    result.push(entry.item);
    seen.add(id);
    catCount[cat] = (catCount[cat] || 0) + 1;

    if (result.length >= limit) return result;
  }

  for (const entry of scored) {
    const id = String(entry.item.id || entry.item._id || "");
    if (!id || seen.has(id)) continue;

    result.push(entry.item);
    seen.add(id);

    if (result.length >= limit) break;
  }

  return result;
}

module.exports = {
  scoreListing,
  diversify,
};
