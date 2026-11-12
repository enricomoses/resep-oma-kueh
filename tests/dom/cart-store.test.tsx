import { beforeEach, describe, expect, it } from 'vitest';
import { CART_LIMITS, CART_STORAGE } from '@/constants/cart.constant';
import { useCartStore } from '@/stores/cart.store';
import { createCartLineSignature } from '@/validations/cart.schema';

const BRANCH_SBY = '11111111-1111-4111-8111-111111111111';
const BRANCH_BTR = '22222222-2222-4222-8222-222222222222';
const VARIANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VARIANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CHOICE_1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CHOICE_2 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('Cart Store Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
    useCartStore.getState().setBranch(null, null);
    useCartStore.getState().setHydrated(true);
  });

  it('adds an item to an empty cart and generates canonical signature', () => {
    const result = useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      branchCode: 'surabaya',
      variantId: VARIANT_A,
      choiceIds: [CHOICE_2, CHOICE_1], // unordered
      quantity: 2,
    });

    expect(result.success).toBe(true);
    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(1);
    expect(state.branchId).toBe(BRANCH_SBY);
    expect(state.branchCode).toBe('surabaya');

    const expectedSig = createCartLineSignature(BRANCH_SBY, VARIANT_A, [
      CHOICE_1,
      CHOICE_2,
    ]);
    expect(state.lines[0].id).toBe(expectedSig);
    expect(state.lines[0].quantity).toBe(2);
    expect(state.lines[0].choiceIds).toEqual([CHOICE_1, CHOICE_2]);
  });

  it('merges quantity for items with identical signatures', () => {
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      choiceIds: [CHOICE_1],
      quantity: 3,
    });

    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      choiceIds: [CHOICE_1],
      quantity: 4,
    });

    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(7);
  });

  it('creates distinct lines for items with different option choices', () => {
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      choiceIds: [CHOICE_1],
      quantity: 1,
    });

    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      choiceIds: [CHOICE_2],
      quantity: 1,
    });

    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(2);
    expect(state.lines[0].choiceIds).toEqual([CHOICE_1]);
    expect(state.lines[1].choiceIds).toEqual([CHOICE_2]);
  });

  it('enforces maximum quantity limit of 99 per line', () => {
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      quantity: 90,
    });

    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      quantity: 20,
    });

    const state = useCartStore.getState();
    expect(state.lines[0].quantity).toBe(CART_LIMITS.MAX_QTY_PER_LINE);
  });

  it('enforces maximum distinct line limit of 15', () => {
    for (let i = 0; i < CART_LIMITS.MAX_DISTINCT_LINES; i++) {
      const variantId = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
      const result = useCartStore.getState().addLine({
        branchId: BRANCH_SBY,
        variantId,
        quantity: 1,
      });
      expect(result.success).toBe(true);
    }

    expect(useCartStore.getState().lines).toHaveLength(15);

    // 16th distinct line should be rejected
    const extraResult = useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      quantity: 1,
    });

    expect(extraResult.success).toBe(false);
    if (!extraResult.success) {
      expect(extraResult.reason).toBe('max_lines_exceeded');
    }
    expect(useCartStore.getState().lines).toHaveLength(15);
  });

  it('updates quantity and removes line if quantity becomes <= 0', () => {
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      quantity: 5,
    });

    const lineId = useCartStore.getState().lines[0].id;
    useCartStore.getState().updateQuantity(lineId, 10);
    expect(useCartStore.getState().lines[0].quantity).toBe(10);

    // Update to 0 removes line
    useCartStore.getState().updateQuantity(lineId, 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it('removes specific line via removeLine', () => {
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      quantity: 1,
    });
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_B,
      quantity: 2,
    });

    expect(useCartStore.getState().lines).toHaveLength(2);
    const lineAId = useCartStore.getState().lines[0].id;

    useCartStore.getState().removeLine(lineAId);
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].variantId).toBe(VARIANT_B);
  });

  it('updates branch and re-keys lines upon branch switch without deleting items', () => {
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      branchCode: 'surabaya',
      variantId: VARIANT_A,
      choiceIds: [CHOICE_1],
      quantity: 2,
    });

    expect(useCartStore.getState().branchId).toBe(BRANCH_SBY);

    // Switch branch to Bintaro
    useCartStore.getState().setBranch(BRANCH_BTR, 'bintaro');

    const state = useCartStore.getState();
    expect(state.branchId).toBe(BRANCH_BTR);
    expect(state.branchCode).toBe('bintaro');
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].branchId).toBe(BRANCH_BTR);

    const expectedNewSig = createCartLineSignature(BRANCH_BTR, VARIANT_A, [
      CHOICE_1,
    ]);
    expect(state.lines[0].id).toBe(expectedNewSig);
    expect(state.lines[0].quantity).toBe(2);
  });

  it('recovers transparently from corrupted localStorage without throwing', () => {
    // Write invalid JSON to localStorage
    localStorage.setItem(CART_STORAGE.KEY, '{"version": 999, "corrupt": true}');

    void useCartStore.persist.rehydrate();

    const state = useCartStore.getState();
    expect(state.lines).toEqual([]);
    expect(state.branchId).toBeNull();
  });

  it('handles multi-tab storage synchronization event', () => {
    // Add item in current tab
    useCartStore.getState().addLine({
      branchId: BRANCH_SBY,
      variantId: VARIANT_A,
      quantity: 1,
    });

    // Simulate other tab clearing cart via storage event
    const storageEvent = new StorageEvent('storage', {
      key: CART_STORAGE.KEY,
      newValue: null,
    });
    window.dispatchEvent(storageEvent);

    expect(useCartStore.getState().lines).toHaveLength(0);
  });
});
