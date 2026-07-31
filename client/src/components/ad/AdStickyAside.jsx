import React from "react";
import { useStickyAside } from "./useStickyAside";

export default function AdStickyAside({ children, className = "" }) {
  const { containerRef, sidebarRef, style } = useStickyAside();

  return (
    <aside ref={containerRef} className={`relative ${className}`}>
      <div ref={sidebarRef} style={style || undefined}>
        {children}
      </div>
    </aside>
  );
}
