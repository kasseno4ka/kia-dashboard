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

  // Вся витрина (таблица, экспорт, модалка) работает с одним DTO:
  // name, selected_car, client_quality_bucket, client_quality, datetime, city,
  // traffic_source, messenger, dealer_center, dialog_link, summary_dialog,
  // source_system, platform_user_id и т.д.
  // Поэтому здесь используем те же поля, что и в таблице/экспорте.
  const qualityClass =
    QUALITY_LABEL_CLASS[lead.client_quality_bucket] ||
    "badge bg-slate-100 text-slate-700";

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
              {lead.name}
            </span>
            <span className={qualityClass}>
              {lead.client_quality_bucket}{" "}
              {lead.client_quality && `(${lead.client_quality})`}
            </span>
            {lead.selected_car && (
              <span className="badge bg-slate-100 text-slate-700">
                {lead.selected_car}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Город</p>
              <p className="text-sm text-slate-800">{lead.city || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Источник</p>
              <p className="text-sm text-slate-800">
                {lead.traffic_source || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Канал</p>
              <p className="text-sm text-slate-800">
                {lead.messenger || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                Дилерский центр
              </p>
              <p className="text-sm text-slate-800">
                {lead.dealer_center || "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-slate-500 mb-1">Резюме</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                {lead.summary_dialog || "—"}
              </p>
            </div>
            {lead.dialog_link && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Ссылка на диалог / CRM
                </p>
                <a
                  href={lead.dialog_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-600 hover:underline break-all"
                >
                  {lead.dialog_link}
                </a>
              </div>
            )}
            {(lead.source_system || lead.platform_user_id) && (
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Система-источник
                  </p>
                  <p className="text-sm text-slate-800">
                    {lead.source_system || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    ID в платформе
                  </p>
                  <p className="text-sm text-slate-800">
                    {lead.platform_user_id || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3">
          <div className="flex gap-2" />
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

