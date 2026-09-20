import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ImageOff, Loader2, RefreshCw } from "lucide-react";
import CompareSourceBadge from "./CompareSourceBadge";
import { getCompareItemKey, isExternalCompareItem } from "../lib/compareResolve";
import { getRowDiffHighlights } from "../lib/compareDiff";
import { getSpecValue } from "../lib/realEstate";
import { getListingThumb } from "../lib/media";
import { formatPrice } from "../lib/format";
import { getPlatformLabel } from "../lib/comparePlatforms";

function displayValue(value, t) {
  const text = String(value ?? "").trim();
  if (!text || text === "—") return t("compare.notSpecified");
  return text;
}

function listingCondition(item) {
  return getSpecValue(item?.specs, "Состояние") || getSpecValue(item?.specs, "Ремонт") || "";
}

function listingPlace(item) {
  return [item?.location, item?.realEstateSummary?.district].filter(Boolean).join(" · ");
}

function ComparePhoto({ item, className = "" }) {
  const raw = getListingThumb(item, { width: 320, allowEmpty: true }) || "";
  const [src, setSrc] = React.useState(raw);
  const title = item?.title || "";

  React.useEffect(() => {
    setSrc(raw);
  }, [raw]);

  return (
    <div className={`compare-card__media ${className}`}>
      {src ? (
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setSrc("")}
        />
      ) : (
        <span className="compare-card__fallback" aria-hidden>
          <ImageOff size={22} />
        </span>
      )}
    </div>
  );
}

function CompareListingCard({ item, onRemove, onRefresh, refreshing, t }) {
  const itemKey = getCompareItemKey(item);
  const external = isExternalCompareItem(item);
  const place = listingPlace(item);
  const condition = listingCondition(item);
  const href = external ? item._compareUrl : `/ad/${itemKey}`;
  const photo = <ComparePhoto item={item} />;

  return (
    <article className="compare-card">
      <button
        type="button"
        onClick={() => onRemove(itemKey)}
        className="compare-card__remove"
      >
        {t("compare.remove")}
      </button>

      {external && href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="compare-card__photo">
          {photo}
        </a>
      ) : (
        <Link to={href} className="compare-card__photo">
          {photo}
        </Link>
      )}

      <div className="compare-card__body">
        <div className="compare-card__price">
          {formatPrice(item.price, { emptyLabel: t("compare.notSpecified") })}
        </div>
        <h3 className="compare-card__title">{item.title || t("listing.noTitle")}</h3>
        <CompareSourceBadge item={item} />
        <div className="compare-card__meta">
          <span>{place || t("compare.notSpecified")}</span>
          {condition ? <span>{condition}</span> : null}
        </div>

        {external && item._compareUrl ? (
          <div className="compare-card__actions">
            <a
              href={item._compareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="compare-card__open"
            >
              {t("compare.openOn", { platform: getPlatformLabel(item._compareSource) })}
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={() => onRefresh?.(item)}
              disabled={refreshing}
              className="compare-card__refresh"
              aria-label={t("compare.refresh")}
              title={t("compare.refresh")}
            >
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {t("compare.refresh")}
            </button>
          </div>
        ) : (
          <Link to={`/ad/${itemKey}`} className="compare-card__open">
            {t("compare.openListing")}
          </Link>
        )}
      </div>
    </article>
  );
}

function ComparePin({ item, t }) {
  const itemKey = getCompareItemKey(item);
  const external = isExternalCompareItem(item);
  const href = external ? item._compareUrl : `/ad/${itemKey}`;

  const title = (
    <span className="compare-pin__title">{item.title || t("listing.noTitle")}</span>
  );

  return (
    <div className="compare-pin">
      <ComparePhoto item={item} className="compare-pin__media" />
      <div className="min-w-0">
        {external && href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-sun">
            {title}
          </a>
        ) : (
          <Link to={href} className="hover:text-sun">
            {title}
          </Link>
        )}
        <div className="compare-pin__price">
          {formatPrice(item.price, { emptyLabel: t("compare.notSpecified") })}
        </div>
      </div>
    </div>
  );
}

