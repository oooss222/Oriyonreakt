import React from "react";
import { api } from "../../lib/api";
import { API } from "../../lib/api";

export default function AdminAdPlacements({ token }) {
  const [rows, setRows] = React.useState([]);
  const [inquiries, setInquiries] = React.useState([]);
  const [daily, setDaily] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const [slots, leads, stats] = await Promise.all([
        api.adminAdPlacements(token),
        api.adminAdInquiries(token),
        api.adminAdDaily(token),
      ]);
      setRows(Array.isArray(slots) ? slots : []);
      setInquiries(Array.isArray(leads) ? leads : []);
      setDaily(Array.isArray(stats) ? stats : []);
    } catch (loadError) {
      setError(loadError.message || "Не удалось загрузить слоты");
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggle = async (row) => {
    await api.adminUpdateAdPlacement(token, row.code, {
      enabled: !row.enabled,
      config: row.config || {},
    });
    await load();
  };

  const downloadCsv = async () => {
    const response = await fetch(`${API}/admin/ads/stats.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diyor-ads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <div className="admin-panel p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-bold text-ink">Слоты сайта и приложения</h3>
          <button type="button" className="btn btn-secondary rounded-xl" onClick={downloadCsv}>
            CSV
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <label key={row.code} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2 text-sm">
              <span>
                <span className="font-semibold">{row.title}</span>
                <span className="mt-0.5 block text-xs text-ink-400">
                  {row.code} · {row.platform} · {row.width || "—"}×{row.height || "—"}
                  {row.config?.interval ? ` · каждые ${row.config.interval}` : ""}
                </span>
              </span>
              <input type="checkbox" checked={Boolean(row.enabled)} onChange={() => toggle(row)} />
            </label>
          ))}
        </div>
      </div>

      {daily.length > 0 ? (
        <div className="admin-panel overflow-x-auto p-4">
          <h3 className="mb-3 font-bold text-ink">Показы и клики</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-ink-400">
                <th className="py-2">День</th>
                <th>Платформа</th>
                <th>Слот</th>
                <th>Показы</th>
                <th>Клики</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody>
              {daily.slice(0, 20).map((row) => (
                <tr key={`${row.day}-${row.platform}-${row.placement}-${row.campaignId}`}>
                  <td className="py-1">{String(row.day).slice(0, 10)}</td>
                  <td>{row.platform}</td>
                  <td>{row.placement}</td>
                  <td>{row.impressions}</td>
                  <td>{row.clicks}</td>
                  <td>{row.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {inquiries.length > 0 ? (
        <div className="admin-panel p-4">
          <h3 className="mb-3 font-bold text-ink">Заявки с /advertise</h3>
          <ul className="space-y-2 text-sm">
            {inquiries.slice(0, 10).map((item) => (
              <li key={item.id} className="rounded-xl border border-ink/10 px-3 py-2">
                <div className="font-semibold">{item.name} · {item.contact}</div>
                <div className="text-ink-500">{item.message}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
