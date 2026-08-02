import { useMatches } from "react-router-dom";

const DEFAULT_LAYOUT = {
  showFooter: true,
  showMobileNav: true,
  showCompareBar: true,
  showCookieConsent: true,
  headerVariant: "full",
  animateMain: true,
  mobileBottomPadding: true,
};

export function useLayoutConfig() {
  const matches = useMatches();

  return matches.reduce((acc, match) => {
    const layout = match.handle?.layout;
    if (!layout) return acc;
    return { ...acc, ...layout };
  }, { ...DEFAULT_LAYOUT });
}
