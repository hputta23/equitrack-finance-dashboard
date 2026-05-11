import { useFinancial } from '../context/FinancialContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useFinancial();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded shadow-lg border backdrop-blur-sm animate-slide-up min-w-[300px] max-w-[420px] font-mono text-sm ${
            toast.type === 'success'
              ? 'bg-primary/90 border-primary text-on-primary'
              : toast.type === 'error'
              ? 'bg-error/90 border-error text-on-error'
              : 'bg-surface-container border-outline-variant text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-fluid-18">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-fluid-16">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
