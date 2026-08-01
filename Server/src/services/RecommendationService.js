const crypto = require("crypto");
const Listing = require("../models/Listing");
const UserEvent = require("../models/UserEvent");
const cache = require("../lib/recommendation/cache");
const {
  decodeProfileHeader,
  normalizeClientProfile,
  buildProfileFromEvents,
} = require("../lib/recommendation/profile");
const { scoreListing, diversify } = require("../lib/recommendation/scoring");

const DEFAULT_CITY = "Душанбе";
const CACHE_TTL_SEC = 300;

function profileCacheKey(profile, city, limit) {
  const payload = {
    city,
    limit,
    cold: profile.isColdStart,
    cats: profile.categories.slice(0, 3).map((item) => item.cat),
    band: profile.priceBand,
    viewed: [...profile.viewedWithoutContact].slice(0, 10),
    weight: Math.round(profile.totalWeight),
  };

  return `feed:${crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex")}:${city}:${limit}`;
}

async function resolveProfile({
  profileHeader,
  userId,
  sessionId,
  city,
}) {
  const headerProfile = decodeProfileHeader(profileHeader);
  let profile = normalizeClientProfile(headerProfile || {}, city || DEFAULT_CITY);

  if (userId || sessionId) {
    try {
      const events = await UserEvent.findRecentByIdentity({
        userId,
        sessionId,
        days: 7,
      });

      if (events.length) {
        const dbProfile = buildProfileFromEvents(events, profile.city);
        if (dbProfile.totalWeight > profile.totalWeight) {
          profile = dbProfile;
        }
      }
    } catch {
      // table may not exist yet during rollout
    }
  }

  return profile;
}

async function getRecentlyViewedListings(profile, limit = 8) {
  const ids = profile.recentViewedIds.slice(0, limit);
  if (!ids.length) return [];

  const listings = await Listing.findByIds(ids);
  const retargetIds = profile.viewedWithoutContact;

  return listings
    .filter((item) => retargetIds.has(String(item.id || item._id)))
    .slice(0, limit);
}

async function getHomeFeed({
  profileHeader,
  userId,
  sessionId,
  city = DEFAULT_CITY,
  limit = 20,
}) {
  const profile = await resolveProfile({
    profileHeader,
    userId,
    sessionId,
    city,
  });

  const effectiveCity = city || profile.city || DEFAULT_CITY;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 30);
  const cacheKey = profileCacheKey(profile, effectiveCity, safeLimit);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let candidates = [];

  if (profile.isColdStart) {
    candidates = await Listing.findPopularByCity(effectiveCity, safeLimit * 3);
  } else {
    const topCats = profile.categories.slice(0, 3).map((item) => item.cat);

    if (topCats.length) {
      candidates = await Listing.findForRecommendations({
        cats: topCats,
        location: effectiveCity,
        priceFrom: profile.priceBand?.min,
        priceTo: profile.priceBand?.max,
        limit: 200,
      });
    }

    if (candidates.length < safeLimit) {
      const popular = await Listing.findPopularByCity(
        effectiveCity,
        safeLimit * 3
      );
      const seen = new Set(
        candidates.map((item) => String(item.id || item._id))
      );

      for (const item of popular) {
        const id = String(item.id || item._id);
        if (seen.has(id)) continue;
        candidates.push(item);
        seen.add(id);
      }
    }
  }

  const scored = candidates
    .map((item) => ({
      item,
      score: profile.isColdStart
        ? Number(item.views || 0) + (item.vip ? 50 : item.top ? 25 : 0)
        : scoreListing(item, profile),
    }))
    .sort((a, b) => b.score - a.score);

  const forYou = diversify(scored, safeLimit);
  const recentlyViewed = await getRecentlyViewedListings(profile, 8);

  const result = {
    personalized: !profile.isColdStart,
    city: effectiveCity,
    blocks: {
      forYou,
      recentlyViewed,
    },
    profileSummary: {
      topCategories: profile.categories.slice(0, 3).map((item) => item.cat),
      isColdStart: profile.isColdStart,
    },
  };

  cache.set(cacheKey, result, CACHE_TTL_SEC);
  return result;
}

module.exports = {
  getHomeFeed,
  resolveProfile,
};
