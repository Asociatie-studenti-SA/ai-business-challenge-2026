import type { HTMLAttributes } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FieldName } from '../logic/types';

interface FieldBase {
  /** Used as the control id; error id is `${name}-error`, hint id is `${name}-hint`. */
  name: FieldName;
  label: string;
  error?: string;
  hint?: string;
}

export interface TextFieldProps extends FieldBase {
  kind: 'text';
  /** Raw string exactly as typed (Req 2.11). */
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email';
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
  autoComplete?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends FieldBase {
  kind: 'select';
  value: string;
  onChange: (value: string) => void;
  /** Plain strings use the same text for value and label. */
  options: readonly (string | SelectOption)[];
  /** When set, adds a first empty option (value '') with this text. */
  placeholder?: string;
}

export interface CheckboxFieldProps extends FieldBase {
  kind: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export type FieldProps = TextFieldProps | SelectFieldProps | CheckboxFieldProps;

const controlClass =
  'block min-h-11 w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-base text-slate-900';

function describedBy(hintId: string | undefined, errorId: string | undefined) {
  const ids = [hintId, errorId].filter(Boolean).join(' ');
  return ids || undefined;
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      className="mt-1 flex items-start gap-2 border-l-2 border-amber-600 pl-2 text-sm text-slate-900"
    >
      <AlertTriangle size={18} className="mt-px shrink-0 text-amber-600" aria-hidden="true" />
      <span className="min-w-0 break-words">{message}</span>
    </p>
  );
}

/**
 * Labelled form control with inline error under it (Req 2.1, 2.8).
 * Sets aria-invalid and aria-describedby (hint + error ids) on the control.
 */
export function Field(props: FieldProps) {
  const { name, label, error, hint } = props;
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  const aria = {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy(hintId, errorId),
  };
  const border = error ? 'border-amber-600' : 'border-slate-300';

  if (props.kind === 'checkbox') {
    return (
      <div className="min-w-0">
        <label htmlFor={name} className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={props.checked}
            onChange={(e) => props.onChange(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-teal-700"
            {...aria}
          />
          <span className="min-w-0 break-words text-base text-slate-900">{label}</span>
        </label>
        {hint ? (
          <p id={hintId} className="text-sm text-slate-600">
            {hint}
          </p>
        ) : null}
        {error && errorId ? <FieldError id={errorId} message={error} /> : null}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-900">
        {label}
      </label>
      {props.kind === 'select' ? (
        <select
          id={name}
          name={name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={`${controlClass} ${border}`}
          {...aria}
        >
          {props.placeholder !== undefined ? <option value="">{props.placeholder}</option> : null}
          {props.options.map((opt) => {
            const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
            return (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={props.type ?? 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          inputMode={props.inputMode}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          className={`${controlClass} ${border} placeholder:text-slate-500`}
          {...aria}
        />
      )}
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      ) : null}
      {error && errorId ? <FieldError id={errorId} message={error} /> : null}
    </div>
  );
}
