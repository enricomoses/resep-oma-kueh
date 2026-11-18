'use client';

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  type AriaAttributes,
  type ChangeEventHandler,
  type CSSProperties,
  type FocusEventHandler,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  DropdownSelect,
  type DropdownOption,
} from '@/components/ui/dropdown-select';
import { cn } from '@/utils';
import {
  CALENDAR_MONTH_NAMES,
  CALENDAR_WEEKDAYS,
  formatDisplayDate,
  formatIsoDate,
  formatIsoDateTime,
  getCalendarGrid,
  isIsoDateWithinBounds,
  padTwo,
  parseIsoDateParts,
} from '@/utils/calendar';

interface DatePickerProps {
  id?: string;
  name?: string;
  mode?: 'date' | 'datetime';
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  sizeVariant?: 'regular' | 'compact';
  className?: string;
  ref?: Ref<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onValueChange?: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
}

const HOUR_OPTIONS: DropdownOption[] = Array.from({ length: 24 }, (_, idx) => {
  const padded = padTwo(idx);
  return { value: padded, label: padded };
});

const MINUTE_OPTIONS: DropdownOption[] = Array.from(
  { length: 60 },
  (_, idx) => {
    const padded = padTwo(idx);
    return { value: padded, label: padded };
  },
);

const MONTH_OPTIONS: DropdownOption[] = CALENDAR_MONTH_NAMES.map(
  (name, idx) => ({
    value: String(idx),
    label: name,
  }),
);

