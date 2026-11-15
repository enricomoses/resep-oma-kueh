'use client';

import type { ReactNode } from 'react';
import { toast, type Id, type ToastOptions } from 'react-toastify';

export interface BakeryToastOptions {
  toastId?: Id;
  autoClose?: number | false;
}

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
  autoClose: 4500,
};

const ATTENTION_TOAST_OPTIONS: ToastOptions = {
  autoClose: 6000,
};

function showToast(
  type: 'success' | 'error' | 'info' | 'warning',
  content: ReactNode,
  baseOptions: ToastOptions,
  options?: BakeryToastOptions,
): Id {
  const merged = { ...baseOptions, ...options };
  if (merged.toastId !== undefined && toast.isActive(merged.toastId)) {
    toast.update(merged.toastId, {
      render: content,
      type,
      autoClose: merged.autoClose,
    });
    return merged.toastId;
  }
  return toast[type](content, merged);
}

/** Displays a warm bakery-themed success notification toast. */
export function notifySuccess(
  content: ReactNode,
  options?: BakeryToastOptions,
): Id {
  return showToast('success', content, DEFAULT_TOAST_OPTIONS, options);
}

/** Displays a warm bakery-themed error notification toast. */
export function notifyError(
  content: ReactNode,
  options?: BakeryToastOptions,
): Id {
  return showToast('error', content, ATTENTION_TOAST_OPTIONS, options);
}

/** Displays a warm bakery-themed informational notification toast. */
export function notifyInfo(
  content: ReactNode,
  options?: BakeryToastOptions,
): Id {
  return showToast('info', content, DEFAULT_TOAST_OPTIONS, options);
}

/** Displays a warm bakery-themed warning notification toast. */
export function notifyWarning(
  content: ReactNode,
  options?: BakeryToastOptions,
): Id {
  return showToast('warning', content, ATTENTION_TOAST_OPTIONS, options);
}

/** Dismisses a specific active toast or all active toasts. */
export function dismissToast(id?: Id): void {
  toast.dismiss(id);
}
