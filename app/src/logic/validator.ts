// Form validation for PaletCheck UR20 (see design.md, `validator.ts`).
// Pure module. Per-field checks run in order required -> range -> payload; first match wins.
// Never throws on user input.

import { MESSAGES, UR20_PAYLOAD_LIMIT_TENTHS } from './constants';
import { COUNTIES } from './hubs';
import { formatScaled, parseMilli, roundDiv } from './numbers';
import type { FieldErrors, FormValues, ParsedLine } from './types';

const SYNTHETIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.example$/i;

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

/** True when the trimmed email ends in the reserved `.example` domain. */
export function isSyntheticEmail(email: string): boolean {
  return SYNTHETIC_EMAIL_RE.test(asString(email).trim());
}

/** Bucket + gripper weight in tenths of a kg, rounded half-up. */
export function totalPayloadTenths(bucketMilli: number, gripperMilli: number): number {
  return roundDiv(bucketMilli + gripperMilli, 100);
}

type NumericField =
  | 'bucketKg'
  | 'gripperKg'
  | 'ratePerMin'
  | 'shiftsPerDay'
  | 'operatorsPerShift'
  | 'bucketsPerPallet';

/** Returns the parsed milli value, or records the first failing error and returns null. */
function checkNumeric(
  raw: unknown,
  field: NumericField,
  minMilli: number,
  maxMilli: number,
  integer: boolean,
  errors: FieldErrors,
): number | null {
  const milli = parseMilli(asString(raw));
  if (milli === null) {
    errors[field] = MESSAGES.requiredNumeric;
    return null;
  }
  if (milli < minMilli || milli > maxMilli || (integer && milli % 1000 !== 0)) {
    errors[field] = MESSAGES.range[field];
    return null;
  }
  return milli;
}

export function validate(values: FormValues): { errors: FieldErrors; parsed: ParsedLine | null } {
  const errors: FieldErrors = {};
  const v = (values ?? {}) as Partial<FormValues>;

  if (asString(v.company).trim() === '') errors.company = MESSAGES.required;

  const county = asString(v.county);
  if (county === '' || !COUNTIES.includes(county)) errors.county = MESSAGES.required;

  const bucketMilli = checkNumeric(v.bucketKg, 'bucketKg', 500, 30_000, false, errors);
  const gripperMilli = checkNumeric(v.gripperKg, 'gripperKg', 0, 10_000, false, errors);
  if (bucketMilli !== null && gripperMilli !== null) {
    const total = totalPayloadTenths(bucketMilli, gripperMilli);
    if (total > UR20_PAYLOAD_LIMIT_TENTHS) {
      errors.bucketKg = MESSAGES.payload(formatScaled(total, 1, { min: 0, max: 1 }));
    }
  }

  const rateMilli = checkNumeric(v.ratePerMin, 'ratePerMin', 100, 20_000, false, errors);
  const shiftsMilli = checkNumeric(v.shiftsPerDay, 'shiftsPerDay', 1000, 3000, true, errors);
  const operatorsMilli = checkNumeric(
    v.operatorsPerShift, 'operatorsPerShift', 1000, 10_000, true, errors,
  );
  const palletMilli = checkNumeric(
    v.bucketsPerPallet, 'bucketsPerPallet', 1000, 200_000, true, errors,
  );

  const email = asString(v.email).trim();
  if (email !== '' && !isSyntheticEmail(email)) errors.email = MESSAGES.emailDemo;

  if (v.manualConfirmed !== true) errors.manualConfirmed = MESSAGES.manualConfirm;

  if (
    Object.keys(errors).length > 0 ||
    bucketMilli === null ||
    gripperMilli === null ||
    rateMilli === null ||
    shiftsMilli === null ||
    operatorsMilli === null ||
    palletMilli === null
  ) {
    return { errors, parsed: null };
  }

  return {
    errors,
    parsed: {
      bucketMilli,
      gripperMilli,
      rateMilli,
      shifts: shiftsMilli / 1000,
      operators: operatorsMilli / 1000,
      bucketsPerPallet: palletMilli / 1000,
    },
  };
}
