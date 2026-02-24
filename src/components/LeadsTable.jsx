import React, { useCallback, useMemo, useState } from "react";
import { format, isValid, parse, parseISO } from "date-fns";
import { useToast } from "../contexts/ToastContext";

const QUALITY_LABEL_CLASS = {
  высокий: "badge badge-high",
  хороший: "badge badge-good",
  средний: "badge badge-medium",
  низкий: "badge badge-low"
};

function formatDate(value) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return format(date, "dd.MM.yyyy HH:mm");
  } catch {
    return value;
  }
}

function toTimestamp(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime() || 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  const isoDate = parseISO(raw);
  if (isValid(isoDate)) return isoDate.getTime();

  const knownFormats = [
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd",
    "dd.MM.yyyy HH:mm",
    "dd.MM.yyyy"
  ];

  for (const dateFormat of knownFormats) {
    const parsed = parse(raw, dateFormat, new Date());
    if (isValid(parsed)) return parsed.getTime();
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
}

const LeadsTable = ({
  leads,
  limit,
  offset,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  filters,
  onViewLead,
  loading
}) => {
  const [sortField, setSortField] = useState("datetime");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const { addToast } = useToast();
  const currentPage = Math.floor(offset / limit) + 1;

  const searchQuery = useMemo(
    () => (filters.search || "").trim().toLowerCase(),
    [filters.search]
  );

  const dateFromTs = useMemo(
    () => (filters.from ? toTimestamp(filters.from) : null),
    [filters.from]
  );

  const dateToTs = useMemo(
    () => (filters.to ? toTimestamp(filters.to) : null),
    [filters.to]
  );

  const { pagedLeads, filteredTotal, sortedLeads } = useMemo(() => {
    const source = Array.isArray(leads) ? leads : [];

    const filteredBySearch = searchQuery
      ? source.filter((lead) => {
          const name = (lead.name || "").toLowerCase();
          const phone = (
            lead.phone ||
            lead.phone_number ||
            lead.client_phone ||
            lead.contact_phone ||
            lead.mobile ||
            ""
          ).toString().toLowerCase();
          return name.includes(searchQuery) || phone.includes(searchQuery);
        })
      : source;

    const filteredByQuality =
      filters.quality && filters.quality !== "all"
        ? filteredBySearch.filter(
            (lead) => lead.client_quality_bucket === filters.quality
          )
        : filteredBySearch;

    const filteredByDate = filteredByQuality.filter((lead) => {
      const leadTs = toTimestamp(lead.datetime);
      if (dateFromTs && leadTs < dateFromTs) return false;
      if (dateToTs && leadTs > dateToTs) return false;
      return true;
    });

    const sorted = [...filteredByDate].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === "datetime") {
        av = toTimestamp(av);
        bv = toTimestamp(bv);
      }
      if (av === bv) return 0;
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv) * dir;
      }
      return av > bv ? dir : -dir;
    });

    const totalCount = sorted.length;
    const start = offset;
    const page = sorted.slice(start, start + limit);

    return { pagedLeads: page, filteredTotal: totalCount, sortedLeads: sorted };
  }, [leads, searchQuery, filters.quality, dateFromTs, dateToTs, sortField, sortDirection, offset, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));

  const handleQualityChange = useCallback((e) => {
    onFilterChange({ ...filters, quality: e.target.value });
  }, [filters, onFilterChange]);

  const handleSearchChange = useCallback((e) => {
    onFilterChange({ ...filters, search: e.target.value });
  }, [filters, onFilterChange]);

  const handleFromChange = useCallback((e) => {
    const value = e.target.value ? `${e.target.value}T00:00:00` : "";
    onFilterChange({ ...filters, from: value });
  }, [filters, onFilterChange]);

  const handleToChange = useCallback((e) => {
    const value = e.target.value ? `${e.target.value}T23:59:59` : "";
    onFilterChange({ ...filters, to: value });
  }, [filters, onFilterChange]);

  const handleLimitChange = useCallback((e) => {
    const newLimit = Number(e.target.value) || 10;
    onPageSizeChange(newLimit);
  }, [onPageSizeChange]);

  const goToPage = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    const newOffset = (page - 1) * limit;
    onPageChange(newOffset);
  }, [limit, onPageChange, totalPages]);

  const changeSort = useCallback((field) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevField;
      }
      setSortDirection(field === "datetime" ? "desc" : "asc");
      return field;
    });
  }, []);

  const buildCsvRows = (sourceLeads) =>
    (sourceLeads || []).map((lead) => ({
      id: lead.id,
      datetime: lead.datetime,
      name: lead.name,
      city: lead.city,
      selected_car: lead.selected_car,
      purchase_method: lead.purchase_method,
      client_quality: lead.client_quality,
      traffic_source: lead.traffic_source,
      messenger: lead.messenger,
      dealer_center: lead.dealer_center,
      dialog_link: lead.dialog_link,
      summary_dialog: lead.summary_dialog,
      source_system: lead.source_system,
      platform_user_id: lead.platform_user_id
    }));

  const triggerCsvDownload = useCallback((rows, fileName) => {
    const header = Object.keys(rows[0]);
    const csvLines = [
      header.join(","),
      ...rows.map((row) =>
        header
          .map((key) => {
            const value = row[key] ?? "";
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      )
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const openExportModal = useCallback(() => {
    setExportFrom(filters.from ? filters.from.slice(0, 10) : "");
    setExportTo(filters.to ? filters.to.slice(0, 10) : "");
    setIsExportModalOpen(true);
  }, [filters.from, filters.to]);

  const closeExportModal = useCallback(() => {
    if (exportLoading) return;
    setIsExportModalOpen(false);
  }, [exportLoading]);

  const exportToCsv = useCallback(async () => {
    if (!exportFrom || !exportTo) {
      window.alert("Выберите начальную и конечную даты для экспорта.");
      return;
    }

    const from = `${exportFrom}T00:00:00`;
    const to = `${exportTo}T23:59:59`;
    const fromTs = toTimestamp(from);
    const toTs = toTimestamp(to);

    if (!fromTs || !toTs || fromTs > toTs) {
      window.alert("Проверьте корректность диапазона дат.");
      return;
    }

    setExportLoading(true);
    try {
      const exportFiltered = sortedLeads.filter((lead) => {
        const leadTs = toTimestamp(lead.datetime);
        return leadTs >= fromTs && leadTs <= toTs;
      });

      const rows = buildCsvRows(exportFiltered);
      if (rows.length === 0) {
        window.alert("Нет данных за выбранный диапазон дат.");
        return;
      }

      triggerCsvDownload(rows, `leads-${exportFrom}-${exportTo}.csv`);
      addToast("CSV успешно скачан.", "success");
      setIsExportModalOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Ошибка экспорта CSV", error);
      addToast("Не удалось выгрузить CSV.", "error");
    } finally {
      setExportLoading(false);
    }
  }, [exportFrom, exportTo, sortedLeads, triggerCsvDownload, addToast]);

  const dateSortArrow =
    sortField === "datetime" ? (sortDirection === "desc" ? " ↓" : " ↑") : "";

  const rowsLabel = useMemo(() => pagedLeads.length, [pagedLeads]);

  const showEmptyState = !loading && pagedLeads.length === 0;

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Лиды
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Поиск по имени / телефону, фильтр по качеству и датам.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">Поиск</label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={handleSearchChange}
              placeholder="Имя или телефон..."
              className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">Качество</label>
            <select
              value={filters.quality || "all"}
              onChange={handleQualityChange}
              className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="all">Все</option>
              <option value="высокий">Высокий</option>
              <option value="хороший">Хороший</option>
              <option value="средний">Средний</option>
              <option value="низкий">Низкий</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">С даты</label>
            <input
              type="date"
              value={filters.from ? filters.from.slice(0, 10) : ""}
              onChange={handleFromChange}
              className="w-36 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">По дату</label>
            <input
              type="date"
              value={filters.to ? filters.to.slice(0, 10) : ""}
              onChange={handleToChange}
              className="w-36 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">На странице</label>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <svg
            className="h-12 w-12 text-slate-400"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12h28M10 20h28M10 28h16"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="36" cy="32" r="6" stroke="currentColor" strokeWidth="3" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Ничего не найдено
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Попробуйте изменить запрос или снять фильтры.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-header sticky top-0 z-10">
              <tr>
                <th
                  className="px-3 py-2 text-left cursor-pointer"
                  onClick={() => changeSort("name")}
                  title="Сортировать по имени"
                >
                  Имя
                </th>
                <th
                  className="px-3 py-2 text-left cursor-pointer"
                  onClick={() => changeSort("selected_car")}
                  title="Сортировать по модели"
                >
                  Модель
                </th>
                <th
                  className="px-3 py-2 text-left cursor-pointer"
                  onClick={() => changeSort("client_quality")}
                  title="Сортировать по качеству"
                >
                  Качество
                </th>
                <th
                  className="px-3 py-2 text-left cursor-pointer"
                  onClick={() => changeSort("datetime")}
                  title="Сортировать по дате"
                >
                  Дата{dateSortArrow}
                </th>
                <th className="px-3 py-2 text-left">Город</th>
                <th className="px-3 py-2 text-left">Источник</th>
                <th className="px-3 py-2 text-left">Канал</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="table-row">
                    <td colSpan={8} className="px-3 py-3">
                      <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                  </tr>
                ))
              ) : (
                pagedLeads.map((lead) => {
                  const qualityClass =
                    QUALITY_LABEL_CLASS[lead.client_quality_bucket] ||
                    "badge bg-slate-100 text-slate-700";
                  const qualityStripeClass =
                    lead.client_quality_bucket === "высокий"
                      ? "border-l-4 border-emerald-500"
                      : lead.client_quality_bucket === "хороший"
                      ? "border-l-4 border-sky-500"
                      : lead.client_quality_bucket === "средний"
                      ? "border-l-4 border-amber-500"
                      : "border-l-4 border-rose-500";
                  return (
                    <tr key={lead.id} className={`table-row ${qualityStripeClass}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-800 dark:text-slate-100">
                        {lead.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {lead.selected_car}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={qualityClass}>
                          {lead.client_quality_bucket} ({lead.client_quality})
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {formatDate(lead.datetime)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {lead.city}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {lead.traffic_source}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                        {lead.messenger}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => onViewLead(lead)}
                          className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          Просмотр
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Показано {rowsLabel} из {filteredTotal} лидов.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Назад
          </button>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            Стр. {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Далее
          </button>
          <button
            type="button"
            onClick={openExportModal}
            className="ml-2 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Экспорт CSV
          </button>
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Экспорт CSV по диапазону дат
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Выберите начальную и конечную даты. В экспорт попадут только лиды в этом диапазоне.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-600 dark:text-slate-300">
                Start Date
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-600 dark:text-slate-300">
                End Date
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeExportModal}
                disabled={exportLoading}
                className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={exportToCsv}
                disabled={exportLoading}
                className="rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {exportLoading ? "Экспорт..." : "Скачать CSV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;

