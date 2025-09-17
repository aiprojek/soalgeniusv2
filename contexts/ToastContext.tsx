import React, { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';
import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from '../components/Icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(toast.id);
        }, 300); // Animation duration
    }, [onDismiss, toast.id]);

    useEffect(() => {
        const timer = setTimeout(handleDismiss, 4000);
        return () => clearTimeout(timer);
    }, [handleDismiss]);

    const typeClasses = {
        success: 'border-green-500 dark:border-green-400',
        error: 'border-red-500 dark:border-red-400',
        info: 'border-blue-500 dark:border-blue-400',
    };

    const icons = {
        success: <CheckIcon className="text-xl text-green-600 dark:text-green-400" />,
        error: <ErrorIcon className="text-xl text-red-600 dark:text-red-400" />,
        info: <InfoIcon className="text-xl text-blue-600 dark:text-blue-400" />,
    };

    return (
        <div
            className={`flex items-center bg-[var(--bg-secondary)]/80 backdrop-blur-sm text-[var(--text-primary)] p-4 rounded-lg shadow-lg border-b-4 ${typeClasses[toast.type]} transform transition-all duration-300 ease-in-out pointer-events-auto ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            role="alert"
        >
            <div className="flex-shrink-0 mr-3">{icons[toast.type]}</div>
            <div className="flex-grow font-semibold">{toast.message}</div>
            <button
                onClick={handleDismiss}
                className="ml-4 p-1 rounded-full text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-slate-500"
                aria-label="Tutup"
            >
                <CloseIcon className="text-lg" />
            </button>
        </div>
    );
};


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="assertive"
        className="fixed inset-0 flex items-end justify-end p-4 sm:p-6 pointer-events-none z-[100]"
      >
        <div className="w-full max-w-sm space-y-3">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};