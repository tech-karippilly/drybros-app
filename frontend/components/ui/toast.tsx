"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    title?: string;
    description: string;
    variant?: ToastVariant;
}

interface ToastContextType {
    toast: (payload: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, variant = 'info' }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto p-4 rounded-xl border shadow-lg animate-in slide-in-from-right duration-300 flex gap-3 items-start backdrop-blur-md",
                            t.variant === 'success' && "bg-green-50/90 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
                            t.variant === 'error' && "bg-red-50/90 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100",
                            t.variant === 'warning' && "bg-orange-50/90 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-100",
                            t.variant === 'info' && "bg-blue-50/90 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100",
                        )}
                    >
                        <div className="shrink-0 mt-0.5">
                            {t.variant === 'success' && <CheckCircle2 size={18} />}
                            {t.variant === 'error' && <AlertCircle size={18} />}
                            {t.variant === 'warning' && <AlertTriangle size={18} />}
                            {t.variant === 'info' && <Info size={18} />}
                        </div>
                        <div className="flex-1 space-y-1">
                            {t.title && <p className="text-sm font-bold leading-none">{t.title}</p>}
                            <p className="text-sm opacity-90">{t.description}</p>
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
