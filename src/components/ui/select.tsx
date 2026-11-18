'use client';

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';

import {
  DropdownSelect,
  type DropdownOption,
} from '@/components/ui/dropdown-select';
import { cn } from '@/utils';

interface SelectProps extends ComponentPropsWithRef<'select'> {
  sizeVariant?: 'regular' | 'compact';
  menuPlacement?: 'bottom' | 'top';
}

function extractTextContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextContent).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }
  return '';
}

function parseOptionsFromChildren(children: ReactNode): DropdownOption[] {
  const options: DropdownOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;

    if (child.type === Fragment) {
      options.push(...parseOptionsFromChildren(child.props.children));
      return;
    }

    if (child.type === 'option') {
      const optionProps = child.props as ComponentPropsWithRef<'option'>;
      const label = extractTextContent(optionProps.children)
        .replace(/\s+/g, ' ')
        .trim();
      const optionValue =
        optionProps.value !== undefined ? String(optionProps.value) : label;

      options.push({
        value: optionValue,
        label,
        disabled: Boolean(optionProps.disabled),
      });
    }
  });

  return options;
}

export function Select({
  className,
  sizeVariant = 'regular',
  menuPlacement = 'bottom',
  children,
  id,
  name,
  value,
  defaultValue,
  disabled = false,
  required,
  onChange,
  onBlur,
  onFocus,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...restSelectProps
}: SelectProps) {
  const nativeSelectRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const options = useMemo(() => parseOptionsFromChildren(children), [children]);

  const [uncontrolledValue, setUncontrolledValue] = useState<string>(() => {
    if (defaultValue !== undefined) return String(defaultValue);
    return options[0]?.value ?? '';
  });

  useEffect(() => {
    if (value !== undefined || !nativeSelectRef.current) return;
    const domValue = nativeSelectRef.current.value;
    setUncontrolledValue((prev) => (prev !== domValue ? domValue : prev));
  }, [value, options]);

  const assignSelectRef = (node: HTMLSelectElement | null) => {
    nativeSelectRef.current = node;
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(node);
    } else {
      ref.current = node;
    }
  };

  const resolvedValue =
    value !== undefined
      ? Array.isArray(value)
        ? (value[0] ?? '')
        : String(value)
      : uncontrolledValue;

  const handleDropdownChange = (nextValue: string) => {
    const selectEl = nativeSelectRef.current;
    if (!selectEl) return;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeSetter?.call(selectEl, nextValue);
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (
    <div className={cn('ui-select-wrap', className)}>
      <select
        {...restSelectProps}
        ref={assignSelectRef}
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="ui-select-native"
        onFocus={(event) => {
          onFocus?.(event);
          triggerRef.current?.focus();
        }}
        onBlur={onBlur}
        onChange={(event) => {
          if (value === undefined) {
            setUncontrolledValue(event.target.value);
          }
          onChange?.(event);
        }}
      >
        {children}
      </select>

      <DropdownSelect
        id={id}
        variant="field"
        sizeVariant={sizeVariant}
        menuPlacement={menuPlacement}
        onTriggerNode={(node) => {
          triggerRef.current = node;
        }}
        options={options}
        value={resolvedValue}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        onBlur={() => {
          nativeSelectRef.current?.dispatchEvent(
            new FocusEvent('focusout', { bubbles: true }),
          );
        }}
        onChange={handleDropdownChange}
      />
    </div>
  );
}
