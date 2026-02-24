import React, { useMemo } from "react";
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
    quality_leads_prev,
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

  const cards = useMemo(
    () => [
      {
        label: "Всего лидов",
        value: total_leads ?? 0,
        delta: calcDelta(total_leads, total_leads_prev),
        hint: "Количество записей с учетом фильтров"
      },
      {
        label: "Конверсия",
        value: conversion ?? "—",
        delta: calcDelta(conversion, conversion_prev),
        hint: "Доля лидов с качеством выше низкого"
      },
      {
        label: "Высокий потенциал",
        value: high_potential_pct ?? "—",
        delta: calcDelta(high_potential_pct, high_potential_pct_prev),
        hint: "Процент лидов с качеством «высокий»"
      },
      {
        label: "Качественные лиды",
        value: quality_leads ?? 0,
        delta: calcDelta(quality_leads, quality_leads_prev),
        hint: "Всего лидов с качеством высокий/хороший"
      },
      {
        label: "Последний лид",
        value: last_lead_name || "—",
        extra: last_lead_datetime ? formatDateTime(last_lead_datetime) : "",
        hint: "Имя и время последнего лида"
      }
    ],
    [
      total_leads,
      total_leads_prev,
      conversion,
      conversion_prev,
      high_potential_pct,
      high_potential_pct_prev,
      quality_leads,
      quality_leads_prev,
      last_lead_name,
      last_lead_datetime
    ]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
      {cards.map((card) => {
        const delta = card.delta;
        const hasDelta = delta !== null && delta !== undefined;
        const isPositive = hasDelta && delta > 0;
        const isNegative = hasDelta && delta < 0;
        const deltaColor = isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : isNegative
          ? "text-rose-600 dark:text-rose-400"
          : "text-slate-400 dark:text-slate-500";

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

