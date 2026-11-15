'use client';

import type { ReactNode } from 'react';

import { BakeryToastContainer } from '@/components/common/feedback/bakery-toast-container';

interface ToastProviderProps {
  children?: ReactNode;
}

/** Provides the global themed Toastify container across client routes and tests. */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <BakeryToastContainer />
    </>
  );
}
