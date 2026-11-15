'use client';

import 'react-toastify/dist/ReactToastify.css';
import '@/styles/components/toastify.css';

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Slide, ToastContainer } from 'react-toastify';
import type { IconProps } from 'react-toastify';

import { cn } from '@/utils';

interface BakeryToastContainerProps {
  className?: string;
}

function renderToastIcon({ type }: IconProps) {
  const icon =
    type === 'success' ? (
      <CircleCheck size={17} aria-hidden="true" />
    ) : type === 'error' ? (
      <CircleAlert size={17} aria-hidden="true" />
    ) : type === 'warning' ? (
      <TriangleAlert size={17} aria-hidden="true" />
    ) : (
      <Info size={17} aria-hidden="true" />
    );

  return <span className="bakery-toast-icon">{icon}</span>;
}

function BakeryToastCloseButton({
  closeToast,
}: {
  closeToast: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="bakery-toast-close"
      aria-label="Tutup notifikasi"
      onClick={closeToast}
    >
      <X size={15} aria-hidden="true" />
    </button>
  );
}

/** Global themed Toastify container styled with Resep Oma Kueh bakery tokens. */
export function BakeryToastContainer({ className }: BakeryToastContainerProps) {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4500}
      limit={4}
      newestOnTop
      closeOnClick={false}
      pauseOnFocusLoss
      pauseOnHover
      draggable="touch"
      theme="light"
      transition={Slide}
      icon={renderToastIcon}
      closeButton={BakeryToastCloseButton}
      className={(context) =>
        cn(context?.defaultClassName, 'bakery-toast-container', className)
      }
      toastClassName={(context) =>
        cn(
          context?.defaultClassName,
          'bakery-toast',
          context?.type ? `bakery-toast--${context.type}` : null,
        )
      }
      progressClassName={(context) =>
        cn(context?.defaultClassName, 'bakery-toast-progress')
      }
    />
  );
}
