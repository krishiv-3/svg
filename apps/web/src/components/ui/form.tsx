import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/cn';

import { AlertTriangleIcon, ChevronDownIcon } from '../icons';

/**
 * Form controls.
 *
 * Accessibility guarantees, applied by construction rather than by convention:
 *  - every control is bound to a `<label>` via `htmlFor`/`id`;
 *  - hint and error text are wired through `aria-describedby`;
 *  - `aria-invalid` is set whenever an error is present;
 *  - `required` is a real attribute, so assistive technology announces it;
 *  - ids derive from `name`, so no hooks are needed and the components stay
 *    server-renderable. Pass `id` when the same name appears twice on a page.
 *
 * Every control is at least 44 px tall, meeting WCAG 2.5.8 (target size).
 */

export interface FieldBaseProps {
  /** Field name; also the default id. Required for correct labelling. */
  name: string;
  /** Visible label. Use `hideLabel` only when a heading provides the context. */
  label: ReactNode;
  hint?: ReactNode;
  /** Error message; presence also sets `aria-invalid`. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Override when the same `name` is rendered more than once. */
  id?: string;
  hideLabel?: boolean;
  /** Classes for the outer wrapper. */
  className?: string;
  /** Classes for the control itself. */
  controlClassName?: string;
}

interface FieldIds {
  fieldId: string;
  describedBy: string | undefined;
}

function resolveIds(
  name: string,
  id: string | undefined,
  hint: ReactNode,
  error: string | undefined,
): FieldIds {
  const fieldId = id ?? name;
  const describedBy = cn(
    hint === undefined ? undefined : `${fieldId}-hint`,
    error === undefined ? undefined : `${fieldId}-error`,
  );

  return { fieldId, describedBy: describedBy === '' ? undefined : describedBy };
}

const CONTROL_BASE =
  'block w-full rounded-lg border bg-white text-charcoal ' +
  'border-border-strong hover:border-cocoa/45 ' +
  'placeholder:text-muted/75 ' +
  'transition-colors duration-150 ease-standard ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa ' +
  'disabled:cursor-not-allowed disabled:bg-sand/30 disabled:text-muted ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:hover:border-danger';

const TEXT_CONTROL = cn(CONTROL_BASE, 'px-3.5 py-2.5 text-body-sm min-h-11');

