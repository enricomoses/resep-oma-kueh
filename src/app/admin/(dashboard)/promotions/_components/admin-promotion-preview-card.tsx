'use client';

import { Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatIdr } from '@/utils';
import type { PromotionPreviewScenario } from '@/utils/admin-promotions';

interface AdminPromotionPreviewCardProps {
  previewExamples: PromotionPreviewScenario[];
}

/** Live calculation preview card powered by the shared promotion pricing engine. */
export function AdminPromotionPreviewCard({
  previewExamples,
}: AdminPromotionPreviewCardProps) {
  return (
    <Card tone="cream" className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-burgundy" aria-hidden="true" />
        <h3 className="text-sm font-semibold">
          Pratinjau Perhitungan Shared Engine
        </h3>
      </div>
      <ul className="space-y-1 text-xs">
        {previewExamples.map((scenario) => (
          <li
            key={`${scenario.unitPriceIdr}-${scenario.quantity}`}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-sand)]/60 pb-1 last:border-b-0"
          >
            <span>
              {scenario.quantity} × {formatIdr(scenario.unitPriceIdr)} (Bruto{' '}
              {formatIdr(scenario.lineGrossIdr)})
            </span>
            <span className="font-medium">
              {scenario.formattedSummary}
              {scenario.wasCapped ? ' [Batas Maks/Baris]' : ''}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
