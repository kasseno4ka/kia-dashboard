import React, { useCallback, useEffect, useState } from "react";
import { fetchLeads, getLeadsQualityDynamics } from "../api/api";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useToast } from "../contexts/ToastContext";
import KPICards from "./KPICards";
import Charts from "./Charts";
import LeadsTable from "./LeadsTable";
import LeadModal from "./LeadModal";

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [aggregations, setAggregations] = useState(null);
  const [leadsQualityDynamics, setLeadsQualityDynamics] = useState([]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const {
    filters,
    setFilters,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    resetDateFilters
  } = useDashboardFilters();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const { addToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageLimit = 500;
      let pageOffset = 0;
      let allLeads = [];
      let resolvedTotal = 0;
      let resolvedAggregations = null;

      while (true) {
        const data = await fetchLeads({
          limit: pageLimit,
          offset: pageOffset,
          startDate,
          endDate,
          from: startDate ? `${startDate}T00:00:00` : "",
          to: endDate ? `${endDate}T23:59:59` : ""
        });

        if (!resolvedAggregations && data.aggregations) {
          resolvedAggregations = data.aggregations;
        }

        if (!resolvedTotal) {
          resolvedTotal = data.total ?? 0;
        }

        const batch = data.leads || [];
        allLeads = allLeads.concat(batch);

        if (batch.length < pageLimit || allLeads.length >= resolvedTotal) {
          break;
        }

        pageOffset += pageLimit;
      }

      setLeads(allLeads);
      setAggregations(resolvedAggregations);

      const dynamics = await getLeadsQualityDynamics({
        startDate,
        endDate,
        from: startDate ? `${startDate}T00:00:00` : "",
        to: endDate ? `${endDate}T23:59:59` : "",
        fallbackLeads: allLeads,
        dashboardData: { aggregations: resolvedAggregations },
      });
      setLeadsQualityDynamics(dynamics);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(
        "Не удалось загрузить данные. Проверьте REACT_APP_API_URL и доступность Apps Script."
      );
      addToast("Не удалось загрузить данные.", "error");
      setLeadsQualityDynamics([]);
    } finally {
      setLoading(false);
    }
  }, [addToast, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = useCallback((newOffset) => {
    setOffset(newOffset);
  }, []);

  const handlePageSizeChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setOffset(0);
  }, []);

  const handleFilterChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
    setOffset(0);
  }, [setFilters]);

  const handleStartDateChange = useCallback((event) => {
    setStartDate(event.target.value || "");
    setOffset(0);
  }, [setStartDate]);

  const handleEndDateChange = useCallback((event) => {
    setEndDate(event.target.value || "");
    setOffset(0);
  }, [setEndDate]);

  const handleResetDateFilter = useCallback(() => {
    resetDateFilters();
    setOffset(0);
  }, [resetDateFilters]);

  const handleViewLead = useCallback((lead) => {
    setSelectedLead(lead);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedLead(null);
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">Дата начала</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            max={endDate || undefined}
            className="h-11 min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-xs font-medium text-gray-600">Дата окончания</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
            className="h-11 min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={handleResetDateFilter}
            className="mt-6 h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Сбросить фильтр
          </button>
        )}
      </div>

      {loading && leads.length === 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={`kpi-skeleton-${idx}`} className="card p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-6 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
          <div className="card p-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`table-skeleton-${idx}`} className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <KPICards kpi={aggregations?.kpi} loading={loading} />
          <Charts
            aggregations={aggregations}
            leadsQualityDynamics={leadsQualityDynamics}
            loading={loading}
          />
          <LeadsTable
            leads={leads}
            limit={limit}
            offset={offset}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onFilterChange={handleFilterChange}
            filters={filters}
            onViewLead={handleViewLead}
            loading={loading}
          />
        </>
      )}

      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Dashboard;

