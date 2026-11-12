'use client';

import { Minus, Plus } from 'lucide-react';

import { UI_COPY } from '@/constants/ui.constant';
import { cn } from '@/utils';

import { Button } from './button';

interface QuantityProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}
export function Quantity({
  value,
  min = 1,
  max,
  onChange,
  label,
  disabled = false,
  className,
}: QuantityProps) {
  if (
    ![value, min, max].every(Number.isSafeInteger) ||
    min < 0 ||
    min > max ||
    value < min ||
    value > max
  )
    throw new RangeError(UI_COPY.INVALID_QUANTITY);
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('ui-quantity', className)}
    >
      <Button
        variant="ghost"
        disabled={disabled || value <= min}
        aria-label={`${UI_COPY.DECREASE} ${label}`}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={18} aria-hidden="true" />
      </Button>
      <output
        className="ui-quantity-value"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </output>
      <Button
        variant="ghost"
        disabled={disabled || value >= max}
        aria-label={`${UI_COPY.INCREASE} ${label}`}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={18} aria-hidden="true" />
      </Button>
    </div>
  );
}
