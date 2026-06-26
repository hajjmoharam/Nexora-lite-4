import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Video as LucideIcon } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastLink {
  label: string;
  href: string;
}

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  link?: ToastLink;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, link?: ToastLink) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, link?: ToastLink) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, link }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const config: Record<ToastType, { icon: LucideIcon; color: string; bg: string; border: string }> = {
    success: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    error: { icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    warning: { icon: AlertCircle, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
    info: { icon: Info, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.3)' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const cfg = config[toast.type];
          const Icon = cfg.icon;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg animate-[slideIn_0.3s_ease-out]"
              style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <Icon size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary leading-relaxed">{toast.message}</p>
                {toast.link && (
                  <a
                    href={toast.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1.5 text-xs font-medium hover:underline"
                    style={{ color: cfg.color }}
                  >
                    {toast.link.label}
                  </a>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
