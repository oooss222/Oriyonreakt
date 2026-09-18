import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATS } from "../../data/listingCategories";
import { REAL_ESTATE_CAT } from "../../data/realEstate";
import { useI18n } from "../../i18n";

function ListRow({ image, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="listing-form-list-row">
      {image ? (
        <span className="listing-form-list-row__media" aria-hidden>
          <img
            src={image}
            alt=""
            loading="lazy"
            draggable={false}
            onError={(event) => {
              event.currentTarget.src = "/img/placeholder.jpg";
            }}
          />
        </span>
      ) : null}
      <span className="listing-form-list-row__label">{label}</span>
      <ChevronRight className="listing-form-list-row__chevron" size={18} />
    </button>
  );
}

export default function ListingCategoryPicker({ onSelect, initialCat = "" }) {
  const { t } = useI18n();
  const [catKey, setCatKey] = React.useState(
    initialCat && initialCat !== REAL_ESTATE_CAT && CATS[initialCat]
      ? initialCat
      : ""
  );
  const [group, setGroup] = React.useState("");

  const categories = React.useMemo(
    () =>
      Object.entries(CATS)
        .filter(([, cat]) => !cat.hiddenFromHome)
        .sort((a, b) => {
          const featured =
            Number(Boolean(b[1].featured)) - Number(Boolean(a[1].featured));
          if (featured) return featured;
          return (a[1].shortTitle || a[1].title).localeCompare(
            b[1].shortTitle || b[1].title,
            "ru"
          );
        }),
    []
  );

  const cat = catKey ? CATS[catKey] : null;
  const groups = cat?.subGroups || [];

  const goRoot = () => {
    setCatKey("");
    setGroup("");
  };

  const pickLeaf = (subcategory) => {
    onSelect?.(catKey, subcategory);
  };

  let title = t("listing.pickCategoryTitle");
  let onBack = null;
  let rows = categories.map(([key, item]) => ({
    key,
    label: item.shortTitle || item.title,
    image: item.img,
    onClick: () => {
      if (
        key === REAL_ESTATE_CAT ||
        (!item.subs?.length && !item.subGroups?.length)
      ) {
        onSelect?.(key, "");
        return;
      }
      setCatKey(key);
      setGroup("");
    },
  }));

  if (cat && groups.length && !group) {
    title = cat.shortTitle || cat.title;
    onBack = goRoot;
    rows = groups.map((row) => ({
      key: row.group,
      label: row.group,
      onClick: () => setGroup(row.group),
    }));
    if (cat.subs?.some((sub) => !String(sub).includes(" — "))) {
      cat.subs
        .filter((sub) => !String(sub).includes(" — "))
        .forEach((sub) => {
          rows.push({
            key: sub,
            label: sub,
            onClick: () => pickLeaf(sub),
          });
        });
    }
  } else if (cat && group) {
    const current = groups.find((row) => row.group === group);
    title = group;
    onBack = () => setGroup("");
    rows = (current?.items || []).map((item) => ({
      key: `${group} — ${item}`,
      label: item,
      onClick: () => pickLeaf(`${group} — ${item}`),
    }));
  } else if (cat) {
    title = cat.shortTitle || cat.title;
    onBack = goRoot;
    rows = (cat.subs || []).map((sub) => ({
      key: sub,
      label: sub.includes(" — ") ? sub.split(" — ").slice(1).join(" — ") : sub,
      onClick: () => pickLeaf(sub),
    }));
  }

  return (
    <section className="listing-form-list">
      <div className="listing-form-list__head">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="listing-form-list__back"
            aria-label={t("listing.wizardBack")}
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span className="listing-form-list__back listing-form-list__back--spacer" />
        )}
        <h2 className="listing-form-list__title">{title}</h2>
      </div>
      <div className="listing-form-list__body">
        {rows.map((row) => (
          <ListRow
            key={row.key}
            image={row.image}
            label={row.label}
            onClick={row.onClick}
          />
        ))}
      </div>
    </section>
  );
}
