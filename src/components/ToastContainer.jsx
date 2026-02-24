import React from "react";

const TYPE_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100",
  error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-100"
};

const ToastContainer = ({ toasts, onDismiss }) => (
  <div className="fixed right-4 top-4 z-50 flex w-[90vw] max-w-sm flex-col gap-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
          TYPE_STYLES[toast.type] || TYPE_STYLES.success
        }`}
      >
        <span className="leading-snug">{toast.message}</span>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-xs font-semibold text-inherit opacity-70 hover:opacity-100"
        >
          OK
        </button>
      </div>
    ))}
  </div>
);

export default ToastContainer;
