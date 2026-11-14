'use client';

import { Check, ChevronDown } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/utils';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownSelectProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  leadingIcon?: ReactNode;
}

export function DropdownSelect({
  options,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  'aria-label': ariaLabel,
  className,
  leadingIcon,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);
  const enabledOptions = options.filter((opt) => !opt.disabled);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const idx = enabledOptions.findIndex((opt) => opt.value === value);
        setActiveIndex(idx >= 0 ? idx : 0);
      }
      return next;
    });
  };

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        const idx = enabledOptions.findIndex((opt) => opt.value === value);
        setActiveIndex(idx >= 0 ? idx : 0);
        return;
      }
      setActiveIndex((prev) => {
        if (enabledOptions.length === 0) return -1;
        if (event.key === 'ArrowDown') {
          return (prev + 1) % enabledOptions.length;
        }
        return (prev - 1 + enabledOptions.length) % enabledOptions.length;
      });
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      const target = enabledOptions[activeIndex];
      if (target) handleSelect(target);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('ui-dropdown', open && 'is-open', className)}
    >
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        className="ui-dropdown-trigger"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
      >
        {leadingIcon ? (
          <span className="ui-dropdown-leading" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className="ui-dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="ui-dropdown-chevron"
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="ui-dropdown-menu"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            const enabledIdx = enabledOptions.findIndex(
              (o) => o.value === option.value,
            );
            const isActive = enabledIdx >= 0 && enabledIdx === activeIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                className={cn(
                  'ui-dropdown-option',
                  isSelected && 'is-selected',
                  isActive && 'is-active',
                  option.disabled && 'is-disabled',
                )}
                onClick={() => handleSelect(option)}
              >
                <span className="ui-dropdown-option-label">{option.label}</span>
                {isSelected ? (
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="ui-dropdown-check"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
