import { getCommodities, getCommodityHistory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function CommoditiesPage() {
  const commodities = getCommodities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commodity Trends</h1>
        <p className="text-gray-500 text-sm mt-1">
          USDA, FRED, and BLS commodity price indexes relevant to cafe operations
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commodities.map((c) => {
          const history = getCommodityHistory(c.series_id);
          const sparkData = history.slice(-12);
          const min = Math.min(...sparkData.map((d) => d.value));
          const max = Math.max(...sparkData.map((d) => d.value));
          const range = max - min || 1;

          return (
            <div key={c.series_id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{c.series_name}</h3>
                  <p className="text-xs text-gray-500">{c.source.toUpperCase()} &middot; {c.unit}</p>
                </div>
                {c.change_pct !== null && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      c.change_pct > 0
                        ? "bg-red-100 text-red-700"
                        : c.change_pct < 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.change_pct > 0 ? "+" : ""}
                    {c.change_pct}%
                  </span>
                )}
              </div>

              <p className="text-2xl font-bold">
                {c.unit === "index" ? c.latest_value.toFixed(1) : `$${c.latest_value.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500 mb-3">{c.latest_period}</p>

              {/* Sparkline */}
              <div className="h-12 flex items-end gap-0.5">
                {sparkData.map((d, i) => {
                  const height = ((d.value - min) / range) * 100;
                  const isLatest = i === sparkData.length - 1;
                  return (
                    <div
                      key={d.period}
                      className={`flex-1 rounded-t-sm ${isLatest ? "bg-blue-500" : "bg-gray-200"}`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${d.period}: ${d.value}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">{sparkData[0]?.period}</span>
                <span className="text-[10px] text-gray-400">{sparkData[sparkData.length - 1]?.period}</span>
              </div>

              {/* History Table */}
              <details className="mt-3">
                <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                  Show history ({history.length} months)
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {history.slice().reverse().map((h, i) => {
                        const prev = history.slice().reverse()[i + 1];
                        const change = prev ? ((h.value - prev.value) / prev.value) * 100 : null;
                        return (
                          <tr key={h.period} className="border-t border-gray-100">
                            <td className="py-1 text-gray-500">{h.period}</td>
                            <td className="py-1 text-right font-medium">
                              {c.unit === "index" ? h.value.toFixed(1) : `$${h.value.toFixed(2)}`}
                            </td>
                            <td className="py-1 text-right w-16">
                              {change !== null && (
                                <span className={change > 0 ? "text-red-600" : change < 0 ? "text-green-600" : "text-gray-400"}>
                                  {change > 0 ? "+" : ""}
                                  {change.toFixed(1)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
