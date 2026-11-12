import { describe, expect, it } from 'vitest';
import { CART_LIMITS, CART_STORAGE } from '@/constants/cart.constant';
import {
  cartPersistedLineSchema,
  cartPersistedStateSchema,
  cartValidationRequestSchema,
  createCartLineSignature,
} from '@/validations/cart.schema';

const BRANCH_ID = '11111111-1111-4111-8111-111111111111';
const VARIANT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CHOICE_1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CHOICE_2 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('Cart State & Schema Unit Tests', () => {
  it('generates deterministic signature sorting choiceIds', () => {
    const sig1 = createCartLineSignature(BRANCH_ID, VARIANT_ID, [
      CHOICE_1,
      CHOICE_2,
    ]);
    const sig2 = createCartLineSignature(BRANCH_ID, VARIANT_ID, [
      CHOICE_2,
      CHOICE_1,
    ]);
    expect(sig1).toBe(sig2);
    expect(sig1).toBe(`${BRANCH_ID}:${VARIANT_ID}:${CHOICE_1},${CHOICE_2}`);
  });

  it('validates persisted line schema and rejects quantity > 99', () => {
    const validLine = {
      id: 'sig-1',
      branchId: BRANCH_ID,
      variantId: VARIANT_ID,
      choiceIds: [CHOICE_1],
      quantity: 5,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(cartPersistedLineSchema.safeParse(validLine).success).toBe(true);

    const invalidQty = { ...validLine, quantity: 100 };
    expect(cartPersistedLineSchema.safeParse(invalidQty).success).toBe(false);

    const zeroQty = { ...validLine, quantity: 0 };
    expect(cartPersistedLineSchema.safeParse(zeroQty).success).toBe(false);
  });

  it('validates persisted state schema and rejects invalid version', () => {
    const validState = {
      version: CART_STORAGE.VERSION,
      branchId: BRANCH_ID,
      branchCode: 'surabaya',
      lines: [],
    };
    expect(cartPersistedStateSchema.safeParse(validState).success).toBe(true);

    const invalidVersion = { ...validState, version: 2 };
    expect(cartPersistedStateSchema.safeParse(invalidVersion).success).toBe(
      false,
    );
  });

  it('enforces maximum 15 distinct lines in cart validation request', () => {
    const items = Array.from(
      { length: CART_LIMITS.MAX_DISTINCT_LINES },
      (_, i) => ({
        lineId: `line-${i}`,
        variantId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        choiceIds: [],
        quantity: 1,
      }),
    );

    expect(
      cartValidationRequestSchema.safeParse({ branchId: BRANCH_ID, items })
        .success,
    ).toBe(true);

    const overflowItems = [
      ...items,
      {
        lineId: 'line-overflow',
        variantId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        choiceIds: [],
        quantity: 1,
      },
    ];

    expect(
      cartValidationRequestSchema.safeParse({
        branchId: BRANCH_ID,
        items: overflowItems,
      }).success,
    ).toBe(false);
  });
});