function Label({
  fieldId,
  label,
  required,
  hideLabel,
  hint,
}: {
  fieldId: string;
  label: ReactNode;
  required: boolean;
  hideLabel: boolean;
  hint?: ReactNode;
}) {
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        hideLabel ? 'visually-hidden' : 'text-label block font-medium text-cocoa',
        hint === undefined ? undefined : 'mb-1.5',
      )}
    >
      {label}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldMessages({
  fieldId,
  hint,
  error,
}: {
  fieldId: string;
  hint?: ReactNode;
  error?: string;
}) {
  return (
    <>
      {hint === undefined ? null : (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-[length:var(--text-caption)] text-muted">
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-[length:var(--text-caption)] font-medium text-danger"
        >
          <AlertTriangleIcon size={14} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

export interface InputProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'id' | 'required' | 'disabled' | 'className'
    >,
    FieldBaseProps {}

export function Input({
  name,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  hideLabel = false,
  className,
  controlClassName,
  ...rest
}: InputProps) {
  const { fieldId, describedBy } = resolveIds(name, id, hint, error);

  return (
    <div className={cn('flex flex-col', className)}>
      <Label
        fieldId={fieldId}
        label={label}
        required={required}
        hideLabel={hideLabel}
        {...(hint === undefined ? {} : { hint })}
      />

      <input
        {...rest}
        id={fieldId}
        name={name}
        required={required}
        disabled={disabled}
        aria-invalid={error === undefined ? undefined : true}
        {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
        className={cn(TEXT_CONTROL, controlClassName)}
      />

      <FieldMessages
        fieldId={fieldId}
        {...(hint === undefined ? {} : { hint })}
        {...(error === undefined ? {} : { error })}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Textarea                                                                   */
/* -------------------------------------------------------------------------- */

export interface TextareaProps
  extends
    Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      'name' | 'id' | 'required' | 'disabled' | 'className'
    >,
    FieldBaseProps {}

export function Textarea({
  name,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  hideLabel = false,
  className,
  controlClassName,
  rows = 5,
  ...rest
}: TextareaProps) {
  const { fieldId, describedBy } = resolveIds(name, id, hint, error);

  return (
    <div className={cn('flex flex-col', className)}>
      <Label
        fieldId={fieldId}
        label={label}
        required={required}
        hideLabel={hideLabel}
        {...(hint === undefined ? {} : { hint })}
      />

      <textarea
        {...rest}
        id={fieldId}
        name={name}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={error === undefined ? undefined : true}
        {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
        className={cn(TEXT_CONTROL, 'resize-y', controlClassName)}
      />

      <FieldMessages
        fieldId={fieldId}
        {...(hint === undefined ? {} : { hint })}
        {...(error === undefined ? {} : { error })}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Select                                                                     */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends
    Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      'name' | 'id' | 'required' | 'disabled' | 'className' | 'children'
    >,
    FieldBaseProps {
  options: readonly SelectOption[];
  /** Renders a disabled placeholder option. */
  placeholder?: string;
}

export function Select({
  name,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  id,
  hideLabel = false,
  className,
  controlClassName,
  options,
  placeholder,
  ...rest
}: SelectProps) {
  const { fieldId, describedBy } = resolveIds(name, id, hint, error);

  return (
    <div className={cn('flex flex-col', className)}>
      <Label
        fieldId={fieldId}
        label={label}
        required={required}
        hideLabel={hideLabel}
        {...(hint === undefined ? {} : { hint })}
      />

      <div className="relative">
        <select
          {...rest}
          id={fieldId}
          name={name}
          required={required}
          disabled={disabled}
          aria-invalid={error === undefined ? undefined : true}
          {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
          className={cn(TEXT_CONTROL, 'appearance-none pr-10', controlClassName)}
        >
          {placeholder === undefined ? null : (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled === true}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon
          size={18}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-cocoa"
        />
      </div>

      <FieldMessages
        fieldId={fieldId}
        {...(hint === undefined ? {} : { hint })}
        {...(error === undefined ? {} : { error })}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checkbox and radio                                                         */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'id' | 'required' | 'disabled' | 'className' | 'type'
    >,
    FieldBaseProps {
  /** Supporting text shown under the label. */
  description?: ReactNode;
}

export function Checkbox({
  name,
  label,
  hint,
  error,
  description,
  required = false,
  disabled = false,
  id,
  hideLabel = false,
  className,
  controlClassName,
  ...rest
}: CheckboxProps) {
  const { fieldId, describedBy } = resolveIds(name, id, hint, error);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-start gap-2.5">
        <input
          {...rest}
          type="checkbox"
          id={fieldId}
          name={name}
          required={required}
          disabled={disabled}
          aria-invalid={error === undefined ? undefined : true}
          {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-sm border-border-strong accent-terracotta',
            controlClassName,
          )}
        />
        <label
          htmlFor={fieldId}
          className={cn('text-body-sm text-charcoal', hideLabel ? 'visually-hidden' : undefined)}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          ) : null}
          {description === undefined ? null : (
            <span className="mt-0.5 block text-[length:var(--text-caption)] text-muted">
              {description}
            </span>
          )}
        </label>
      </div>

      <FieldMessages
        fieldId={fieldId}
        {...(hint === undefined ? {} : { hint })}
        {...(error === undefined ? {} : { error })}
      />
    </div>
  );
}

export interface RadioProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'id' | 'required' | 'disabled' | 'className' | 'type'
    >,
    Omit<FieldBaseProps, 'hideLabel'> {
  description?: ReactNode;
}

/** A single radio, normally used inside `RadioGroup`. */
export function Radio({
  name,
  label,
  hint,
  error,
  description,
  required = false,
  disabled = false,
  id,
  className,
  controlClassName,
  ...rest
}: RadioProps) {
  const { fieldId, describedBy } = resolveIds(name, id, hint, error);

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        {...rest}
        type="radio"
        id={fieldId}
        name={name}
        required={required}
        disabled={disabled}
        aria-invalid={error === undefined ? undefined : true}
        {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0 cursor-pointer border-border-strong accent-terracotta',
          controlClassName,
        )}
      />
      <label htmlFor={fieldId} className="text-body-sm text-charcoal">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
        {description === undefined ? null : (
          <span className="mt-0.5 block text-[length:var(--text-caption)] text-muted">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

export interface RadioGroupProps {
  name: string;
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: readonly { value: string; label: string; description?: string }[];
  required?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Radio group with a proper `<fieldset>`/`<legend>` association — the legend is
 * what assistive technology announces for the group.
 */
export function RadioGroup({
  name,
  legend,
  hint,
  error,
  options,
  required = false,
  defaultValue,
  disabled = false,
  id,
  className,
}: RadioGroupProps) {
  const groupId = id ?? name;
  const describedBy = cn(
    hint === undefined ? undefined : `${groupId}-hint`,
    error === undefined ? undefined : `${groupId}-error`,
  );

  return (
    <fieldset
      id={groupId}
      className={cn('flex flex-col gap-2 border-0 p-0', className)}
      aria-invalid={error === undefined ? undefined : true}
      {...(describedBy === '' ? {} : { 'aria-describedby': describedBy })}
    >
      <legend className="text-label mb-1.5 font-medium text-cocoa">
        {legend}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </legend>

      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            id={`${groupId}-${option.value}`}
            value={option.value}
            label={option.label}
            required={required}
            disabled={disabled}
            {...(option.description === undefined ? {} : { description: option.description })}
            {...(defaultValue === option.value ? { defaultChecked: true } : {})}
          />
        ))}
      </div>

      <FieldMessages
        fieldId={groupId}
        {...(hint === undefined ? {} : { hint })}
        {...(error === undefined ? {} : { error })}
      />
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/* Form error summary                                                         */
/* -------------------------------------------------------------------------- */

export interface FormErrorSummaryProps {
  /** Field-level errors. `fieldId` must match the control's id. */
  errors: readonly { fieldId: string; label: string; message: string }[];
  title?: string;
  className?: string;
}

/**
 * Error summary placed at the top of a form after a failed submission.
 *
 * `role="alert"` announces it immediately; each entry links to its field so a
 * keyboard user can jump straight to the problem (WCAG 3.3.1 / 3.3.3).
 */
export function FormErrorSummary({
  errors,
  title = 'There is a problem',
  className,
}: FormErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      tabIndex={-1}
      className={cn(
        'rounded-xl border border-danger/35 bg-danger/5 p-4 sm:p-5',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cocoa',
        className,
      )}
    >
      <p className="text-subheading text-danger">{title}</p>

      <ul className="mt-2 flex flex-col gap-1.5">
        {errors.map((entry) => (
          <li key={entry.fieldId} className="text-body-sm text-charcoal">
            <a
              href={`#${entry.fieldId}`}
              className="text-danger underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
            >
              {entry.label}
            </a>
            {': '}
            {entry.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
