import React from "react";
import { format } from "date-fns";

const QUALITY_LABEL_CLASS = {
  высокий: "badge badge-high",
  хороший: "badge badge-good",
  средний: "badge badge-medium",
  низкий: "badge badge-low"
};

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

const LeadModal = ({ lead, onClose }) => {
  if (!lead) return null;

  const qualityClass =
    QUALITY_LABEL_CLASS[lead.lead_quality] || "badge bg-slate-100 text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Карточка лида
            </h2>
            <p className="text-xs text-slate-500">
              ID: {lead.id} • {formatDateTime(lead.datetime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Закрыть
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-700">
              {lead.client_name}
            </span>
            <span className={qualityClass}>{lead.lead_quality}</span>
            {lead.car_model && (
              <span className="badge bg-slate-100 text-slate-700">
                {lead.car_model}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Телефон</p>
              <p className="text-sm text-slate-800">{lead.phone || "Не указан"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Источник</p>
              <p className="text-sm text-slate-800">
                {lead.source || "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-slate-500 mb-1">Резюме</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                {lead.summary || "—"}
              </p>
            </div>
            {lead.details_url && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Ссылка на CRM
                </p>
                <a
                  href={lead.details_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-600 hover:underline break-all"
                >
                  {lead.details_url}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3">
          <div className="flex gap-2">
            {lead.phone && lead.phone !== "Не указан" && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                Позвонить
              </a>
            )}
            {lead.details_url && (
              <a
                href={lead.details_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Открыть в CRM
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;

