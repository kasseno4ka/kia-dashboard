import { useCallback, useMemo, useState } from "react";

const defaultFilters = {
  startDate: "",
  endDate: "",
  from: "",
  to: "",
  quality: "all",
  search: ""
};

function toStartOfDay(dateValue) {
  return dateValue ? `${dateValue}T00:00:00` : "";
}

function toEndOfDay(dateValue) {
  return dateValue ? `${dateValue}T23:59:59` : "";
}

function toDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export function useDashboardFilters() {
  const [filters, setFiltersState] = useState(defaultFilters);

  const updateFilters = useCallback((patch) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...patch };
      const hasStartDate = Object.prototype.hasOwnProperty.call(patch, "startDate");
      const hasEndDate = Object.prototype.hasOwnProperty.call(patch, "endDate");
      const hasFrom = Object.prototype.hasOwnProperty.call(patch, "from");
      const hasTo = Object.prototype.hasOwnProperty.call(patch, "to");

      if (hasStartDate) {
        next.from = toStartOfDay(patch.startDate);
      }
      if (hasEndDate) {
        next.to = toEndOfDay(patch.endDate);
      }

      if (hasFrom && !hasStartDate) {
        next.startDate = toDateOnly(patch.from);
      }
      if (hasTo && !hasEndDate) {
        next.endDate = toDateOnly(patch.to);
      }

      return next;
    });
  }, []);

  const setStartDate = useCallback(
    (value) => {
      updateFilters({ startDate: value });
    },
    [updateFilters]
  );

  const setEndDate = useCallback(
    (value) => {
      updateFilters({ endDate: value });
    },
    [updateFilters]
  );

  const resetDateFilters = useCallback(() => {
    updateFilters({ startDate: "", endDate: "" });
  }, [updateFilters]);

  return useMemo(
    () => ({
      filters,
      setFilters: updateFilters,
      startDate: filters.startDate,
      endDate: filters.endDate,
      setStartDate,
      setEndDate,
      resetDateFilters
    }),
    [filters, updateFilters, setStartDate, setEndDate, resetDateFilters]
  );
}

