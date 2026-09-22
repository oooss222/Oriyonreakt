export function pickAd(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return null;
  }

  if (items.length === 1) {
    return items[0];
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function buildFeedWithAds(items = [], ad = null, interval = 8) {
  const listings = items.map((item) => ({ type: "listing", item }));

  if (!ad || interval <= 0) {
    return listings;
  }

  const promoted = [];
  const regular = [];

  items.forEach((item) => {
    if (item?.vip || item?.top) promoted.push(item);
    else regular.push(item);
  });

  const result = promoted.map((item) => ({ type: "listing", item }));

  regular.forEach((item, index) => {
    result.push({ type: "listing", item });

    if ((index + 1) % interval === 0) {
      result.push({ type: "ad", item: ad });
    }
  });

  return result;
}

export function formatAdCtr(clicks = 0, impressions = 0) {
  if (!impressions) {
    return "0%";
  }

  return `${((Number(clicks) / Number(impressions)) * 100).toFixed(2)}%`;
}
