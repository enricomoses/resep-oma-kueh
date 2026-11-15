'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  type AriaAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { cn } from '@/utils';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownSelectProps {
  id?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'pill' | 'field';
  sizeVariant?: 'regular' | 'compact';
  onTriggerNode?: (node: HTMLButtonElement | null) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  onBlur?: () => void;
  className?: string;
  leadingIcon?: ReactNode;
}

export function DropdownSelect({
  id,
  options,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  variant = 'pill',
  sizeVariant = 'regular',
  onTriggerNode,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  onBlur,
  className,
  leadingIcon,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listboxId = useId();

  const assignTriggerRef = (node: HTMLButtonElement | null) => {
    internalTriggerRef.current = node;
    onTriggerNode?.(node);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const enabledOptions = options.filter((opt) => !opt.disabled);
  const isField = variant === 'field';
  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || (options[0]?.label ?? '');

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        internalTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onBlur]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const activeEnabled = enabledOptions[activeIndex];
    if (!activeEnabled) return;
    const optionIndex = options.findIndex(
      (opt) => opt.value === activeEnabled.value,
    );
    optionRefs.current[optionIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, enabledOptions, options]);

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
    internalTriggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
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
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      if (enabledOptions.length > 0) setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      if (enabledOptions.length > 0) setActiveIndex(enabledOptions.length - 1);
    } else if (
      (event.key === 'Enter' || event.key === ' ') &&
      open &&
      activeIndex >= 0
    ) {
      event.preventDefault();
      const target = enabledOptions[activeIndex];
      if (target) handleSelect(target);
    } else if (event.key === 'Tab' && open) {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'ui-dropdown',
        isField && 'ui-dropdown--field',
        open && 'is-open',
        className,
      )}
    >
      <button
        ref={assignTriggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        className={cn(
          isField
            ? [
                'ui-control ui-dropdown-field-trigger',
                sizeVariant === 'compact' && 'ui-control--compact',
              ]
            : 'ui-dropdown-trigger',
        )}
        onClick={handleToggle}
        onBlur={(event) => {
          if (
            onBlur &&
            !containerRef.current?.contains(event.relatedTarget as Node | null)
          ) {
            onBlur();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {leadingIcon ? (
          <span className="ui-dropdown-leading" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span
          className={cn(
            isField ? 'ui-dropdown-field-value' : 'ui-dropdown-value',
          )}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={isField ? 18 : 16}
          aria-hidden="true"
          className="ui-dropdown-chevron"
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : ariaLabelledBy}
          className={cn(
            'ui-dropdown-menu',
            isField && 'ui-dropdown-menu--field',
          )}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const enabledIdx = enabledOptions.findIndex(
              (o) => o.value === option.value,
            );
            const isActive = enabledIdx >= 0 && enabledIdx === activeIndex;

            return (
              <li
                key={`${option.value}-${index}`}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                className={cn(
                  'ui-dropdown-option',
                  isSelected && 'is-selected',
                  isActive && 'is-active',
                  option.disabled && 'is-disabled',
                )}
                onMouseEnter={() => {
                  if (!option.disabled && enabledIdx >= 0) {
                    setActiveIndex(enabledIdx);
                  }
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
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
