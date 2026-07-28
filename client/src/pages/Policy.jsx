import React from "react";
import { api } from "../lib/api";

function PolicyContent({ content }) {
  const blocks = String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 text-slate-600">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const firstLine = lines[0] || "";
        const isHeading =
          /^\d+\.\s/.test(firstLine) ||
          firstLine.length < 80 && lines.length === 1 && !firstLine.startsWith("-");

        if (isHeading) {
          return (
            <section key={index} className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{firstLine}</h2>
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
  const [content, setContent] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .sitePolicy()
      .then((data) => {
        setContent(data.content || "");
        setUpdatedAt(data.updatedAt || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-x py-6">
      <div className="max-w-3xl mx-auto card p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-2">
          Политика конфиденциальности и условия использования
        </h1>

        {loading ? (
          <div className="text-sm text-slate-500 animate-pulse">Загрузка...</div>
        ) : (
          <PolicyContent content={content} />
        )}

        <div className="text-sm text-slate-500 border-t pt-3">
          {updatedAt
            ? `Последнее обновление: ${new Date(updatedAt).toLocaleDateString("ru-RU")}`
            : "Последнее обновление: —"}
        </div>
      </div>
    </div>
  );
}
