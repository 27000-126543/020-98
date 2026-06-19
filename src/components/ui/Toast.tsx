import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

const ICON_MAP = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const COLOR_MAP = {
  success: 'bg-accent-50 border-accent-200 text-accent-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  error: 'bg-danger-50 border-danger-200 text-danger-600',
  info: 'bg-primary-50 border-primary-200 text-primary-700',
};

export const ToastContainer = () => {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICON_MAP[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-soft-lg backdrop-blur-sm animate-slide-in-right min-w-[240px] max-w-[360px] ${COLOR_MAP[t.type]}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm flex-1 leading-relaxed">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
