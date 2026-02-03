import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area
} from "recharts";

const QUALITY_COLORS = {
  высокий: "#22c55e",
  хороший: "#0ea5e9",
  средний: "#eab308",
  низкий: "#f97316"
};

const Charts = ({ aggregations, loading }) => {
  if (!aggregations && !loading) return null;

  const {
    by_quality = [],
    by_model = [],
    by_date = [],
    funnel = [],
    by_model_detailed = []
  } = aggregations || {};

  // Данные для Pie — распределение по качеству
  const pieData = by_quality.filter((item) => item.count > 0);

  // Данные для Bar по моделям — top 10
  const modelsData = by_model.slice(0, 10);

  // Для временного ряда делаем stacked bars по качеству,
  // используя структуру объекта: { date, total, высокий, хороший, средний, низкий }
  const timeSeriesData = by_date;

  // Топ / антитоп по моделям (используем детализированные данные
  // с полями count и quality_pct)
  const detailedModels = by_model_detailed.length ? by_model_detailed : by_model;
  const sortedByCount = [...detailedModels].sort((a, b) => (b.count || 0) - (a.count || 0));
  const sortedByQualityPct = [...detailedModels].sort(
    (a, b) => (b.quality_pct || 0) - (a.quality_pct || 0)
  );
  const topByCount = sortedByCount.slice(0, 5);
  const bottomByCount = sortedByCount.slice(-5).reverse();
  const topByQuality = sortedByQualityPct.slice(0, 5);
  const bottomByQuality = sortedByQualityPct.slice(-5).reverse();

  return (
    <div className="grid gap-4 lg:grid-cols-2 mb-6">
      {/* Pie: распределение качества */}
      <div className="card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Распределение по качеству лидов
          </h2>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Загрузка данных для графика...
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Недостаточно данных для графика
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="quality"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.quality}
                      fill={QUALITY_COLORS[entry.quality] || "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar: лиды по моделям (горизонтальный) */}
      <div className="card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Лиды по моделям Kia (top 10)
          </h2>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Загрузка данных для графика...
            </div>
          ) : modelsData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Недостаточно данных для графика
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelsData}
                layout="vertical"
                margin={{ left: 80, right: 24, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="model" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stacked Time Series: лиды за последние 30 дней по качеству */}
      <div className="card p-4 flex flex-col lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Лиды за последние 30 дней (по качеству)
          </h2>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Загрузка данных для графика...
            </div>
          ) : timeSeriesData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Недостаточно данных для графика
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData} margin={{ left: 0, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
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
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Воронка качества лидов */}
      <div className="card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Воронка качества лидов
          </h2>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Загрузка данных для воронки...
            </div>
          ) : !funnel || funnel.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Недостаточно данных для построения воронки
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="count"
                  data={funnel}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="stage"
                    position="right"
                    fill="#0f172a"
                    stroke="none"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stacked Area: динамика качества во времени */}
      <div className="card p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Динамика качества во времени
          </h2>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Загрузка данных...
            </div>
          ) : timeSeriesData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Недостаточно данных для графика
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeSeriesData}
                margin={{ left: 0, right: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="высокий"
                  stackId="a"
                  stroke={QUALITY_COLORS["высокий"]}
                  fill={QUALITY_COLORS["высокий"]}
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="хороший"
                  stackId="a"
                  stroke={QUALITY_COLORS["хороший"]}
                  fill={QUALITY_COLORS["хороший"]}
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="средний"
                  stackId="a"
                  stroke={QUALITY_COLORS["средний"]}
                  fill={QUALITY_COLORS["средний"]}
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="низкий"
                  stackId="a"
                  stroke={QUALITY_COLORS["низкий"]}
                  fill={QUALITY_COLORS["низкий"]}
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Топ / Антитоп моделей */}
      <div className="card p-4 flex flex-col lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Топ / Антитоп моделей
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Слева — по количеству, справа — по % качественных лидов
          </p>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            Загрузка данных по моделям...
          </div>
        ) : detailedModels.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            Недостаточно данных
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Топ-5 по количеству
              </h3>
              <ul className="space-y-1">
                {topByCount.map((m) => (
                  <li
                    key={m.model}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1 dark:bg-slate-800"
                  >
                    <span>{m.model}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {m.count} лидов
                    </span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Антитоп-5 по количеству
              </h3>
              <ul className="space-y-1">
                {bottomByCount.map((m) => (
                  <li
                    key={m.model}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1 dark:bg-slate-800"
                  >
                    <span>{m.model}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {m.count} лидов
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Топ-5 по % качественных
              </h3>
              <ul className="space-y-1">
                {topByQuality.map((m) => (
                  <li
                    key={m.model}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1 dark:bg-slate-800"
                  >
                    <span>{m.model}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {Math.round((m.quality_pct || 0) * 100)}% качественных
                    </span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Антитоп-5 по % качественных
              </h3>
              <ul className="space-y-1">
                {bottomByQuality.map((m) => (
                  <li
                    key={m.model}
                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1 dark:bg-slate-800"
                  >
                    <span>{m.model}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {Math.round((m.quality_pct || 0) * 100)}% качественных
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;

