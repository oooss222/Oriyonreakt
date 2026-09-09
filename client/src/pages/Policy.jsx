import React from "react";
import { api } from "../lib/api";
import { Alert, Skeleton, SkeletonText } from "../ui";
import { useI18n } from "../i18n";

function PolicyContent({ content }) {
  const blocks = String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 text-[0.9375rem] leading-relaxed text-ink-700">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const firstLine = lines[0] || "";
        const isHeading =
          /^\d+\.\s/.test(firstLine) ||
          firstLine.length < 80 && lines.length === 1 && !firstLine.startsWith("-");

        if (isHeading) {
          return (
            <section key={index} className="space-y-2">
              <h2 className="text-base font-bold text-ink-900">{firstLine}</h2>
              {lines.slice(1).length > 0 && (
                <div className="space-y-1">
                  {lines.slice(1).map((line, lineIndex) => (
                    <p key={lineIndex}>{line.replace(/^-\s*/, "")}</p>
                  ))}
                </div>
              )}
            </section>
          );
        }

        if (lines.every((line) => line.startsWith("-"))) {
          return (
            <ul key={index} className="list-disc pl-5 space-y-1">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.replace(/^-\s*/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default function Policy() {
  const { t } = useI18n();
  const [content, setContent] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api
      .sitePolicy()
      .then((data) => {
        setContent(data.content || "");
        setUpdatedAt(data.updatedAt || null);
      })
      .catch(() => {
        setError(t("policy.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="page-container py-6">
      <article className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-ink-200 bg-white p-5 shadow-xs sm:p-7">
        <header className="space-y-1 border-b border-ink-200 pb-4">
          <h1 className="section-title">{t("policy.title")}</h1>
          <p className="text-sm text-ink-400">
            {updatedAt
              ? t("policy.lastUpdated", {
                  date: new Date(updatedAt).toLocaleDateString(),
                })
              : t("policy.lastUpdatedEmpty")}
          </p>
        </header>

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-5 w-2/5" />
            <SkeletonText lines={4} />
            <Skeleton className="h-5 w-1/3" />
            <SkeletonText lines={5} />
          </div>
        ) : error ? (
          <Alert tone="danger">{error}</Alert>
        ) : (
          <PolicyContent content={content} />
        )}
      </article>
    </div>
  );
}
