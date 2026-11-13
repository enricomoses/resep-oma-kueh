import { describe, expect, it } from 'vitest';

import {
  ADMIN_MEDIA_BUCKETS,
  detectImageFormatFromMagicBytes,
  isSafeStoragePathForBucket,
  sanitizeOriginalFileName,
} from '@/utils/admin-media';
import {
  buildPublicPreviewProductDto,
  validateProductConfiguration,
} from '@/utils/admin-product-editor';
import type {
  AdminCategoryItem,
  AdminReferenceComponentVariant,
  AdminReferenceDietaryTag,
  SaveProductConfigurationInput,
} from '@/types/admin-catalog';

const CAT_PUB_ID = 'c1700000-0000-4000-8000-000000000001';
const CAT_DRAFT_ID = 'c1700000-0000-4000-8000-000000000002';
const PROD_ID = 'a1700000-0000-4000-8000-000000000001';
const OWNER_ID = 'a0700000-0000-4000-8000-000000000001';
const GF_TAG_ID = 'd1700000-0000-4000-8000-000000000001';

const COMP_CHEESE_PROD = 'a1700000-0000-4000-8000-000000000101';
const COMP_CHOCO_PROD = 'a1700000-0000-4000-8000-000000000102';
const COMP_PANDAN_PROD = 'a1700000-0000-4000-8000-000000000103';
const COMP_MOCHA_PROD = 'a1700000-0000-4000-8000-000000000104';

const COMP_CHEESE_VAR = 'b1700000-0000-4000-8000-000000000101';
const COMP_CHOCO_VAR = 'b1700000-0000-4000-8000-000000000102';
const COMP_PANDAN_VAR = 'b1700000-0000-4000-8000-000000000103';
const COMP_MOCHA_VAR = 'b1700000-0000-4000-8000-000000000104';
const COMP_BUNDLE_VAR = 'b1700000-0000-4000-8000-000000000105';
const COMP_SELF_VAR = 'b1700000-0000-4000-8000-000000000106';

const categoriesById = new Map<string, AdminCategoryItem>([
  [
    CAT_PUB_ID,
    {
      id: CAT_PUB_ID,
      name: 'Chiffon Cake',
      slug: 'chiffon-cake',
      parentId: null,
      parentName: null,
      description: null,
      sortOrder: 10,
      status: 'published',
      childCount: 0,
      productRefCount: 1,
      createdAt: '2026-11-11T00:00:00Z',
      updatedAt: '2026-11-11T00:00:00Z',
    },
  ],
  [
    CAT_DRAFT_ID,
    {
      id: CAT_DRAFT_ID,
      name: 'Musiman Draf',
      slug: 'musiman-draf',
      parentId: null,
      parentName: null,
      description: null,
      sortOrder: 20,
      status: 'draft',
      childCount: 0,
      productRefCount: 0,
      createdAt: '2026-11-11T00:00:00Z',
      updatedAt: '2026-11-11T00:00:00Z',
    },
  ],
]);

const dietaryTagsById = new Map<string, AdminReferenceDietaryTag>([
  [
    GF_TAG_ID,
    {
      id: GF_TAG_ID,
      slug: 'gluten-free',
      name: 'Gluten-Free',
      description: 'Teruji bebas gluten',
    },
  ],
]);

function makeComp(
  id: string,
  productId: string,
  sku: string,
  name: string,
  opts?: Partial<AdminReferenceComponentVariant>,
): AdminReferenceComponentVariant {
  return {
    id,
    productId,
    productName: name,
    productSlug: sku.toLowerCase(),
    productStatus: 'published',
    productType: 'simple',
    sku,
    variantName: name,
    sizeLabel: 'Slice',
    basePriceIdr: 25_000,
    status: 'active',
    isGlutenFreeVerified: true,
    listedBranchCount: 2,
    ...opts,
  };
}

const componentVariantsById = new Map<string, AdminReferenceComponentVariant>([
  [
    COMP_CHEESE_VAR,
    makeComp(COMP_CHEESE_VAR, COMP_CHEESE_PROD, 'CMP-CHS', 'Cheese'),
  ],
  [
    COMP_CHOCO_VAR,
    makeComp(COMP_CHOCO_VAR, COMP_CHOCO_PROD, 'CMP-CHC', 'Choco'),
  ],
  [
    COMP_PANDAN_VAR,
    makeComp(COMP_PANDAN_VAR, COMP_PANDAN_PROD, 'CMP-PND', 'Pandan', {
      isGlutenFreeVerified: false,
    }),
  ],
  [
    COMP_MOCHA_VAR,
    makeComp(COMP_MOCHA_VAR, COMP_MOCHA_PROD, 'CMP-MCH', 'Mocha'),
  ],
  [
    COMP_BUNDLE_VAR,
    makeComp(
      COMP_BUNDLE_VAR,
      'a1700000-0000-4000-8000-000000000199',
      'CMP-BND',
      'Nested Bundle',
      {
        productType: 'bundle',
      },
    ),
  ],
  [COMP_SELF_VAR, makeComp(COMP_SELF_VAR, PROD_ID, 'SELF-1', 'Self Ref')],
]);

