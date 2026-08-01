const {
  EVENT_WEIGHT,
  PROFILE_WINDOW_MS,
  COLD_START_THRESHOLD,
  timeDecay,
  parsePrice,
  percentile,
} = require("./weights");

function decodeProfileHeader(raw) {
  if (!raw || typeof raw !== "string") return null;

  const attempts = [
    () => Buffer.from(raw, "base64url").toString("utf8"),
    () => Buffer.from(raw, "base64").toString("utf8"),
  ];

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt());
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // try next encoding
    }
  }

  return null;
}

function normalizeClientProfile(profile = {}, cityFallback = "Душанбе") {
  const now = Date.now();
  const cats = profile.cats && typeof profile.cats === "object" ? profile.cats : {};
  const viewed = Array.isArray(profile.viewed) ? profile.viewed : [];
  const prices = Array.isArray(profile.prices)
    ? profile.prices.map(parsePrice).filter(Boolean)
    : [];
  const contacted =
    profile.contacted && typeof profile.contacted === "object"
      ? profile.contacted
      : {};

  let totalWeight = 0;
  const categoryScores = {};
  const subcategoryScores = {};

  for (const [cat, data] of Object.entries(cats)) {
    const catWeight = Number(data?.w || 0);
    if (catWeight <= 0) continue;

    categoryScores[cat] = (categoryScores[cat] || 0) + catWeight;
    totalWeight += catWeight;

    const subs = data?.subs && typeof data.subs === "object" ? data.subs : {};
    subcategoryScores[cat] = subcategoryScores[cat] || {};

    for (const [sub, subWeightRaw] of Object.entries(subs)) {
      const subWeight = Number(subWeightRaw || 0);
      if (subWeight <= 0) continue;
      subcategoryScores[cat][sub] =
        (subcategoryScores[cat][sub] || 0) + subWeight;
    }
  }

  const categories = Object.entries(categoryScores)
    .map(([cat, weight]) => ({
      cat,
      score: totalWeight > 0 ? weight / totalWeight : 0,
      weight,
    }))
    .sort((a, b) => b.weight - a.weight);

  const recentViewed = viewed
    .filter((item) => now - Number(item?.ts || 0) <= PROFILE_WINDOW_MS)
    .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));

  const viewedWithoutContact = new Set(
    recentViewed
      .filter((item) => {
        const id = String(item?.id || "");
        if (!id) return false;
        if (item.contacted) return false;
        if (contacted[id]) return false;
        return true;
      })
      .map((item) => String(item.id))
  );

  let priceBand = null;
  if (prices.length >= 2) {
    const sorted = [...prices].sort((a, b) => a - b);
    const p25 = percentile(sorted, 0.25);
    const p75 = percentile(sorted, 0.75);
    if (p25 != null && p75 != null) {
      priceBand = {
        min: Math.floor(p25 * 0.7),
        max: Math.ceil(p75 * 1.3),
      };
    }
  } else if (prices.length === 1) {
    priceBand = {
      min: Math.floor(prices[0] * 0.5),
      max: Math.ceil(prices[0] * 1.5),
    };
  }

  const isColdStart = totalWeight < COLD_START_THRESHOLD;

  return {
    city: String(profile.city || cityFallback || "Душанбе").trim() || "Душанбе",
    sessionId: String(profile.sid || profile.sessionId || ""),
    categories,
    subcategoryScores,
    categoryTotals: categoryScores,
    priceBand,
    viewedWithoutContact,
    recentViewedIds: recentViewed.map((item) => String(item.id)).filter(Boolean),
    isColdStart,
    totalWeight,
  };
}

function buildProfileFromEvents(events = [], cityFallback = "Душанбе") {
  const now = Date.now();
  const profile = {
    v: 1,
    city: cityFallback,
    cats: {},
    prices: [],
    viewed: [],
    contacted: {},
  };

  for (const event of events) {
    const ts = new Date(event.created_at || event.ts || now).getTime();
    if (now - ts > PROFILE_WINDOW_MS) continue;

    const type = event.event_type || event.type;
    const weight = (EVENT_WEIGHT[type] || 0) * timeDecay(ts, now);
    if (weight <= 0) continue;

    const cat = event.cat || event.payload?.cat;
    const subcategory = event.subcategory || event.payload?.subcategory;
    const listingId = event.listing_id || event.listingId;
    const price = parsePrice(event.price ?? event.payload?.price);

    if (cat) {
      profile.cats[cat] = profile.cats[cat] || { w: 0, subs: {} };
      profile.cats[cat].w += weight;
      if (subcategory) {
        profile.cats[cat].subs[subcategory] =
          (profile.cats[cat].subs[subcategory] || 0) + weight;
      }
    }

    if (price) profile.prices.push(price);

    if (listingId && (type === "listing_view" || type === "listing_click")) {
      profile.viewed.push({
        id: String(listingId),
        ts,
        contacted: type === "contact_intent",
      });
    }

    if (listingId && type === "contact_intent") {
      profile.contacted[String(listingId)] = ts;
    }

    if (event.city) profile.city = event.city;
  }

  return normalizeClientProfile(profile, cityFallback);
}

module.exports = {
  decodeProfileHeader,
  normalizeClientProfile,
  buildProfileFromEvents,
};
