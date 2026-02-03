import React from "react";

const periodOptions = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "custom", label: "Кастом" }
];

const GlobalFiltersBar = ({
  filters,
  onChange,
  onReset,
  presets,
  onSavePreset,
  onLoadPreset
}) => {
  const handlePeriodChange = (e) => {
    const value = e.target.value;
    const now = new Date();
    let from = "";
    let to = "";

    if (value === "today") {
      const day = now.toISOString().slice(0, 10);
      from = `${day}T00:00:00`;
      to = `${day}T23:59:59`;
    } else if (value === "7d") {
      const toDate = now;
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 6);
      from = `${fromDate.toISOString().slice(0, 10)}T00:00:00`;
      to = `${toDate.toISOString().slice(0, 10)}T23:59:59`;
    } else if (value === "30d") {
      const toDate = now;
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 29);
      from = `${fromDate.toISOString().slice(0, 10)}T00:00:00`;
      to = `${toDate.toISOString().slice(0, 10)}T23:59:59`;
    }

    onChange({
      ...filters,
      period: value,
      from: value === "custom" ? filters.from : from,
      to: value === "custom" ? filters.to : to
    });
  };

  const handlePresetSave = () => {
    const name = window.prompt("Название пресета фильтров:");
    if (name) {
      onSavePreset(name);
    }
  };

  const presetNames = Object.keys(presets || {});

  return (
    <div className="sticky top-16 z-10 mb-4 rounded-xl border border-slate-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm dark:bg-slate-900/90 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Период
          </span>
          <select
            value={filters.period || "30d"}
            onChange={handlePeriodChange}
            className="mt-1 w-32 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Качество
          </span>
          <select
            value={filters.quality || "all"}
            onChange={(e) =>
              onChange({ ...filters, quality: e.target.value })
            }
            className="mt-1 w-32 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="all">Все</option>
            <option value="высокий">Высокий</option>
            <option value="хороший">Хороший</option>
            <option value="средний">Средний</option>
            <option value="низкий">Низкий</option>
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Модель
          </span>
          <input
            type="text"
            value={filters.model === "all" ? "" : filters.model || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                model: e.target.value ? e.target.value : "all"
              })
            }
            placeholder="Напр. Sportage"
            className="mt-1 w-32 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Источник
          </span>
          <input
            type="text"
            value={filters.source === "all" ? "" : filters.source || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                source: e.target.value ? e.target.value : "all"
              })
            }
            placeholder="сайт, чат..."
            className="mt-1 w-32 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Статус
          </span>
          <select
            value={filters.status || "all"}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value })
            }
            className="mt-1 w-32 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="all">Все</option>
            <option value="новый">Новый</option>
            <option value="в работе">В работе</option>
            <option value="обработан">Обработан</option>
            <option value="отказ">Отказ</option>
          </select>
        </div>

        <div className="flex flex-col min-w-[160px]">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Теги
          </span>
          <input
            type="text"
            value={filters.tags || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                tags: e.target.value
              })
            }
            placeholder="акция, тест..."
            className="mt-1 rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {presetNames.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) onLoadPreset(e.target.value);
              }}
              defaultValue=""
              className="rounded-md border border-slate-200 px-2 py-1 text-xs shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">Пресеты...</option>
              {presetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handlePresetSave}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Сохранить пресет
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalFiltersBar;