function createValidBaseInput(): SaveProductConfigurationInput {
  const variantId = 'b1700000-0000-4000-8000-000000000001';
  const imgId = 'e2700000-0000-4000-8000-000000000001';
  return {
    expectedUpdatedAt: '2026-11-12T00:00:00Z',
    product: {
      name: 'Chiffon Pandan Spesial',
      productType: 'simple',
      status: 'published',
      shortDescription: 'Lembut dan wangi pandan.',
      description: 'Kue chiffon panggang harian.',
      ingredientsInfo: null,
      storageInstructions: null,
      isFeatured: true,
      isBestSeller: false,
      isNew: true,
      needsOwnerReview: false,
      sortOrder: 10,
    },
    categories: [{ categoryId: CAT_PUB_ID, isPrimary: true }],
    variants: [
      {
        id: variantId,
        sku: 'ROK-PANDAN-20',
        name: '20 cm',
        sizeLabel: '20 cm',
        basePriceIdr: 145_000,
        status: 'active',
        sortOrder: 10,
        maxQuantityPerOrder: 10,
        isDefault: true,
        bundleRecipe: null,
        bundleUnitsTotal: null,
        bundleRulesVerified: false,
        fixedComponents: [],
        optionGroups: [],
        dietaryTags: [
          {
            dietaryTagId: GF_TAG_ID,
            verificationStatus: 'verified',
            verifiedAt: '2026-11-12T00:00:00Z',
            note: 'Diverifikasi dari sertifikat tepung mocaf batch Nov 2026.',
          },
        ],
        allergens: [],
      },
    ],
    images: [
      {
        id: imgId,
        variantId: null,
        storageBucket: 'product-images',
        storagePath: 'approved/a1700000-0000-4000-8000-000000000001.jpg',
        altText: 'Chiffon Pandan Spesial ukuran 20 cm',
        isApproved: true,
        isPrimary: true,
        sortOrder: 10,
      },
    ],
  };
}

describe('admin media security helpers', () => {
  it('recognizes valid image signatures and rejects disguised SVG or unknown binaries', () => {
    expect(
      detectImageFormatFromMagicBytes(
        Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]),
      ),
    ).toBe('jpeg');
    expect(
      detectImageFormatFromMagicBytes(
        Uint8Array.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
        ]),
      ),
    ).toBe('png');
    expect(
      detectImageFormatFromMagicBytes(
        new TextEncoder().encode(
          '\uFEFF  <?xml version="1.0"?><svg onload="alert(1)"></svg>',
        ),
      ),
    ).toBe('svg');
    expect(
      detectImageFormatFromMagicBytes(
        new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      ),
    ).toBe('svg');
    expect(
      detectImageFormatFromMagicBytes(
        new TextEncoder().encode('MZ\x90\x00notanimage'),
      ),
    ).toBe('unknown');
  });

  it('rejects path traversal, encoding bypasses, and invalid storage bucket prefixes', () => {
    const validDraft = `${OWNER_ID}/drafts/a1700000-0000-4000-8000-000000000001.webp`;
    const validApproved = 'approved/a1700000-0000-4000-8000-000000000001.jpg';

    expect(
      isSafeStoragePathForBucket(ADMIN_MEDIA_BUCKETS.DRAFTS, validDraft),
    ).toBe(true);
    expect(
      isSafeStoragePathForBucket(
        ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
        validApproved,
      ),
    ).toBe(true);
    expect(
      isSafeStoragePathForBucket(
        ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
        '../approved/a1700000-0000-4000-8000-000000000001.jpg',
      ),
    ).toBe(false);
    expect(
      isSafeStoragePathForBucket(
        ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
        'approved/%2e%2e/secret.jpg',
      ),
    ).toBe(false);
    expect(
      isSafeStoragePathForBucket(
        ADMIN_MEDIA_BUCKETS.PRODUCT_IMAGES,
        validDraft,
      ),
    ).toBe(false);
    expect(sanitizeOriginalFileName('../../etc/passwd<script>.png')).toBe(
      'passwdscript.png',
    );
  });
});

