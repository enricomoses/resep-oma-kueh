import { afterEach, expect, it } from 'vitest';
import { createBranchStore } from '@/stores/branch.store';
import { BRANCH } from '@/constants/site.constant';

afterEach(() => localStorage.clear());
it('starts empty for SSR, hydrates explicitly and persists selectedBranchId only', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  localStorage.setItem(
    BRANCH.STORAGE_KEY,
    JSON.stringify({ state: { selectedBranchId: id }, version: 1 }),
  );
  const store = createBranchStore();
  expect(store.getState().selectedBranchId).toBeNull();
  await store.persist.rehydrate();
  expect(store.getState().selectedBranchId).toBe(id);
  store.getState().setSelectedBranchId(null);
  expect(JSON.parse(localStorage.getItem(BRANCH.STORAGE_KEY) ?? '{}')).toEqual({
    state: { selectedBranchId: null },
    version: 1,
  });
});
it('does not merge tampered fields or malformed JSON into live store', async () => {
  localStorage.setItem(
    BRANCH.STORAGE_KEY,
    JSON.stringify({
      state: { selectedBranchId: 'invalid', setSelectedBranchId: 'override' },
      version: 1,
    }),
  );
  const store = createBranchStore();
  await store.persist.rehydrate();
  expect(store.getState().selectedBranchId).toBeNull();
  expect(typeof store.getState().setSelectedBranchId).toBe('function');
  localStorage.setItem(BRANCH.STORAGE_KEY, '{');
  await store.persist.rehydrate();
  expect(store.getState().selectedBranchId).toBeNull();
});
