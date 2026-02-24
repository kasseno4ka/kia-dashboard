import React, { useCallback, useEffect, useState } from "react";
import { fetchLeads } from "../api/api";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useToast } from "../contexts/ToastContext";
import KPICards from "./KPICards";
import Charts from "./Charts";
import LeadsTable from "./LeadsTable";
import LeadModal from "./LeadModal";

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [aggregations, setAggregations] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { filters, setFilters } = useDashboardFilters();
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
          offset: pageOffset
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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(
        "Не удалось загрузить данные. Проверьте REACT_APP_API_URL и доступность Apps Script."
      );
      addToast("Не удалось загрузить данные.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
          <Charts aggregations={aggregations} loading={loading} />
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

