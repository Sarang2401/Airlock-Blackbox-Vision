import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ToastTone = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || toast.tone === 'error') return;
    const timer = window.setTimeout(() => onDismiss(toast.id), 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss, paused, toast.id, toast.tone]);

  return (
    <div className="toast surface" data-tone={toast.tone}
      onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div role={toast.tone === 'error' ? 'alert' : 'status'}>
        {toast.tone === 'error' ? <AlertCircle size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}
        <span>{toast.message}</span>
      </div>
      <button className="button icon-button" type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}><X size={17} aria-hidden="true" /></button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sequence = useRef(0);
  const notify = useCallback((message: string, tone: ToastTone = 'success') => {
    const toast = { id: ++sequence.current, message, tone };
    setToasts((current) => [...current.filter((item) => item.message !== message).slice(-2), toast]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-label="Notifications">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
