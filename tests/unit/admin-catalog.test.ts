import { describe, expect, it } from 'vitest';

import {
  clampAdminPageAfterRemoval,
  escapeLiteralSearchPattern,
  hasActiveCategoryChildren,
  slugifyCatalogName,
  wouldCreateCategoryCycle,
} from '@/utils/admin-catalog';
import {
  archiveAdminEntitySchema,
  createAdminCategorySchema,
  createAdminProductSchema,
  updateAdminCategorySchema,
  updateAdminProductSchema,
} from '@/validations/admin-catalog.schema';

describe('F16 pure admin catalog helpers', () => {
  it('slugifies Indonesian bakery titles deterministically', () => {
    expect(slugifyCatalogName('Spikoe Kenari Klasik (20cm)')).toBe(
      'spikoe-kenari-klasik-20cm',
    );
    expect(slugifyCatalogName('  Chiffon Keju — Spesial!  ')).toBe(
      'chiffon-keju-spesial',
    );
    expect(slugifyCatalogName('Crème Brûlée Tart')).toBe('creme-brulee-tart');
  });

  it('detects self-parenting and multi-hop category ancestry cycles', () => {
    const categories = [
      { id: 'cat-a', parentId: null },
      { id: 'cat-b', parentId: 'cat-a' },
      { id: 'cat-c', parentId: 'cat-b' },
      { id: 'cat-d', parentId: null },
    ];

    expect(wouldCreateCategoryCycle('cat-a', 'cat-a', categories)).toBe(true);
    expect(wouldCreateCategoryCycle('cat-a', 'cat-b', categories)).toBe(true);
    expect(wouldCreateCategoryCycle('cat-a', 'cat-c', categories)).toBe(true);
    expect(wouldCreateCategoryCycle('cat-a', 'cat-d', categories)).toBe(false);
    expect(wouldCreateCategoryCycle('cat-b', null, categories)).toBe(false);
  });

  it('detects non-archived child categories accurately', () => {
    const tree = [
      { id: 'parent', parentId: null, status: 'published' },
      { id: 'child-arch', parentId: 'parent', status: 'archived' },
      { id: 'child-draft', parentId: 'parent', status: 'draft' },
    ];

    expect(hasActiveCategoryChildren('parent', tree)).toBe(true);
    expect(
      hasActiveCategoryChildren(
        'parent',
        tree.filter((node) => node.id !== 'child-draft'),
      ),
    ).toBe(false);
  });

  it('clamps pagination safely after archiving the last item on page > 1', () => {
    expect(clampAdminPageAfterRemoval(2, 0, 10, 10)).toBe(1);
    expect(clampAdminPageAfterRemoval(3, 0, 11, 10)).toBe(2);
    expect(clampAdminPageAfterRemoval(2, 2, 12, 10)).toBe(2);
    expect(clampAdminPageAfterRemoval(1, 0, 0, 10)).toBe(1);
  });

  it('escapes LIKE wildcards cleanly for literal search safety', () => {
    expect(escapeLiteralSearchPattern("100%_cake\\'test")).toBe(
      "100\\%\\_cake\\\\'test",
    );
  });

  it('enforces strict boundary schemas (no price on product row, no extra keys, expectedUpdatedAt required)', () => {
    const prodWithPrice = createAdminProductSchema.safeParse({
      name: 'Spikoe Test',
      slug: 'spikoe-test',
      productType: 'simple',
      shortDescription: null,
      description: null,
      ingredientsInfo: null,
      storageInstructions: null,
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      needsOwnerReview: true,
      sortOrder: 0,
      price_idr: 150_000,
    });
    expect(prodWithPrice.success).toBe(false);

    const catUpdateMissingVersion = updateAdminCategorySchema.safeParse({
      name: 'Kue Kering',
      parentId: null,
      description: null,
      sortOrder: 1,
      status: 'draft',
    });
    expect(catUpdateMissingVersion.success).toBe(false);

    const catWithSlugPatch = updateAdminCategorySchema.safeParse({
      name: 'Kue Kering',
      slug: 'mutated-slug',
      parentId: null,
      description: null,
      sortOrder: 1,
      status: 'draft',
      expectedUpdatedAt: '2026-11-13T00:00:00Z',
    });
    expect(catWithSlugPatch.success).toBe(false);

    const prodUpdateMissingVersion = updateAdminProductSchema.safeParse({
      name: 'Spikoe Updated',
      productType: 'simple',
      status: 'draft',
      shortDescription: null,
      description: null,
      ingredientsInfo: null,
      storageInstructions: null,
      isFeatured: false,
      isBestSeller: false,
      isNew: false,
      needsOwnerReview: true,
      sortOrder: 0,
    });
    expect(prodUpdateMissingVersion.success).toBe(false);

    expect(
      createAdminCategorySchema.safeParse({
        name: 'A',
        slug: 'INVALID SLUG!',
        parentId: null,
        description: null,
        sortOrder: 0,
        status: 'draft',
      }).success,
    ).toBe(false);

    expect(
      archiveAdminEntitySchema.safeParse({
        expectedUpdatedAt: '2026-11-13T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});
