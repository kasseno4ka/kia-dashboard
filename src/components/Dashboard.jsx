import React, { useEffect, useState } from "react";
import { fetchLeads } from "../api/api";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import KPICards from "./KPICards";
import Charts from "./Charts";
import LeadsTable from "./LeadsTable";
import LeadModal from "./LeadModal";
import GlobalFiltersBar from "./GlobalFiltersBar";

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [aggregations, setAggregations] = useState(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const {
    filters,
    setFilters,
    resetFilters,
    presets,
    savePreset,
    loadPreset
  } = useDashboardFilters();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeads({
        limit,
        offset,
        quality: filters.quality,
        search: filters.search,
        from: filters.from || undefined,
        to: filters.to || undefined,
        model: filters.model,
        source: filters.source,
        status: filters.status,
        tags: filters.tags
      });

      setLeads(data.leads || []);
      setAggregations(data.aggregations || null);
      setTotal(data.total ?? 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(
        "Не удалось загрузить данные. Проверьте REACT_APP_API_URL и доступность Apps Script."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [limit, offset, filters.quality, filters.search, filters.from, filters.to]);

  const handlePageChange = (newOffset) => {
    setOffset(newOffset);
  };

  const handlePageSizeChange = (newLimit) => {
    setLimit(newLimit);
    setOffset(0);
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setOffset(0);
  };

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* <GlobalFiltersBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={resetFilters}
        presets={presets}
        onSavePreset={savePreset}
        onLoadPreset={loadPreset}
      /> */}

      <KPICards kpi={aggregations?.kpi} loading={loading} />
      <Charts aggregations={aggregations} loading={loading} />
      <LeadsTable
        leads={leads}
        total={total}
        limit={limit}
        offset={offset}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onFilterChange={handleFilterChange}
        filters={filters}
        onViewLead={handleViewLead}
        loading={loading}
      />

      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Dashboard;

