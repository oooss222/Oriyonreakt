import React from "react";

const XL_MEDIA = "(min-width: 1280px)";

function getStickTop(fallback = 124) {
  if (typeof document === "undefined") return fallback;

  const header = document.querySelector("header");
  const breadcrumbs = document.querySelector("[data-ad-breadcrumbs]");

  let top = header?.getBoundingClientRect().height ?? 72;

  if (breadcrumbs) {
    const crumbsRect = breadcrumbs.getBoundingClientRect();
    if (crumbsRect.top <= top + 1) {
      top += crumbsRect.height;
    }
  }

  return top + 12;
}

export function useStickyAside() {
  const containerRef = React.useRef(null);
  const sidebarRef = React.useRef(null);
  const [style, setStyle] = React.useState(null);

  React.useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const sidebar = sidebarRef.current;

      if (!container || !sidebar) return;

      if (!window.matchMedia(XL_MEDIA).matches) {
        setStyle(null);
        return;
      }

      const stickTop = getStickTop();
      const containerRect = container.getBoundingClientRect();
      const sidebarHeight = sidebar.offsetHeight;
      const containerTop = window.scrollY + containerRect.top;
      const containerBottom = containerTop + container.offsetHeight;

      if (containerRect.top >= stickTop) {
        setStyle(null);
        return;
      }

      if (window.scrollY + stickTop + sidebarHeight >= containerBottom) {
        setStyle({
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 10,
        });
        return;
      }

      setStyle({
        position: "fixed",
        top: stickTop,
        left: containerRect.left,
        width: containerRect.width,
        zIndex: 10,
      });
    };

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;

    if (resizeObserver) {
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (sidebarRef.current) resizeObserver.observe(sidebarRef.current);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, []);

  return { containerRef, sidebarRef, style };
}
