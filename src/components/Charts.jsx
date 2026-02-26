import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CHART_COLORS = ["#2563eb", "#10b981", "#ff6b57", "#f59e0b", "#7c3aed"];
const OTHERS_COLOR = "#d1d5db";

const QUALITY_ORDER = ["высокий", "хороший", "средний", "низкий"];
const QUALITY_LABELS = {
  высокий: "Высокий",
  хороший: "Хороший",
  средний: "Средний",
  низкий: "Низкий",
};

const QUALITY_COLORS = {
  Высокий: "#22c55e",
  Хороший: "#84cc16",
  Средний: "#facc15",
  Низкий: "#ef4444",
};

const STATIC_METRICS = [
  { label: "Общая конверсия", value: "55%" },
  { label: "Высокий потенциал", value: "49%" },
  { label: "Максимум заявок за день", value: "161" },
  { label: "Лучший день", value: "2026-02-24" },
];

const QUALITY_DESCRIPTION_LINES = [
  {
    range: "0–10 баллов",
    text: "Клиент не ответил ни на один вопрос или игнорирует менеджера.",
    markerClass: "bg-red-500",
  },
  {
    range: "11–30 баллов",
    text: "Односложные ответы без инициативы («ясно», «подумаю», «нет»).",
    markerClass: "bg-red-500",
  },
  {
    range: "31–60 баллов",
    text: "Клиент идет на контакт и отвечает на вопросы, но сам ничего не спрашивает.",
    markerClass: "bg-yellow-400",
  },
  {
    range: "61–90 баллов",
    text: "Явные сигналы к покупке (встречные вопросы о цене, сроках, условиях или гарантиях).",
    markerClass: "bg-lime-500",
  },
  {
    range: "91–100 баллов",
    text: "Клиент согласился на созвон, оставил контакты для связи или запросил счет.",
    markerClass: "bg-emerald-600",
  },
];

function normalizeQuality(byQuality) {
  const normalized = (byQuality || []).map((item) => ({
    quality: item.quality,
    name: QUALITY_LABELS[item.quality] || item.quality || "Неизвестно",
    value: item.count ?? item.value ?? 0,
  }));

  return normalized
    .filter((item) => item.value > 0)
    .sort((a, b) => QUALITY_ORDER.indexOf(a.quality) - QUALITY_ORDER.indexOf(b.quality));
}

function toTopFiveWithOthers(items, nameKey, valueKey) {
  const normalized = (items || [])
    .map((item) => ({
      name: item[nameKey] || item.name || "—",
      value: item[valueKey] ?? item.count ?? item.value ?? 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const topFive = normalized.slice(0, 5);
  const othersValue = normalized.slice(5).reduce((sum, item) => sum + item.value, 0);

  if (othersValue > 0) {
    topFive.push({ name: "Остальные", value: othersValue, isOthers: true });
  }

  return topFive;
}

const TooltipContent = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
      <p className="font-medium">{item.name}</p>
      <p>{item.value}</p>
    </div>
  );
};

const renderCalloutLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  if (!percent || percent <= 0) return null;

  const RADIAN = Math.PI / 180;
  const labelRadius = outerRadius + 26;
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? "start" : "end";

  return (
    <text
      x={x}
      y={y}
      fill="var(--chart-label-color)"
      textAnchor={textAnchor}
      dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 500 }}
    >
      {`${name} ${Math.round(percent * 100)}%`}
    </text>
  );
};

const EmptyState = ({ loading }) => (
  <div className="flex h-full items-center justify-center text-sm text-slate-400">
    {loading ? "Загрузка данных..." : "Недостаточно данных"}
  </div>
);

const DonutChart = ({ data, loading, qualityMode = false, compact = false }) => {
  if (loading || data.length === 0) {
    return <EmptyState loading={loading} />;
  }

  const chartMargin = compact
    ? { top: 28, right: 82, bottom: 28, left: 82 }
    : { top: 28, right: 96, bottom: 28, left: 96 };

  const innerRadius = compact ? 58 : 66;
  const outerRadius = compact ? 96 : 108;

  return (
    <div className="h-full w-full overflow-visible p-4 [--chart-label-color:#475569] [--chart-line-color:#94a3b8] dark:[--chart-label-color:#cbd5e1] dark:[--chart-line-color:#cbd5e1]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={chartMargin}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            label={renderCalloutLabel}
            labelLine={{ stroke: "var(--chart-line-color)", strokeWidth: 1 }}
          >
            {data.map((entry, index) => {
              const fill = qualityMode
                ? QUALITY_COLORS[entry.name] || OTHERS_COLOR
                : entry.isOthers
                ? OTHERS_COLOR
                : CHART_COLORS[index % CHART_COLORS.length];

              return <Cell key={`${entry.name}-${index}`} fill={fill} />;
            })}
          </Pie>
          <Tooltip content={<TooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const ChartCard = ({
  title,
  data,
  loading,
  qualityMode = false,
  compact = false,
  className = "",
  heightClass = "h-72",
  descriptionLines = null,
}) => (
  <div className={`rounded-2xl border border-transparent bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800 ${className}`}>
    <div className={`flex items-center gap-4 ${heightClass}`}>
      <div
        className={`flex h-full ${descriptionLines?.length ? "w-[35%]" : "w-[15%]"} ${descriptionLines?.length ? "flex-col" : "items-center"}`}
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>

        {descriptionLines?.length ? (
          <div className="my-auto space-y-3 pr-3 text-sm text-slate-600 dark:text-slate-300">
            {descriptionLines.map((line) => (
              <div key={line.range} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${line.markerClass}`}
                />
                <p className="leading-5">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {line.range}:
                  </span>{" "}
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className={`h-full ${descriptionLines?.length ? "w-[65%]" : "w-[85%]"}`}>
        <DonutChart
          data={data}
          loading={loading}
          qualityMode={qualityMode}
          compact={compact}
        />
      </div>
    </div>
  </div>
);

const KeyMetricsCard = () => (
  <div className="rounded-2xl border border-transparent bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <h2 className="mb-4 text-base font-semibold text-slate-700 dark:text-slate-200">Ключевые метрики</h2>
    <div className="flex flex-wrap items-center justify-between gap-4 lg:flex-nowrap">
      {STATIC_METRICS.map((metric) => (
        <div key={metric.label} className="min-w-[180px] flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const Charts = ({ aggregations, loading }) => {
  if (!aggregations && !loading) return null;

  const byModel = toTopFiveWithOthers(aggregations?.by_model || [], "model", "count");
  const byCity = toTopFiveWithOthers(aggregations?.by_city || [], "name", "value");
  const byQuality = normalizeQuality(aggregations?.by_quality || []);

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 font-sans lg:grid-cols-2">
      <ChartCard
        title="Модели автомобилей"
        data={byModel}
        loading={loading}
        compact
      />

      <ChartCard
        title="Статистика по городам"
        data={byCity}
        loading={loading}
        compact
      />

      <ChartCard
        className="lg:col-span-2"
        title="Качество лидов"
        data={byQuality}
        loading={loading}
        qualityMode
        heightClass="h-80"
        descriptionLines={QUALITY_DESCRIPTION_LINES}
      />

      <div className="lg:col-span-2">
        <KeyMetricsCard />
      </div>
    </div>
  );
};

export default Charts;
