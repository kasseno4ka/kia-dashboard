import React from "react";
import { format } from "date-fns";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return format(date, "dd.MM.yyyy HH:mm");
  } catch {
    return value;
  }
}

const KPICards = ({ kpi, loading }) => {
  if (!kpi && !loading) return null;

  const {
    total_leads,
    conversion,
    high_potential_pct,
    quality_leads,
    last_lead_name,
    last_lead_datetime,
    total_leads_prev,
    conversion_prev,
    high_potential_pct_prev,
    quality_leads_prev
  } = kpi || {};

  const calcDelta = (current, previous) => {
    if (current == null || previous == null) return null;
    const curr = typeof current === "string" && current.endsWith("%")
      ? parseFloat(current)
      : Number(current);
    const prev = typeof previous === "string" && previous.endsWith("%")
      ? parseFloat(previous)
      : Number(previous);
    if (!isFinite(curr) || !isFinite(prev) || prev === 0) return null;
    const delta = ((curr - prev) / prev) * 100;
    return Math.round(delta);
  };

  const kpiWithDelta = {
    total: {
      value: total_leads ?? 0,
      prev: total_leads_prev,
      delta: calcDelta(total_leads, total_leads_prev),
      label: "Всего лидов",
      hint: "Количество записей с учетом фильтров"
    },
    conversion: {
      value: conversion ?? "—",
      prev: conversion_prev,
      delta: calcDelta(conversion, conversion_prev),
      label: "Конверсия",
      hint: "Доля лидов с качеством выше низкого"
    },
    highPotential: {
      value: high_potential_pct ?? "—",
      prev: high_potential_pct_prev,
      delta: calcDelta(high_potential_pct, high_potential_pct_prev),
      label: "Высокий потенциал",
      hint: "Процент лидов с качеством «высокий»"
    },
    qualityLeads: {
      value: quality_leads ?? 0,
      prev: quality_leads_prev,
      delta: calcDelta(quality_leads, quality_leads_prev),
      label: "Качественные лиды",
      hint: "Всего лидов с качеством высокий/хороший"
    }
  };

  const cards = [
    {
      label: kpiWithDelta.total.label,
      value: kpiWithDelta.total.value,
      delta: kpiWithDelta.total.delta,
      hint: kpiWithDelta.total.hint
    },
    {
      label: kpiWithDelta.conversion.label,
      value: kpiWithDelta.conversion.value,
      delta: kpiWithDelta.conversion.delta,
      hint: kpiWithDelta.conversion.hint
    },
    {
      label: kpiWithDelta.highPotential.label,
      value: kpiWithDelta.highPotential.value,
      delta: kpiWithDelta.highPotential.delta,
      hint: kpiWithDelta.highPotential.hint
    },
    {
      label: kpiWithDelta.qualityLeads.label,
      value: kpiWithDelta.qualityLeads.value,
      delta: kpiWithDelta.qualityLeads.delta,
      hint: kpiWithDelta.qualityLeads.hint
    },
    {
      label: "Последний лид",
      value: last_lead_name || "—",
      extra: last_lead_datetime ? formatDateTime(last_lead_datetime) : "",
      hint: "Имя и время последнего лида"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
      {cards.map((card) => {
        const delta = card.delta;
        const hasDelta = delta !== null && delta !== undefined;
        const isPositive = hasDelta && delta > 0;
        const isNegative = hasDelta && delta < 0;
        const deltaColor = isPositive
          ? "text-emerald-600"
          : isNegative
          ? "text-rose-600"
          : "text-slate-400";

        return (
          <div key={card.label} className="card p-4">
            <div className="card-header flex items-center justify-between">
              <span>{card.label}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="card-value">
                {loading && card.label !== "Последний лид" ? "—" : card.value}
              </div>
              {card.extra && (
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  {card.extra}
                </span>
              )}
            </div>
            {card.hint && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {card.hint}
              </p>
            )}
            {hasDelta && card.label !== "Последний лид" && (
              <p
                className={`mt-1 text-xs font-medium ${deltaColor}`}
                title="Динамика к предыдущему аналогичному периоду"
              >
                {delta > 0 && "↑ "}
                {delta < 0 && "↓ "}
                {delta === 0 ? "0%" : `${Math.abs(delta)}%`} к прошлому периоду
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;

