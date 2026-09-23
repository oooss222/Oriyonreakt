const TONES = {
  approved: "ok",
  active: "ok",
  completed: "ok",
  operational: "ok",
  pending: "warn",
  sold: "neutral",
  archived: "neutral",
  inactive: "neutral",
  rejected: "bad",
  blocked: "bad",
  failed: "bad",
  cancelled: "neutral",
};

export default function StatusBadge({ status = "", children }) {
  const tone = TONES[String(status || "").toLowerCase()] || "neutral";

  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
}
