import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("leadDashboard.darkMode");
    if (stored === "true") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("leadDashboard.darkMode", darkMode ? "true" : "false");
  }, [darkMode]);

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      <header className="bg-white shadow-sm dark:bg-slate-900/90 dark:border-b dark:border-slate-800 sticky top-0 z-20 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Lead Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Лиды по автомобилям Kia — реальное время
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-slate-800 dark:text-slate-200">
              Google Sheets → Apps Script → React
            </span>
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;

