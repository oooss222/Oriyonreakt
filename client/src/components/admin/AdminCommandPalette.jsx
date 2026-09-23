import React from "react";
import { Search } from "lucide-react";
import { api } from "../../lib/api";
import { canAccessAdmin, getId } from "../../lib/adminUtils";

export default function AdminCommandPalette({
  open,
  onClose,
  sections,
  token,
  role,
  t,
  onOpen,
}) {
  const inputRef = React.useRef(null);
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState([]);
  const [listings, setListings] = React.useState([]);
  const [campaigns, setCampaigns] = React.useState([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setUsers([]);
    setListings([]);
    setCampaigns([]);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return undefined;
    const needle = query.trim();
    if (needle.length < 2 || !canAccessAdmin(role)) {
      setUsers([]);
      setListings([]);
      setCampaigns([]);
      return undefined;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const [userData, listingData, adData] = await Promise.all([
          api.adminUsers(token, { q: needle, limit: 5 }).catch(() => ({ items: [] })),
          api.adminListings(token, { q: needle, limit: 5 }).catch(() => []),
          api.adminAds(token).catch(() => []),
        ]);
        if (!alive) return;
        setUsers(Array.isArray(userData?.items) ? userData.items.slice(0, 5) : []);
        setListings(Array.isArray(listingData) ? listingData.slice(0, 5) : []);
        const ads = Array.isArray(adData) ? adData : [];
        const lowered = needle.toLowerCase();
        setCampaigns(
          ads
            .filter((item) =>
              `${item.title || ""} ${item.advertiser || ""} ${getId(item) || ""}`
                .toLowerCase()
                .includes(lowered)
            )
            .slice(0, 5)
        );
      } finally {
        if (alive) setBusy(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, query, role, token]);

  if (!open) return null;

  const lowered = query.trim().toLowerCase();
  const sectionHits = sections.filter((item) =>
    t(item.labelKey).toLowerCase().includes(lowered)
  );

  return (
    <div className="admin-palette" role="presentation" onMouseDown={onClose}>
      <div
        className="admin-palette__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("admin.shell.searchLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <label className="admin-palette__search">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.shell.searchPlaceholder")}
            aria-label={t("admin.shell.searchLabel")}
          />
        </label>
        <div className="admin-palette__results">
          <ResultGroup title={t("admin.shell.groupSections")}>
            {sectionHits.length === 0 ? (
              <Empty>{t("admin.shell.empty")}</Empty>
            ) : (
              sectionHits.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="admin-palette__hit"
                  onClick={() => onOpen(item.id)}
                >
                  {t(item.labelKey)}
                </button>
              ))
            )}
          </ResultGroup>
          {canAccessAdmin(role) && lowered.length >= 2 && (
            <>
              <ResultGroup title={t("admin.sections.users")}>
                {users.map((user) => (
                  <button
                    key={getId(user)}
                    type="button"
                    className="admin-palette__hit"
                    onClick={() => onOpen("users", { q: user.name || user.phone || user.email || getId(user) })}
                  >
                    <strong>{user.name || user.phone || user.email || getId(user)}</strong>
                    <span>{user.phone || user.email || getId(user)}</span>
                  </button>
                ))}
                {!busy && users.length === 0 && <Empty>{t("admin.shell.empty")}</Empty>}
              </ResultGroup>
              <ResultGroup title={t("admin.sections.listings")}>
                {listings.map((item) => (
                  <button
                    key={getId(item)}
                    type="button"
                    className="admin-palette__hit"
                    onClick={() => onOpen("listings", { q: item.title || getId(item) })}
                  >
                    <strong>{item.title || t("admin.listings.untitled")}</strong>
                    <span>{getId(item)}</span>
                  </button>
                ))}
                {!busy && listings.length === 0 && <Empty>{t("admin.shell.empty")}</Empty>}
              </ResultGroup>
              <ResultGroup title={t("admin.sections.ads")}>
                {campaigns.map((item) => (
                  <button
                    key={getId(item)}
                    type="button"
                    className="admin-palette__hit"
                    onClick={() => onOpen("ads")}
                  >
                    <strong>{item.title || getId(item)}</strong>
                    <span>{item.advertiser || item.placement}</span>
                  </button>
                ))}
                {!busy && campaigns.length === 0 && <Empty>{t("admin.shell.empty")}</Empty>}
              </ResultGroup>
            </>
          )}
          {busy && <p className="admin-palette__busy">{t("admin.shell.searching")}</p>}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ title, children }) {
  return (
    <section className="admin-palette__group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="admin-palette__empty">{children}</p>;
}