function CompareFieldRow({ field, items, differingKeys, diffsOnly, t }) {
  const values = items.map((item) => displayValue(field.get(item), t));
  const marks = getRowDiffHighlights(items, field);
  const differs = differingKeys.has(field.key);
  const isPrice = field.key === "price";
  const sameMuted = !diffsOnly && items.length > 1 && !differs;

  return (
    <>
      <div
        className={`compare-stage__label ${differs && !isPrice ? "is-diff" : ""}`}
      >
        {field.label}
      </div>
      {values.map((value, index) => (
        <div
          key={`${field.key}-${index}`}
          className={`compare-stage__value ${isPrice ? "is-price" : ""} ${
            differs && !isPrice ? "is-diff" : ""
          } ${sameMuted ? "is-same" : ""}`}
        >
          <span className={differs && !isPrice ? "font-semibold" : ""}>
            {isPrice ? values[index] : value}
          </span>
          {marks[index]?.differs && differs && !isPrice ? (
            <span className="sr-only">{t("compare.diffsOnly")}</span>
          ) : null}
        </div>
      ))}
    </>
  );
}

function CompareSection({ label }) {
  return <div className="compare-stage__section">{label}</div>;
}

function CompareBoardControls({ diffsOnly, onToggleDiffs, onReset, catalogPath, t }) {
  return (
    <div className="compare-stage__controls">
      <button
        type="button"
        role="switch"
        aria-checked={diffsOnly}
        onClick={onToggleDiffs}
        className="compare-switch"
      >
        <span className="compare-switch__track" aria-hidden>
          <span className="compare-switch__thumb" />
        </span>
        {t("compare.diffsOnly")}
      </button>
      {onReset && (
        <button type="button" onClick={onReset} className="compare-reset">
          {t("compare.reset")}
        </button>
      )}
      {catalogPath && (
        <Link to={catalogPath} className="compare-stage__more">
          {t("compare.findMoreOriyon")}
        </Link>
      )}
    </div>
  );
}

export function CompareStageSkeleton({ count = 2 }) {
  const columns = Math.max(1, Math.min(4, count));

  return (
    <div className="compare-stage" aria-hidden>
      <div className="compare-stage__scroll">
        <div
          className="compare-stage__grid"
          style={{
            gridTemplateColumns: `var(--compare-label) repeat(${columns}, var(--compare-col))`,
          }}
        >
          <div className="compare-stage__label compare-stage__label--head">
            <span className="skeleton h-4 w-24 rounded" />
          </div>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="compare-card">
              <div className="compare-card__media skeleton" />
              <div className="compare-card__body space-y-2">
                <div className="skeleton h-5 w-20 rounded" />
                <div className="skeleton h-4 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompareStage({
  items = [],
  fieldGroups,
  trustFields = [],
  diffsOnly = false,
  differingKeys,
  onToggleDiffs,
  onReset,
  onRemove,
  onRefresh,
  refreshingKey = "",
  catalogPath = "",
  t,
}) {
  const columns = items.length;

  return (
    <section className="compare-stage" aria-label={t("compare.title")}>
      <div className="compare-stage__scroll">
        <div
          className="compare-stage__grid"
          style={{
            gridTemplateColumns: `var(--compare-label) repeat(${columns}, var(--compare-col))`,
          }}
        >
          <div className="compare-stage__label compare-stage__label--head">
            <CompareBoardControls
              diffsOnly={diffsOnly}
              onToggleDiffs={onToggleDiffs}
              onReset={onReset}
              catalogPath={catalogPath}
              t={t}
            />
          </div>
          {items.map((item) => (
            <CompareListingCard
              key={getCompareItemKey(item)}
              item={item}
              onRemove={onRemove}
              onRefresh={onRefresh}
              refreshing={refreshingKey === getCompareItemKey(item)}
              t={t}
            />
          ))}

          <div className="compare-stage__label compare-stage__pin-label">
            {t("compare.parameter")}
          </div>
          {items.map((item) => (
            <ComparePin key={`pin-${getCompareItemKey(item)}`} item={item} t={t} />
          ))}

          {fieldGroups.basics.length > 0 && (
            <CompareSection label={t("compare.groupBasics")} />
          )}
          {fieldGroups.basics.map((field) => (
            <CompareFieldRow
              key={field.key}
              field={field}
              items={items}
              differingKeys={differingKeys}
              diffsOnly={diffsOnly}
              t={t}
            />
          ))}

          {fieldGroups.specs.length > 0 && (
            <CompareSection label={t("compare.groupSpecs")} />
          )}
          {fieldGroups.specs.map((field) => (
            <CompareFieldRow
              key={field.key}
              field={field}
              items={items}
              differingKeys={differingKeys}
              diffsOnly={diffsOnly}
              t={t}
            />
          ))}

          {trustFields.length > 0 && (
            <CompareSection label={t("compare.trustSection")} />
          )}
          {trustFields.map((field) => (
            <CompareFieldRow
              key={field.key}
              field={field}
              items={items}
              differingKeys={new Set()}
              diffsOnly={false}
              t={t}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
