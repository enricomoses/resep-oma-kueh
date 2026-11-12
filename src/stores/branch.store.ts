import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BRANCH } from '@/constants/site.constant';
import { branchPreferenceSchema } from '@/validations/branch.schema';

interface BranchPreference {
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
}
export function createBranchStore() {
  return createStore<BranchPreference>()(
    persist(
      (set) => ({
        selectedBranchId: null,
        setSelectedBranchId: (selectedBranchId) => set({ selectedBranchId }),
      }),
      {
        name: BRANCH.STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => ({
          getItem: (name) => localStorage.getItem(name),
          setItem: (name, value) => localStorage.setItem(name, value),
          removeItem: (name) => localStorage.removeItem(name),
        })),
        skipHydration: true,
        partialize: (state) => ({ selectedBranchId: state.selectedBranchId }),
        merge: (stored, current) => {
          const parsed = branchPreferenceSchema.safeParse(stored);
          return {
            ...current,
            selectedBranchId: parsed.success
              ? parsed.data.selectedBranchId
              : null,
          };
        },
      },
    ),
  );
}