describe('validateProductConfiguration', () => {
  it('accepts valid publishable configuration', () => {
    const errors = validateProductConfiguration(createValidBaseInput(), {
      productId: PROD_ID,
      categoriesById,
      dietaryTagsById,
      componentVariantsById,
      requireApprovedBucketWhenApproved: true,
    });
    expect(errors).toEqual({});
  });

  it('rejects duplicate SKU, duplicate primary category, multiple default variants, and missing dietary evidence', () => {
    const base = createValidBaseInput();
    base.product.productType = 'variants';
    base.categories.push({ categoryId: CAT_DRAFT_ID, isPrimary: true });
    base.variants.push({
      ...base.variants[0],
      id: 'b1700000-0000-4000-8000-000000000002',
      isDefault: true,
      dietaryTags: [
        {
          dietaryTagId: GF_TAG_ID,
          verificationStatus: 'verified',
          verifiedAt: '2026-11-12T00:00:00Z',
          note: '',
        },
      ],
    });

    const errors = validateProductConfiguration(base, {
      productId: PROD_ID,
      categoriesById,
      dietaryTagsById,
      componentVariantsById,
    });

    expect(errors.categories).toBeDefined();
    expect(errors['variants.1.sku']).toBeDefined();
    expect(errors.variants).toBeDefined();
    expect(errors['variants.1.dietaryTags.0.note']).toBeDefined();
  });

  it('enforces bundle 12-slice rules, rejects nested/self components, and blocks GF verified on unverified components', () => {
    const base = createValidBaseInput();
    base.product.productType = 'bundle';
    base.variants[0] = {
      ...base.variants[0],
      bundleRecipe: 'chiffon_mix',
      bundleUnitsTotal: 15,
      bundleRulesVerified: true,
      fixedComponents: [
        {
          id: 'f1700000-0000-4000-8000-000000000001',
          componentVariantId: COMP_CHEESE_VAR,
          componentSlot: 'cheese',
          quantity: 3,
          sortOrder: 10,
        },
        {
          id: 'f1700000-0000-4000-8000-000000000002',
          componentVariantId: COMP_SELF_VAR,
          componentSlot: 'choco',
          quantity: 3,
          sortOrder: 20,
        },
      ],
      optionGroups: [
        {
          id: 'a2700000-0000-4000-8000-000000000001',
          name: 'Pilihan 1',
          minSelect: 1,
          maxSelect: 1,
          quantityPerSelection: 3,
          sortOrder: 10,
          isRequired: true,
          choices: [
            {
              id: 'c2700000-0000-4000-8000-000000000001',
              label: 'Pandan (non-GF)',
              componentVariantId: COMP_PANDAN_VAR,
              priceDeltaIdr: 5000,
              isActive: true,
              sortOrder: 10,
            },
          ],
        },
        {
          id: 'a2700000-0000-4000-8000-000000000002',
          name: 'Pilihan 2',
          minSelect: 1,
          maxSelect: 1,
          quantityPerSelection: 3,
          sortOrder: 20,
          isRequired: true,
          choices: [
            {
              id: 'c2700000-0000-4000-8000-000000000002',
              label: 'Bundle Nested',
              componentVariantId: COMP_BUNDLE_VAR,
              priceDeltaIdr: 0,
              isActive: true,
              sortOrder: 10,
            },
          ],
        },
      ],
    };

    const errors = validateProductConfiguration(base, {
      productId: PROD_ID,
      categoriesById,
      dietaryTagsById,
      componentVariantsById,
    });

    expect(errors['variants.0.bundleUnitsTotal']).toBeDefined();
    expect(
      errors['variants.0.fixedComponents.1.componentVariantId'],
    ).toBeDefined();
    expect(
      errors['variants.0.optionGroups.1.choices.0.componentVariantId'],
    ).toBeDefined();
    expect(errors['variants.0.dietaryTags.0.verificationStatus']).toBeDefined();
  });

  it('builds live public preview DTO using shared effective price calculator', () => {
    const config = createValidBaseInput();
    config.product.productType = 'bundle';
    config.variants[0].basePriceIdr = 210_000;
    config.variants[0].bundleRecipe = 'chiffon_mix';
    config.variants[0].bundleUnitsTotal = 12;
    config.variants[0].bundleRulesVerified = true;
    config.variants[0].optionGroups = [
      {
        id: 'a2700000-0000-4000-8000-000000000001',
        name: 'Grup 1',
        minSelect: 1,
        maxSelect: 1,
        quantityPerSelection: 3,
        sortOrder: 10,
        isRequired: true,
        choices: [
          {
            id: 'c2700000-0000-4000-8000-000000000001',
            label: 'Mocha',
            componentVariantId: COMP_MOCHA_VAR,
            priceDeltaIdr: 12_000,
            isActive: true,
            sortOrder: 10,
          },
        ],
      },
    ];

    const { cardProduct, previewImageUrl } = buildPublicPreviewProductDto({
      productId: PROD_ID,
      slug: 'chiffon-pandan-spesial',
      config,
      categoriesById,
      dietaryTagsById,
      previewImages: [
        {
          id: config.images[0].id,
          isPrimary: true,
          isApproved: true,
          sortOrder: 10,
          altText: config.images[0].altText,
          previewUrl: 'https://example.test/approved.jpg',
        },
      ],
    });

    expect(cardProduct.fromPriceIdr).toBe(222_000);
    expect(previewImageUrl).toBe('https://example.test/approved.jpg');
    expect(cardProduct.verifiedDietaryTags).toEqual([
      { slug: 'gluten-free', name: 'Gluten-Free' },
    ]);
  });
});
