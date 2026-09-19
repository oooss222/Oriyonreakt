import React from "react";

/**
 * Small numeric badge used on icon-only nav links (header, mobile nav) to
 * show unread/pending counts. `ringed` adds a white ring so the badge stays
 * legible over a light background (e.g. the bottom mobile nav bar).
 */
export default function UnreadBadge({ count, color = "bg-red-500", ringed = false }) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`unread-badge absolute rounded-full ${color} text-white font-bold flex items-center justify-center ${
        ringed
          ? "-top-1 -right-1 min-w-[16px] h-4 px-1 text-[9px] ring-2 ring-white"
          : "top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px]"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
