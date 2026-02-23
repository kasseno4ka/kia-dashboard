import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { fetchLeads } from "../api/api";

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

const LeadsTable = ({
  leads,
  total,
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
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    const copy = [...leads];
    copy.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === "datetime") {
        av = new Date(av).getTime() || 0;
        bv = new Date(bv).getTime() || 0;
      }
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
    return copy;
  }, [leads, sortField, sortDirection]);

  const handleQualityChange = (e) => {
    onFilterChange({ ...filters, quality: e.target.value });
  };

  const handleSearchChange = (e) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleFromChange = (e) => {
    const value = e.target.value ? `${e.target.value}T00:00:00` : "";
    onFilterChange({ ...filters, from: value });
  };

  const handleToChange = (e) => {
    const value = e.target.value ? `${e.target.value}T23:59:59` : "";
    onFilterChange({ ...filters, to: value });
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value) || 10;
    onPageSizeChange(newLimit);
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    const newOffset = (page - 1) * limit;
    onPageChange(newOffset);
  };

  const changeSort = (field) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevField;
      }
      setSortDirection("asc");
      return field;
    });
  };

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

  const exportToCsv = async (fullPeriod = false) => {
    let sourceLeads = sortedLeads;

    // При экспорте "за период" запрашиваем все данные у API с теми же фильтрами,
    // игнорируя пагинацию, чтобы экспортировать полную выборку.
    if (fullPeriod) {
      try {
        const pageLimit = 500;
        let allLeads = [];
        let pageOffset = 0;
        // Пагинация, пока бэкенд возвращает полные страницы
        // (Apps Script сам ограничит максимальный объем, если нужно).
        // Если данных меньше, чем pageLimit, останавливаемся.
        // Это проще и надежнее отдельного спец. эндпоинта.
        // В дальнейшем можно вынести в отдельный хук/утилиту.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const data = await fetchLeads({
            limit: pageLimit,
            offset: pageOffset,
            quality: filters.quality,
            search: filters.search,
            from: filters.from || undefined,
            to: filters.to || undefined,
            model: filters.model,
            source: filters.source
          });

          const batch = data.leads || [];
          allLeads = allLeads.concat(batch);

          if (batch.length < pageLimit) {
            break;
          }

          pageOffset += pageLimit;
        }

        sourceLeads = allLeads;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Ошибка экспорта за период", error);
        window.alert("Не удалось загрузить данные для экспорта за период.");
        return;
      }
    }

    const rows = buildCsvRows(sourceLeads);
    if (rows.length === 0) {
      window.alert(
        fullPeriod
          ? "Нет данных за выбранный период для экспорта."
          : "Нет данных для экспорта."
      );
      return;
    }
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
    const a = document.createElement("a");
    a.href = url;
    a.download = fullPeriod ? "leads-period.csv" : "leads-current-view.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Лиды
          </h2>
          <p className="text-xs text-slate-500">
            Поиск по имени / телефону, фильтр по качеству и датам.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Поиск</label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={handleSearchChange}
              placeholder="Имя или телефон..."
              className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Качество</label>
            <select
              value={filters.quality || "all"}
              onChange={handleQualityChange}
              className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">Все</option>
              <option value="высокий">Высокий</option>
              <option value="хороший">Хороший</option>
              <option value="средний">Средний</option>
              <option value="низкий">Низкий</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">С даты</label>
            <input
              type="date"
              onChange={handleFromChange}
              className="w-36 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">По дату</label>
            <input
              type="date"
              onChange={handleToChange}
              className="w-36 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">На странице</label>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

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
                Дата
              </th>
              <th className="px-3 py-2 text-left">Город</th>
              <th className="px-3 py-2 text-left">Источник</th>
              <th className="px-3 py-2 text-left">Канал</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-slate-500"
                >
                  Загрузка данных...
                </td>
              </tr>
            ) : sortedLeads && sortedLeads.length > 0 ? (
              sortedLeads.map((lead) => {
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
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-800">
                      {lead.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                      {lead.selected_car}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={qualityClass}>
                        {lead.client_quality_bucket} ({lead.client_quality})
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                      {formatDate(lead.datetime)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                      {lead.city}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                      {lead.traffic_source}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                      {lead.messenger}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onViewLead(lead)}
                        className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Просмотр
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-slate-500"
                >
                  Данные не найдены. Попробуйте изменить фильтры или снять
                  ограничения.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Показано {leads ? leads.length : 0} из {total ?? 0} лидов.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Назад
          </button>
          <span className="text-xs text-slate-600">
            Стр. {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Далее
          </button>
          <button
            type="button"
            onClick={() => exportToCsv(false)}
            className="ml-2 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Экспорт выборки CSV
          </button>
          <button
            type="button"
            onClick={() => exportToCsv(true)}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Экспорт за период CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadsTable;

