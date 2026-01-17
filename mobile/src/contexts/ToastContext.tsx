/**
 * Toast Context for managing toast messages globally
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastOptions } from '../types/common';
import Toast from '../components/ui/Toast';

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastState extends ToastOptions {
  visible: boolean;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    duration: 3000,
    position: 'top',
    visible: false,
  });

  const showToast = useCallback((options: ToastOptions) => {
    setToast({
      ...options,
      visible: true,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast {...toast} onHide={hideToast} />
    </ToastContext.Provider>
  );
};