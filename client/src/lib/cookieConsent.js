export const CONSENT_KEY = "diyor_cookie_consent";
const LEGACY_CONSENT_KEY = "oriyon_cookie_consent";
export const CONSENT_EVENT = "diyor:cookie-consent-change";

export function readCookieConsent() {
  try {
    const raw = JSON.parse(
      localStorage.getItem(CONSENT_KEY) ||
        localStorage.getItem(LEGACY_CONSENT_KEY) ||
        "null"
    );
    if (raw?.level === "all" || raw?.level === "essential") {
      return raw;
    }
  } catch {
    // ignore parse errors
  }

  return null;
}

export function hasConsentDecision() {
  return Boolean(readCookieConsent());
}

export function hasAnalyticsConsent() {
  return readCookieConsent()?.level === "all";
}

export function saveCookieConsent(level) {
  const payload = {
    level,
    ts: Date.now(),
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));

  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, {
      detail: payload,
    })
  );

  return payload;
}

export function clearAnalyticsData() {
  try {
    localStorage.removeItem("diyor_pref");
    localStorage.removeItem("oriyon_pref");
  } catch {
    // ignore storage errors
  }
}
