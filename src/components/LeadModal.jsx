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

function parseFullDialog(fullDialog) {
  if (!fullDialog) return [];

  const normalized = String(fullDialog).replace(/\r\n/g, "\n");
  const pattern = /(\d{2}\.\d{2}\.\d{2}\s+\d{2}-\d{2})\s+\[([^\]]+)\]:\s*([\s\S]*?)(?=(?:\n\d{2}\.\d{2}\.\d{2}\s+\d{2}-\d{2}\s+\[[^\]]+\]:)|$)/g;

  const messages = [];
  let match;

  while ((match = pattern.exec(normalized)) !== null) {
    const datetime = (match[1] || "").trim();
    const sender = (match[2] || "").trim();
    const text = (match[3] || "").trim();

    messages.push({ datetime, sender, text });
  }

  return messages;
}

function formatDialogTime(datetime) {
  const match = datetime?.match(/(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
}

function isCompanySender(sender) {
  const normalized = (sender || "").toLowerCase();
  return normalized.includes("kia qazaqstan") || normalized.startsWith("kia");
}

const LeadModal = ({ lead, onClose }) => {
  if (!lead) return null;

  const fullDialogMessages = parseFullDialog(lead.full_dialog);

  const qualityClass =
    QUALITY_LABEL_CLASS[lead.client_quality_bucket] ||
    "badge bg-slate-100 text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Карточка лида
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ID: {lead.id} • {formatDateTime(lead.datetime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Закрыть
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {lead.name}
            </span>
            <span className={qualityClass}>
              {lead.client_quality_bucket}{" "}
              {lead.client_quality && `(${lead.client_quality})`}
            </span>
            {lead.selected_car && (
              <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                {lead.selected_car}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Город</p>
              <p className="text-sm text-slate-800 dark:text-slate-200">{lead.city || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Источник</p>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {lead.traffic_source || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Канал</p>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {lead.messenger || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Дилерский центр
              </p>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {lead.dealer_center || "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Резюме</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {lead.summary_dialog || "—"}
              </p>
            </div>

            {lead.dialog_link && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
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
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Система-источник
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {lead.source_system || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    ID в платформе
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {lead.platform_user_id || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {lead.full_dialog && (
            <details className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <summary className="cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
                Полный диалог
              </summary>
              <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="space-y-2.5">
                  {fullDialogMessages.length > 0 ? (
                    fullDialogMessages.map((message, index) => {
                      const outgoing = isCompanySender(message.sender);

                      return (
                        <div
                          key={`${message.datetime}-${message.sender}-${index}`}
                          className={`flex ${outgoing ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              outgoing
                                ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                            }`}
                          >
                            {!outgoing && (
                              <p className="mb-1 text-[11px] font-medium text-slate-500 dark:text-slate-300">
                                {message.sender}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{message.text}</p>
                            <p
                              className={`mt-1 text-right text-[10px] ${
                                outgoing
                                  ? "text-sky-700 dark:text-sky-200"
                                  : "text-slate-500 dark:text-slate-300"
                              }`}
                            >
                              {formatDialogTime(message.datetime)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {lead.full_dialog}
                    </p>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3 dark:border-slate-700">
          <div className="flex gap-2" />
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;