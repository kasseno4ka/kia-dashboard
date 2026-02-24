import { useCallback, useMemo, useState } from "react";

const defaultFilters = {
  from: "",
  to: "",
  quality: "all",
  search: ""
};

export function useDashboardFilters() {
  const [filters, setFiltersState] = useState(defaultFilters);

  const updateFilters = useCallback((patch) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  return useMemo(
    () => ({
      filters,
      setFilters: updateFilters
    }),
    [filters, updateFilters]
  );
}

