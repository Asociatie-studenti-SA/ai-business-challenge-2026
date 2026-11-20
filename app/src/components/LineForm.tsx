import type { FormEvent, ReactNode } from 'react';
import { Gauge } from 'lucide-react';
import { Field } from './Field';
import { LABELS, SEGMENTS } from '../logic/constants';
import { COUNTIES } from '../logic/hubs';
import type { FieldErrors, FieldName, FormValues, Segment } from '../logic/types';

export interface LineFormProps {
  values: FormValues;
  errors: FieldErrors;
  onChange: <K extends keyof FormValues>(name: K, value: FormValues[K]) => void;
  onSubmit: () => void;
}

type NumericName =
  | 'bucketKg'
  | 'gripperKg'
  | 'ratePerMin'
  | 'shiftsPerDay'
  | 'operatorsPerShift'
  | 'bucketsPerPallet';

const NUMERIC_FIELDS: readonly { name: NumericName; label: string; hint?: string }[] = [
  { name: 'bucketKg', label: 'Greutate găleată (kg)' },
  { name: 'gripperKg', label: 'Greutate gripper (kg)' },
  { name: 'ratePerMin', label: 'Ritm linie (găleți/min)' },
  { name: 'shiftsPerDay', label: 'Schimburi pe zi' },
  { name: 'operatorsPerShift', label: 'Operatori pe schimb' },
  {
    name: 'bucketsPerPallet',
    label: 'Găleți pe palet',
    hint: 'Implicit: 100 (≤ 5 kg) sau 44 (> 5 kg)',
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-base font-semibold text-slate-900">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Controlled 12-field form (Req 2.1). Raw strings are passed through unchanged. */
export function LineForm({ values, errors, onChange, onSubmit }: LineFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };
  const err = (name: FieldName) => errors[name];

  return (
    <form noValidate onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6">
      <Section title="Date firmă (fictive)">
        <Field
          kind="text"
          name="company"
          label="Firmă"
          value={values.company}
          onChange={(v) => onChange('company', v)}
          error={err('company')}
          autoComplete="off"
        />
        <Field
          kind="text"
          name="contactName"
          label="Persoană de contact"
          value={values.contactName}
          onChange={(v) => onChange('contactName', v)}
          error={err('contactName')}
          autoComplete="off"
        />
        <Field
          kind="text"
          type="email"
          inputMode="email"
          name="email"
          label="Email (doar .example)"
          value={values.email}
          onChange={(v) => onChange('email', v)}
          error={err('email')}
          placeholder="nume@firma.example"
          autoComplete="off"
        />
        <Field
          kind="select"
          name="county"
          label="Județ"
          value={values.county}
          onChange={(v) => onChange('county', v)}
          options={COUNTIES}
          placeholder="Alege județul"
          error={err('county')}
        />
        <Field
          kind="select"
          name="segment"
          label="Segment"
          value={values.segment}
          onChange={(v) => onChange('segment', v as Segment)}
          options={SEGMENTS}
          error={err('segment')}
        />
      </Section>

      <Section title="Parametri linie">
        {NUMERIC_FIELDS.map((f) => (
          <Field
            key={f.name}
            kind="text"
            name={f.name}
            label={f.label}
            hint={f.hint}
            inputMode="decimal"
            value={values[f.name]}
            onChange={(v) => onChange(f.name, v)}
            error={err(f.name)}
            autoComplete="off"
          />
        ))}
        <div className="min-w-0 sm:col-span-2">
          <Field
            kind="checkbox"
            name="manualConfirmed"
            label="Schimbarea paleților și amplasarea separatoarelor rămân manuale"
            checked={values.manualConfirmed}
            onChange={(v) => onChange('manualConfirmed', v)}
            error={err('manualConfirmed')}
          />
        </div>
      </Section>

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-base font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto sm:self-start"
      >
        <Gauge size={18} className="shrink-0" aria-hidden="true" />
        <span>{LABELS.evaluate}</span>
      </button>
    </form>
  );
}
