import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CART_LIMITS, CART_STORAGE } from '@/constants/cart.constant';
import {
  cartPersistedStateSchema,
  createCartLineSignature,
} from '@/validations/cart.schema';
import type { CartPersistedLine } from '@/types/cart';

export interface AddLineInput {
  branchId: string;
  branchCode?: string | null;
  variantId: string;
  choiceIds?: readonly string[];
  quantity: number;
}

export type AddLineResult =
  | { success: true; lineId: string }
  | {
      success: false;
      reason: 'max_lines_exceeded' | 'max_quantity_exceeded' | 'invalid_input';
    };

export interface CartStoreState {
  hasHydrated: boolean;
  storageAvailable: boolean;
  branchId: string | null;
  branchCode: string | null;
  lines: CartPersistedLine[];
  addLine: (input: AddLineInput) => AddLineResult;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  setBranch: (branchId: string | null, branchCode?: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  setStorageAvailable: (available: boolean) => void;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      storageAvailable: true,
      branchId: null,
      branchCode: null,
      lines: [],

      addLine: (input: AddLineInput): AddLineResult => {
        if (
          !input.branchId ||
          !input.variantId ||
          input.quantity <= 0 ||
          isNaN(input.quantity)
        ) {
          return { success: false, reason: 'invalid_input' };
        }

        const choiceIds = [...(input.choiceIds ?? [])].sort();
        if (choiceIds.length > CART_LIMITS.MAX_OPTIONS_PER_LINE) {
          return { success: false, reason: 'invalid_input' };
        }

        const signature = createCartLineSignature(
          input.branchId,
          input.variantId,
          choiceIds,
        );
        const { lines } = get();
        const existingIndex = lines.findIndex((line) => line.id === signature);
        const now = new Date().toISOString();

        if (existingIndex >= 0) {
          const existingLine = lines[existingIndex];
          const newQty = Math.min(
            existingLine.quantity + input.quantity,
            CART_LIMITS.MAX_QTY_PER_LINE,
          );
          const updatedLines = [...lines];
          updatedLines[existingIndex] = {
            ...existingLine,
            quantity: newQty,
            updatedAt: now,
          };
          set({
            branchId: input.branchId,
            branchCode: input.branchCode ?? get().branchCode,
            lines: updatedLines,
          });
          return { success: true, lineId: signature };
        }

        if (lines.length >= CART_LIMITS.MAX_DISTINCT_LINES) {
          return { success: false, reason: 'max_lines_exceeded' };
        }

        const newLine: CartPersistedLine = {
          id: signature,
          branchId: input.branchId,
          variantId: input.variantId,
          choiceIds,
          quantity: Math.min(input.quantity, CART_LIMITS.MAX_QTY_PER_LINE),
          addedAt: now,
          updatedAt: now,
        };

        set({
          branchId: input.branchId,
          branchCode: input.branchCode ?? get().branchCode,
          lines: [...lines, newLine],
        });

        return { success: true, lineId: signature };
      },

      updateQuantity: (lineId: string, quantity: number) => {
        const { lines } = get();
        if (quantity <= 0) {
          set({
            lines: lines.filter((line) => line.id !== lineId),
          });
          return;
        }

        const clampedQty = Math.min(
          Math.max(1, Math.floor(quantity)),
          CART_LIMITS.MAX_QTY_PER_LINE,
        );
        const now = new Date().toISOString();
        set({
          lines: lines.map((line) =>
            line.id === lineId
              ? { ...line, quantity: clampedQty, updatedAt: now }
              : line,
          ),
        });
      },

      removeLine: (lineId: string) => {
        set((state) => ({
          lines: state.lines.filter((line) => line.id !== lineId),
        }));
      },

      clearCart: () => {
        set({
          lines: [],
        });
      },

      setBranch: (branchId: string | null, branchCode?: string | null) => {
        if (!branchId) {
          set({ branchId: null, branchCode: null });
          return;
        }

        const { lines } = get();
        const updatedLines = lines.map((line) => {
          const newSignature = createCartLineSignature(
            branchId,
            line.variantId,
            line.choiceIds,
          );
          return {
            ...line,
            id: newSignature,
            branchId,
          };
        });

        set({
          branchId,
          branchCode: branchCode ?? get().branchCode,
          lines: updatedLines,
        });
      },

      setHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
      setStorageAvailable: (storageAvailable: boolean) =>
        set({ storageAvailable }),
    }),
    {
      name: CART_STORAGE.KEY,
      version: CART_STORAGE.VERSION,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch {
            // Storage quota exceeded or disabled
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // Storage error
          }
        },
      })),
      skipHydration: true,
      partialize: (state) => ({
        version: CART_STORAGE.VERSION,
        branchId: state.branchId,
        branchCode: state.branchCode,
        lines: state.lines,
      }),
      merge: (stored, current) => {
        const parsed = cartPersistedStateSchema.safeParse(stored);
        if (!parsed.success) {
          return {
            ...current,
            branchId: null,
            branchCode: null,
            lines: [],
          };
        }
        return {
          ...current,
          branchId: parsed.data.branchId,
          branchCode: parsed.data.branchCode,
          lines: parsed.data.lines,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    },
  ),
);

// Synchronize cart across browser tabs via storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === CART_STORAGE.KEY) {
      if (event.newValue === null) {
        useCartStore.getState().clearCart();
      } else {
        void useCartStore.persist.rehydrate();
      }
    }
  });
}
