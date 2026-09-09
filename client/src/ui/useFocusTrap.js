import React from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container) {
  if (!container) return [];

  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (node) => node.offsetParent !== null || node === document.activeElement
  );
}

/**
 * Keeps Tab inside `ref` while `active`, moves focus in on open and restores it
 * to whatever was focused before on close.
 */
export function useFocusTrap(ref, active) {
  React.useEffect(() => {
    if (!active) return undefined;

    const container = ref.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;
    const initial = container.querySelector("[data-autofocus]") || getFocusable(container)[0];

    // Falling back to the container needs a tabindex, which callers set.
    (initial || container).focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key !== "Tab") return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("keydown", onKeyDown);

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [ref, active]);
}

export default useFocusTrap;