function getLocalTodayIso(): string {
  const now = new Date();
  return formatIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function DatePicker({
  id,
  name,
  mode = 'date',
  value,
  defaultValue,
  min,
  max,
  placeholder,
  disabled = false,
  required = false,
  sizeVariant = 'regular',
  className,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  onChange,
  onValueChange,
  onBlur,
  onFocus,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [todayIso, setTodayIso] = useState('');
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(
    () => defaultValue ?? '',
  );
  const [viewYear, setViewYear] = useState<number>(() => {
    const parsed = parseIsoDateParts(value ?? defaultValue ?? min ?? '');
    return parsed?.year ?? 2026;
  });
  const [viewMonthIndex, setViewMonthIndex] = useState<number>(() => {
    const parsed = parseIsoDateParts(value ?? defaultValue ?? min ?? '');
    return parsed?.monthIndex ?? 0;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | undefined>(
    undefined,
  );
  const dialogId = useId();

  const resolvedValue = value !== undefined ? value : uncontrolledValue;
  const includeTime = mode === 'datetime';
  const parsedValue = useMemo(
    () => parseIsoDateParts(resolvedValue),
    [resolvedValue],
  );
  const minDatePart = min ? min.slice(0, 10) : undefined;
  const maxDatePart = max ? max.slice(0, 10) : undefined;

  useEffect(() => {
    if (value !== undefined || !nativeInputRef.current) return;
    const domValue = nativeInputRef.current.value;
    if (domValue !== uncontrolledValue) {
      setUncontrolledValue(domValue);
    }
  }, [value, uncontrolledValue]);

  const updatePopoverPosition = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth < 640) {
      setPopoverStyle(undefined);
      return;
    }
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const popoverRect = popoverRef.current?.getBoundingClientRect();
    const popoverWidth = popoverRect?.width || 344;
    const popoverHeight = popoverRect?.height || (includeTime ? 410 : 350);
    const margin = 16;
    const gap = 8;

    const left = Math.max(
      margin,
      Math.min(triggerRect.left, window.innerWidth - popoverWidth - margin),
    );
    const fitsBelow =
      triggerRect.bottom + gap + popoverHeight <= window.innerHeight - margin;
    const top = fitsBelow
      ? triggerRect.bottom + gap
      : Math.max(margin, triggerRect.top - popoverHeight - gap);

    setPopoverStyle({
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      right: 'auto',
      transform: 'none',
      marginInline: 0,
    });
  }, [includeTime]);

  useEffect(() => {
    if (!open) return;

    const rafId = window.requestAnimationFrame(updatePopoverPosition);

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

    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, updatePopoverPosition]);

  const assignInputRef = (node: HTMLInputElement | null) => {
    nativeInputRef.current = node;
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(node);
    } else {
      ref.current = node;
    }
  };

  const emitValue = (nextValue: string) => {
    const inputEl = nativeInputRef.current;
    if (inputEl) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeSetter?.call(inputEl, nextValue);
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const handleOpenToggle = () => {
    if (disabled) return;
    const currentToday = getLocalTodayIso();
    setTodayIso(currentToday);
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const anchor =
          parsedValue ??
          parseIsoDateParts(currentToday || minDatePart || '') ??
          null;
        if (anchor) {
          setViewYear(anchor.year);
          setViewMonthIndex(anchor.monthIndex);
        }
      }
      return next;
    });
  };

  const handlePrevMonth = () => {
    if (viewMonthIndex === 0) {
      setViewYear((y) => y - 1);
      setViewMonthIndex(11);
    } else {
      setViewMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonthIndex === 11) {
      setViewYear((y) => y + 1);
      setViewMonthIndex(0);
    } else {
      setViewMonthIndex((m) => m + 1);
    }
  };

  const handleDaySelect = (day: number) => {
    const isoDate = formatIsoDate(viewYear, viewMonthIndex, day);
    if (!isIsoDateWithinBounds(isoDate, minDatePart, maxDatePart)) return;

    if (includeTime) {
      const hour = parsedValue?.hour ?? '09';
      const minute = parsedValue?.minute ?? '00';
      emitValue(formatIsoDateTime(viewYear, viewMonthIndex, day, hour, minute));
      return;
    }

    emitValue(isoDate);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTimeChange = (nextHour: string, nextMinute: string) => {
    const fallback =
      parsedValue ??
      parseIsoDateParts(todayIso || formatIsoDate(viewYear, viewMonthIndex, 1));
    const targetYear = fallback?.year ?? viewYear;
    const targetMonth = fallback?.monthIndex ?? viewMonthIndex;
    const targetDay = fallback?.day ?? 1;
    emitValue(
      formatIsoDateTime(
        targetYear,
        targetMonth,
        targetDay,
        nextHour,
        nextMinute,
      ),
    );
  };

  const handleTodayClick = () => {
    const targetIso = todayIso || getLocalTodayIso();
    const parsedToday = parseIsoDateParts(targetIso);
    if (!parsedToday) return;
    setViewYear(parsedToday.year);
    setViewMonthIndex(parsedToday.monthIndex);
    if (!isIsoDateWithinBounds(targetIso, minDatePart, maxDatePart)) return;

    if (includeTime) {
      const hour = parsedValue?.hour ?? '09';
      const minute = parsedValue?.minute ?? '00';
      emitValue(
        formatIsoDateTime(
          parsedToday.year,
          parsedToday.monthIndex,
          parsedToday.day,
          hour,
          minute,
        ),
      );
      return;
    }

    emitValue(targetIso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const baseYear = parseIsoDateParts(todayIso)?.year ?? viewYear;
  const minYear = minDatePart
    ? (parseIsoDateParts(minDatePart)?.year ?? baseYear - 5)
    : baseYear - 5;
  const maxYear = maxDatePart
    ? (parseIsoDateParts(maxDatePart)?.year ?? baseYear + 5)
    : baseYear + 5;
  const startYear = Math.min(minYear, viewYear, parsedValue?.year ?? viewYear);
  const endYear = Math.max(maxYear, viewYear, parsedValue?.year ?? viewYear);

  const yearOptions: DropdownOption[] = [];
  for (let y = startYear; y <= endYear; y += 1) {
    yearOptions.push({ value: String(y), label: String(y) });
  }

  const calendarCells = useMemo(
    () => getCalendarGrid(viewYear, viewMonthIndex),
    [viewYear, viewMonthIndex],
  );

  const formattedDisplay = formatDisplayDate(resolvedValue, includeTime);
  const resolvedPlaceholder =
    placeholder ?? (includeTime ? 'Pilih tanggal & waktu' : 'Pilih tanggal');
  const isTodaySelectable =
    Boolean(todayIso) &&
    isIsoDateWithinBounds(todayIso, minDatePart, maxDatePart);

  return (
    <div
      ref={containerRef}
      className={cn('ui-date-picker', open && 'is-open', className)}
    >
      <input
        ref={assignInputRef}
        type="text"
        readOnly
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="ui-date-native"
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
      />

      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-invalid={
          ariaInvalid === true || ariaInvalid === 'true' ? 'true' : undefined
        }
        disabled={disabled}
        className={cn(
          'ui-control ui-date-trigger',
          sizeVariant === 'compact' && 'ui-control--compact',
        )}
        onClick={handleOpenToggle}
        onBlur={(event) => {
          if (
            !containerRef.current?.contains(event.relatedTarget as Node | null)
          ) {
            nativeInputRef.current?.dispatchEvent(
              new FocusEvent('focusout', { bubbles: true }),
            );
          }
        }}
      >
        <span
          className={cn(
            'ui-date-trigger-text',
            !formattedDisplay && 'is-placeholder',
          )}
        >
          {formattedDisplay || resolvedPlaceholder}
        </span>
        <Calendar
          size={18}
          aria-hidden="true"
          className="ui-date-trigger-icon"
        />
      </button>

      {open ? (
        <>
          <div
            className="ui-date-backdrop"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={popoverRef}
            id={dialogId}
            role="dialog"
            aria-label={
              includeTime ? 'Pemilih tanggal dan waktu' : 'Pemilih tanggal'
            }
            style={popoverStyle}
            className="ui-date-popover"
          >
            <div className="ui-date-header">
              <button
                type="button"
                className="ui-date-nav-btn"
                aria-label="Bulan sebelumnya"
                onClick={handlePrevMonth}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              <div className="ui-date-header-selects">
                <DropdownSelect
                  variant="field"
                  sizeVariant="compact"
                  aria-label="Pilih bulan"
                  className="ui-date-month-select"
                  options={MONTH_OPTIONS}
                  value={String(viewMonthIndex)}
                  onChange={(nextMonth) =>
                    setViewMonthIndex(Number.parseInt(nextMonth, 10))
                  }
                />
                <DropdownSelect
                  variant="field"
                  sizeVariant="compact"
                  aria-label="Pilih tahun"
                  className="ui-date-year-select"
                  options={yearOptions}
                  value={String(viewYear)}
                  onChange={(nextYear) =>
                    setViewYear(Number.parseInt(nextYear, 10))
                  }
                />
              </div>

              <button
                type="button"
                className="ui-date-nav-btn"
                aria-label="Bulan berikutnya"
                onClick={handleNextMonth}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="ui-date-weekdays" aria-hidden="true">
              {CALENDAR_WEEKDAYS.map((dayName) => (
                <span key={dayName} className="ui-date-weekday">
                  {dayName}
                </span>
              ))}
            </div>

            <div className="ui-date-grid" role="grid">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return (
                    <span
                      key={`empty-${idx}`}
                      className="ui-date-day-empty"
                      aria-hidden="true"
                    />
                  );
                }

                const cellIso = formatIsoDate(viewYear, viewMonthIndex, day);
                const isSelected =
                  parsedValue !== null &&
                  parsedValue.year === viewYear &&
                  parsedValue.monthIndex === viewMonthIndex &&
                  parsedValue.day === day;
                const isToday = todayIso === cellIso;
                const isOutOfBounds = !isIsoDateWithinBounds(
                  cellIso,
                  minDatePart,
                  maxDatePart,
                );
                const monthLabel = CALENDAR_MONTH_NAMES[viewMonthIndex] ?? '';

                return (
                  <button
                    key={cellIso}
                    type="button"
                    disabled={isOutOfBounds}
                    aria-label={`${day} ${monthLabel} ${viewYear}`}
                    aria-pressed={isSelected}
                    className={cn(
                      'ui-date-day',
                      isSelected && 'is-selected',
                      isToday && 'is-today',
                    )}
                    onClick={() => handleDaySelect(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {includeTime ? (
              <div className="ui-date-time-row">
                <span className="ui-date-time-label">Waktu (WIB)</span>
                <div className="ui-date-time-controls">
                  <DropdownSelect
                    variant="field"
                    sizeVariant="compact"
                    aria-label="Pilih jam"
                    className="ui-date-time-select"
                    options={HOUR_OPTIONS}
                    value={parsedValue?.hour ?? '09'}
                    onChange={(nextHour) =>
                      handleTimeChange(nextHour, parsedValue?.minute ?? '00')
                    }
                  />
                  <span className="ui-date-time-sep" aria-hidden="true">
                    :
                  </span>
                  <DropdownSelect
                    variant="field"
                    sizeVariant="compact"
                    aria-label="Pilih menit"
                    className="ui-date-time-select"
                    options={MINUTE_OPTIONS}
                    value={parsedValue?.minute ?? '00'}
                    onChange={(nextMinute) =>
                      handleTimeChange(parsedValue?.hour ?? '09', nextMinute)
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="ui-date-footer">
              <button
                type="button"
                className="ui-date-footer-btn"
                disabled={!isTodaySelectable}
                onClick={handleTodayClick}
              >
                Hari ini
              </button>

              <div className="ui-date-footer-actions">
                {!required && resolvedValue ? (
                  <button
                    type="button"
                    className="ui-date-footer-btn ui-date-footer-btn--clear"
                    onClick={() => {
                      emitValue('');
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    <X size={14} aria-hidden="true" />
                    Hapus
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ui-date-footer-btn ui-date-footer-btn--done"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
