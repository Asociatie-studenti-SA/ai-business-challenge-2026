// Shared type-only definitions for PaletCheck UR20 (see design.md, Data Models).
// This module contains no runtime code.

export type Segment =
  | 'Panificație / patiserie / ingrediente'
  | 'Lactate'
  | 'Sosuri / muștar / maioneză'
  | 'Creme / gemuri / miere'
  | 'Altă industrie (non-alimentară)';

export type Verdict =
  | 'Compatibil pentru evaluare tehnică'
  | 'Validare suplimentară'
  | 'Eroare date';

export type Hub = 'Dragomirești-Deal' | 'Timișoara' | 'Iași';

export type FieldName =
  | 'company'
  | 'contactName'
  | 'email'
  | 'county'
  | 'segment'
  | 'bucketKg'
  | 'gripperKg'
  | 'ratePerMin'
  | 'shiftsPerDay'
  | 'operatorsPerShift'
  | 'bucketsPerPallet'
  | 'manualConfirmed';

export type FieldErrors = Partial<Record<FieldName, string>>;

/** Raw form state. Every text/number field is the exact string the user typed. */
export interface FormValues {
  company: string;
  contactName: string;
  email: string;
  /** '' or one of COUNTIES */
  county: string;
  segment: Segment;
  bucketKg: string;
  gripperKg: string;
  ratePerMin: string;
  shiftsPerDay: string;
  operatorsPerShift: string;
  bucketsPerPallet: string;
  manualConfirmed: boolean;
}

/** Validated numeric line values: weights and rate in integer thousandths, counts as integers. */
export interface ParsedLine {
  bucketMilli: number;
  gripperMilli: number;
  rateMilli: number;
  shifts: number;
  operators: number;
  bucketsPerPallet: number;
}

export interface EvaluationResult {
  verdict: Verdict;
  /** Empty unless verdict === 'Eroare date'. */
  errors: FieldErrors;
  totalPayloadTenths: number | null;
  fatRefMilli: 8600 | 7400 | null;
  palletIntervalTenths: number | null;
  hub: Hub | null;
  /** Fixed order: rate, weight, pallet, segment. */
  reasons: string[];
  notes: string[];
  kpi: { payload: string; rate: string; pallet: string; hub: string } | null;
  summary: string | null;
}

/** Stored in localStorage and exported as JSON. Numbers are plain decimals (kg, găleți/min). */
export interface QualifiedRequest {
  company: string;
  contactName: string;
  email: string;
  county: string;
  segment: Segment;
  line: {
    bucketKg: number;
    gripperKg: number;
    ratePerMin: number;
    shiftsPerDay: number;
    operatorsPerShift: number;
    bucketsPerPallet: number;
    manualConfirmed: true;
  };
  verdict: Exclude<Verdict, 'Eroare date'>;
  hub: Hub;
  /** new Date().toISOString() */
  createdAt: string;
}
