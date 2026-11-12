'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

const locks = new Set<HTMLDialogElement>();
let previousOverflow = '';
const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function useModal(
  open: boolean,
  dialogRef: RefObject<HTMLDialogElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (locks.size === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    locks.add(dialog);
    try {
      if (!dialog.open) dialog.showModal();
      initialFocusRef?.current?.focus({ preventScroll: true });
    } catch (error) {
      locks.delete(dialog);
      if (locks.size === 0) document.body.style.overflow = previousOverflow;
      throw error;
    }
    // Native inert blocks background controls. Explicit endpoint wrapping also
    // prevents Chromium Tab from moving into browser chrome at the last control.
    const wrapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== 'hidden',
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('keydown', wrapTab);
    return () => {
      dialog.removeEventListener('keydown', wrapTab);
      if (dialog.open) dialog.close();
      locks.delete(dialog);
      if (locks.size === 0) document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open, dialogRef, initialFocusRef]);
}
