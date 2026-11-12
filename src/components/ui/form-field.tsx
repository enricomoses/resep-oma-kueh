'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';

import { UI_COPY } from '@/constants/ui.constant';
import { cn } from '@/utils';

interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
}
interface FormFieldProps {
  id?: string;
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
}
export function FormField({
  id: providedId,
  label,
  helper,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy =
    [helper && `${id}-helper`, error && `${id}-error`]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={cn('ui-field', className)}>
      <label htmlFor={id} className="ui-field-label">
        {label}
        {required ? ` ${UI_COPY.REQUIRED}` : ''}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })}
      {helper ? (
        <p id={`${id}-helper`} className="ui-field-note">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="ui-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
