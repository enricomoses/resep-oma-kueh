import { expect, it } from 'vitest';
import {
  branchDirectorySchema,
  branchPreferenceSchema,
} from '@/validations/branch.schema';
import { withBranch } from '@/utils/branch-url';

it('keeps filters/hash and replaces one stable branch code in navigation', () => {
  expect(
    withBranch('/menu?search=chiffon&branch=old&page=2#hasil', 'bintaro'),
  ).toBe('/menu?search=chiffon&branch=bintaro&page=2#hasil');
  expect(withBranch('/menu?branch=old&category=bread', null)).toBe(
    '/menu?category=bread',
  );
});
it('rejects persisted authority, invalid UUID and out-of-directory selection', () => {
  expect(
    branchPreferenceSchema.safeParse({ selectedBranchId: 'not-id' }).success,
  ).toBe(false);
  expect(
    branchPreferenceSchema.safeParse({ selectedBranchId: null, role: 'owner' })
      .success,
  ).toBe(false);
  expect(
    branchDirectorySchema.safeParse({
      items: [],
      resolvedBranchId: '11111111-1111-4111-8111-111111111111',
    }).success,
  ).toBe(false);
  expect(
    branchDirectorySchema.parse({ items: [], resolvedBranchId: null }).items,
  ).toEqual([]);
});
