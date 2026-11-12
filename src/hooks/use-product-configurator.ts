'use client';

import { useMemo, useState } from 'react';
import { validateBundleConfiguration } from '@/utils/bundle';
import type {
  BundleBreakdownItem,
  BundleValidationError,
  BundleValidationResult,
  ProductDetailVariant,
} from '@/types/catalog';

export interface UseProductConfiguratorOptions {
  bundleVariant: ProductDetailVariant | null;
  branchId?: string | null;
  initialSelections?: string[];
}

export interface UseProductConfiguratorResult {
  selectedChoiceIds: string[];
  selectChoice: (groupId: string, choiceId: string) => void;
  resetSelections: () => void;
  isChoiceSelected: (choiceId: string) => boolean;
  validationResult: BundleValidationResult | null;
  isComplete: boolean;
  unitGrossIdr: number;
  effectivePriceIdr: number;
  choiceDeltasTotalIdr: number;
  missingChoicesCount: number;
  totalRequiredChoicesCount: number;
  errors: BundleValidationError[];
  breakdown: BundleBreakdownItem[];
  bundleSignature: string | null;
}

export function useProductConfigurator({
  bundleVariant,
  branchId,
  initialSelections = [],
}: UseProductConfiguratorOptions): UseProductConfiguratorResult {
  const [selectedChoiceIds, setSelectedChoiceIds] =
    useState<string[]>(initialSelections);

  const selectChoice = (groupId: string, choiceId: string) => {
    if (!bundleVariant) return;

    const group = bundleVariant.optionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const groupChoiceIds = new Set(group.choices.map((c) => c.id));
    const isCurrentlySelected = selectedChoiceIds.includes(choiceId);

    if (group.maxSelect === 1) {
      if (isCurrentlySelected) {
        // Toggle off if already selected
        setSelectedChoiceIds((prev) => prev.filter((id) => id !== choiceId));
      } else {
        // Replace previous choice from this single-select group
        setSelectedChoiceIds((prev) => [
          ...prev.filter((id) => !groupChoiceIds.has(id)),
          choiceId,
        ]);
      }
    } else {
      if (isCurrentlySelected) {
        setSelectedChoiceIds((prev) => prev.filter((id) => id !== choiceId));
      } else {
        const currentGroupSelectionsCount = selectedChoiceIds.filter((id) =>
          groupChoiceIds.has(id),
        ).length;
        if (currentGroupSelectionsCount < group.maxSelect) {
          setSelectedChoiceIds((prev) => [...prev, choiceId]);
        }
      }
    }
  };

  const resetSelections = () => {
    setSelectedChoiceIds([]);
  };

  const isChoiceSelected = (choiceId: string) => {
    return selectedChoiceIds.includes(choiceId);
  };

  const validationResult = useMemo<BundleValidationResult | null>(() => {
    if (!bundleVariant) return null;
    return validateBundleConfiguration({
      variant: bundleVariant,
      selectedChoiceIds,
      branchId,
    });
  }, [bundleVariant, selectedChoiceIds, branchId]);

  const totalRequiredChoicesCount = useMemo(() => {
    if (!bundleVariant) return 0;
    return bundleVariant.optionGroups.reduce((acc, g) => acc + g.minSelect, 0);
  }, [bundleVariant]);

  const missingChoicesCount = useMemo(() => {
    if (!validationResult) return totalRequiredChoicesCount;
    const selectedCount = validationResult.selectedChoices.length;
    return Math.max(0, totalRequiredChoicesCount - selectedCount);
  }, [validationResult, totalRequiredChoicesCount]);

  const isComplete = Boolean(validationResult?.isValid);
  const unitGrossIdr =
    validationResult?.unitGrossIdr ?? bundleVariant?.baseOrOverrideIdr ?? 0;
  const effectivePriceIdr =
    validationResult?.effectivePriceIdr ??
    bundleVariant?.effectivePriceIdr ??
    0;
  const choiceDeltasTotalIdr = validationResult?.choiceDeltasTotalIdr ?? 0;
  const errors = validationResult?.errors ?? [];
  const breakdown = validationResult?.breakdown ?? [];
  const bundleSignature = validationResult?.bundleSignature ?? null;

  return {
    selectedChoiceIds,
    selectChoice,
    resetSelections,
    isChoiceSelected,
    validationResult,
    isComplete,
    unitGrossIdr,
    effectivePriceIdr,
    choiceDeltasTotalIdr,
    missingChoicesCount,
    totalRequiredChoicesCount,
    errors,
    breakdown,
    bundleSignature,
  };
}
