'use client';

import { cn } from '@/utils';

interface AskOmaQuickPromptsProps {
  prompts: readonly string[];
  ariaLabel: string;
  keyPrefix: string;
  disabled: boolean;
  onSelect: (prompt: string) => void;
  className?: string;
}

export function AskOmaQuickPrompts({
  prompts,
  ariaLabel,
  keyPrefix,
  disabled,
  onSelect,
  className,
}: AskOmaQuickPromptsProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className={cn('chat-quick-prompts', className)} aria-label={ariaLabel}>
      {prompts.map((prompt) => (
        <button
          key={`${keyPrefix}-${prompt}`}
          type="button"
          className="chat-quick-chip"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
