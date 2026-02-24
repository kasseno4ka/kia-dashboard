import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

const Header = ({ darkMode, onToggleDark }) => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login";

  if (isAuthRoute) return null;

  return (
    <header className="bg-white shadow-sm dark:bg-slate-900/90 dark:border-b dark:border-slate-800 sticky top-0 z-20 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <img
            src="/logo.png"
            alt="Kia AI Dashboard"
            className="h-8 w-auto mr-3 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50 truncate">
              Kia AI Dashboard
            </h1>
            <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
              Лиды
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleDark}
            className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const AppShell = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("leadDashboard.darkMode");
    if (stored === "true") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("leadDashboard.darkMode", darkMode ? "true" : "false");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <Header darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

