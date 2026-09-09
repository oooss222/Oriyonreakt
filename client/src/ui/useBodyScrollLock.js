import React from "react";

let lockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";

/**
 * Freezes the page behind an overlay.
 *
 * Nested overlays are reference counted, and the scrollbar width is paid back
 * as padding so the layout underneath does not jump when it disappears.
 */
export function useBodyScrollLock(active) {
  React.useEffect(() => {
    if (!active) return undefined;

    if (lockCount === 0) {
      const { body } = document;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;

      previousOverflow = body.style.overflow;
      previousPaddingRight = body.style.paddingRight;
      body.style.overflow = "hidden";

      if (scrollbar > 0) {
        body.style.paddingRight = `${scrollbar}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      }
    };
  }, [active]);
}

export default useBodyScrollLock;
