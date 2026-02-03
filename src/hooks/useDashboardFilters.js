import { useEffect, useState } from "react";

const STORAGE_KEY = "leadDashboard.filters.v1";

const defaultFilters = {
  period: "30d", // today | 7d | 30d | custom
  from: "",
  to: "",
  quality: "all",
  model: "all",
  source: "all",
  status: "all",
  tags: "",
  search: ""
};

export function useDashboardFilters() {
  const [filters, setFilters] = useState(defaultFilters);
  const [presets, setPresets] = useState({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.filters) setFilters({ ...defaultFilters, ...parsed.filters });
        if (parsed.presets) setPresets(parsed.presets);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ filters, presets })
    );
  }, [filters, presets]);

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const savePreset = (name) => {
    if (!name) return;
    setPresets((prev) => ({ ...prev, [name]: filters }));
  };

  const loadPreset = (name) => {
    const preset = presets[name];
    if (!preset) return;
    setFilters({ ...defaultFilters, ...preset });
  };

  return {
    filters,
    setFilters: updateFilters,
    resetFilters,
    presets,
    savePreset,
    loadPreset
  };
}

