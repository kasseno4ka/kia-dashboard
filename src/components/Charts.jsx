import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const QUALITY_COLORS = {
  высокий: "#22c55e",
  хороший: "#16a34a",
  средний: "#facc15",
  низкий: "#f97316",
};

const ChartArea = ({ loading, dataLength, children }) => (
  <div className="h-80">
    {loading ? (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Загрузка данных...
      </div>
    ) : dataLength === 0 ? (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Недостаточно данных
      </div>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    )}
  </div>
);

const Charts = ({ aggregations, loading }) => {
  if (!aggregations && !loading) return null;

  const {
    by_quality = [],
    by_model = [],
    by_date = [],
  } = aggregations || {};

  const pieData = by_quality.filter((q) => q.count > 0);

  const modelsData = [...by_model]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const timeSeriesData = by_date;

  return (
    <div className="space-y-6 mb-6">
      {/* ===================== */}
      {/* TOP BLOCK */}
      {/* ===================== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PIE — Качество */}
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Распределение качества лидов
          </h2>

          <ChartArea loading={loading} dataLength={pieData.length}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="quality"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={85}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.quality}
                    fill={QUALITY_COLORS[entry.quality] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ChartArea>
        </div>

        {/* BAR — Модели */}
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Лиды по моделям автомобилей
          </h2>

          <ChartArea loading={loading} dataLength={modelsData.length}>
            <BarChart data={modelsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="model" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartArea>
        </div>
      </div>

      {/* ===================== */}
      {/* BOTTOM BLOCK */}
      {/* ===================== */}
      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Статистика лидов (по качеству)
        </h2>

        <ChartArea loading={loading} dataLength={timeSeriesData.length}>
          <BarChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="высокий"
              stackId="a"
              fill={QUALITY_COLORS["высокий"]}
            />
            <Bar
              dataKey="хороший"
              stackId="a"
              fill={QUALITY_COLORS["хороший"]}
            />
            <Bar
              dataKey="средний"
              stackId="a"
              fill={QUALITY_COLORS["средний"]}
            />
            <Bar
              dataKey="низкий"
              stackId="a"
              fill={QUALITY_COLORS["низкий"]}
            />
          </BarChart>
        </ChartArea>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===================== */}
        {/* СТАТИСТИКА КАЧЕСТВА */}
        {/* ===================== */}
        <div className="card p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Статистика качества
          </h2>

          <div className="space-y-3">
            {by_quality.map((q) => {
              const total = by_quality.reduce((s, i) => s + i.count, 0);
              const percent = total ? (q.count / total) * 100 : 0;

              return (
                <div key={q.quality}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{q.quality}</span>
                    <span className="text-slate-500">{q.count}</span>
                  </div>
                  <div className="h-2 w-full rounded bg-slate-100">
                    <div
                      className="h-2 rounded"
                      style={{
                        width: `${percent}%`,
                        background:
                          q.quality === "высокий"
                            ? "#22c55e"
                            : q.quality === "хороший"
                            ? "#16a34a"
                            : q.quality === "средний"
                            ? "#facc15"
                            : "#f97316",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================== */}
        {/* КЛЮЧЕВЫЕ МЕТРИКИ */}
        {/* ===================== */}
        <div className="card p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Ключевые метрики
          </h2>

          {(() => {
            const total = by_quality.reduce((s, i) => s + i.count, 0);
            const high =
              by_quality.find((i) => i.quality === "высокий")?.count || 0;
            const good =
              by_quality.find((i) => i.quality === "хороший")?.count || 0;

            const conversion = total
              ? Math.round(((high + good) / total) * 100)
              : 0;
            const highPotential = total ? Math.round((high / total) * 100) : 0;

            const bestDay = [...by_date].sort((a, b) => b.total - a.total)[0];

            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Общая конверсия</span>
                  <strong>{conversion}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Высокий потенциал</span>
                  <strong>{highPotential}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Максимум заявок за день</span>
                  <strong>{bestDay?.total || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Лучший день</span>
                  <strong>{bestDay?.date || "—"}</strong>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Charts;
