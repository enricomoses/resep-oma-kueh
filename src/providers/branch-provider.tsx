'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import { createBranchStore } from '@/stores/branch.store';
import { useCartStore } from '@/stores/cart.store';
import type { BranchInitial, BranchSwitchGuard } from '@/types/branch';

interface BranchContextValue {
  initial: BranchInitial;
  store: ReturnType<typeof createBranchStore>;
  hydrated: boolean;
  storageAvailable: boolean;
  cartItemCount: number;
  beforeBranchChange?: BranchSwitchGuard;
}
const BranchContext = createContext<BranchContextValue | null>(null);
interface BranchProviderProps {
  initial: BranchInitial;
  children: ReactNode;
  cartItemCount?: number;
  beforeBranchChange?: BranchSwitchGuard;
}
export function BranchProvider({
  initial,
  children,
  cartItemCount,
  beforeBranchChange,
}: BranchProviderProps) {
  const [store] = useState(createBranchStore);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const liveCartCount = useCartStore((state) =>
    state.lines.reduce((sum, item) => sum + item.quantity, 0),
  );
  const effectiveCartItemCount =
    cartItemCount !== undefined ? cartItemCount : liveCartCount;

  const defaultGuard: BranchSwitchGuard = (request) => {
    useCartStore.getState().setBranch(request.nextBranchId);
    return true;
  };
  const effectiveGuard =
    beforeBranchChange !== undefined
      ? beforeBranchChange
      : cartItemCount === undefined
        ? defaultGuard
        : undefined;

  useEffect(() => {
    if (!useCartStore.persist.hasHydrated()) {
      void useCartStore.persist.rehydrate();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.resolve(store.persist.rehydrate())
      .then(() => {
        if (mounted) {
          setHydrated(true);
          setStorageAvailable(store.persist.hasHydrated());
        }
      })
      .catch(() => {
        if (mounted) {
          setHydrated(true);
          setStorageAvailable(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [store]);
  return (
    <BranchContext.Provider
      value={{
        initial,
        store,
        hydrated,
        storageAvailable,
        cartItemCount: effectiveCartItemCount,
        beforeBranchChange: effectiveGuard,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}
export function useBranchContext() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('BranchProvider required');
  return context;
}
export function useBranchPreference() {
  const context = useBranchContext();
  return useStore(context.store, (state) => state.selectedBranchId);
}
