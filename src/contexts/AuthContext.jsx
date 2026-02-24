import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const AUTH_TOKEN_KEY = "leadDashboard.auth.token";
const AUTH_USER_KEY = "leadDashboard.auth.user";
const ADMIN_EMAIL = "ar.omarov@allur.kz";
const ADMIN_PASSWORD = "Allur123";

const AuthContext = createContext(null);

function getStoredAuth() {
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const user = window.localStorage.getItem(AUTH_USER_KEY);
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export const AuthProvider = ({ children }) => {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored.token);
  const [user, setUser] = useState(stored.user);

  const persistAuth = useCallback((nextToken, email) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    window.localStorage.setItem(AUTH_USER_KEY, email);
    setToken(nextToken);
    setUser(email);
  }, []);

  const clearAuth = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((email, password) => {
    if (!email || !password || password.length < 7) {
      return { ok: false, error: "password_short" };
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return { ok: false, error: "wrong_credentials" };
    }

    const newToken = `token_${Date.now()}`;
    persistAuth(newToken, email);
    return { ok: true };
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
