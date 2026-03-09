import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error';

export interface Toast {
  message: string;
  type: ToastType;
}

export interface UseToastReturn {
  toast: Toast | null;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: () => void;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setToast({ message, type });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 3000);
  }, []);

  return { toast, showToast, dismissToast };
}
