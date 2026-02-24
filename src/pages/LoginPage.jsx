import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!email || !email.includes("@")) nextErrors.email = "Введите корректный email.";
    if (!password || password.length < 7) nextErrors.password = "Минимум 7 символов.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const result = login(email, password);
    if (result.ok) {
      addToast("Вы вошли в систему.", "success");
      navigate("/");
      return;
    }

    if (result.error === "wrong_credentials") {
      addToast("Неверные учетные данные.", "error");
    } else {
      addToast("Не удалось войти. Проверьте данные.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Kia AI" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-semibold">Войти в Kia AI Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Панель лидов и аналитики</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 7 символов"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Войти
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
