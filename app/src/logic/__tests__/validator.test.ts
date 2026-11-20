import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isSyntheticEmail, validate } from '../validator';
import { DEMO_ERRORS, DEMO_NORMAL, MESSAGES } from '../constants';
import { formatScaled, parseMilli } from '../numbers';
import type { FormValues } from '../types';
import { arbValidForm } from './arbitraries';

/** Fully valid form values; override individual fields per test. */
const base = (overrides: Partial<FormValues> = {}): FormValues => ({ ...DEMO_NORMAL, ...overrides });

/** Integer tenths of a kg -> decimal string with the given separator, e.g. 171 -> "17,1". */
const tenthsToString = (tenths: number, sep: ',' | '.'): string =>
  `${Math.floor(tenths / 10)}${sep}${tenths % 10}`;

const sepArb = fc.constantFrom<',' | '.'>(',', '.');

describe('validator', () => {
  describe('Property 1: Payload invariant', () => {
    // Feature: paletcheck-ur20, Property 1: Payload invariant
    // **Validates: Requirements 2.5, 3.1, 3.2, 3.4, 3.5, 14.1**

    // Bucket 0,5–30 kg and gripper 0–10 kg as integer tenths.
    const anyPair = fc.tuple(fc.integer({ min: 5, max: 300 }), fc.integer({ min: 0, max: 100 }));
    // All pairs whose sum is exactly 20 kg (bucket 10–20 kg, gripper 10–0 kg).
    const exact20Pair = fc
      .integer({ min: 100, max: 200 })
      .map((b): [number, number] => [b, 200 - b]);

    const check = (bucket: number, gripper: number, sepB: ',' | '.', sepG: ',' | '.') => {
      const { errors } = validate(
        base({ bucketKg: tenthsToString(bucket, sepB), gripperKg: tenthsToString(gripper, sepG) }),
      );
      const total = bucket + gripper; // independent oracle, in tenths
      if (total > 200) {
        const t = formatScaled(total, 1, { min: 0, max: 1 });
        expect(errors.bucketKg).toBe(
          `Sarcina totală ${t} kg (găleată + gripper) depășește limita UR20 de 20 kg.`,
        );
      } else {
        expect(errors.bucketKg).toBeUndefined();
      }
      expect(errors.gripperKg).toBeUndefined();
    };

    it('reports a payload error exactly when the sum exceeds 20 kg', () => {
      fc.assert(
        fc.property(fc.oneof(anyPair, exact20Pair), sepArb, sepArb, ([b, g], sb, sg) => {
          check(b, g, sb, sg);
        }),
        { numRuns: 300 },
      );
    });

    it('accepts pairs summing to exactly 20 kg (17,1 + 2,9; 13,1 + 6,9)', () => {
      check(171, 29, ',', ',');
      check(131, 69, ',', '.');
      expect(validate(base({ bucketKg: '17,1', gripperKg: '2,9' })).errors.bucketKg).toBeUndefined();
      expect(validate(base({ bucketKg: '13.1', gripperKg: '6.9' })).errors.bucketKg).toBeUndefined();
    });

    it('formats the over-limit total in Romanian notation', () => {
      expect(validate(base({ bucketKg: '18', gripperKg: '3' })).errors.bucketKg).toBe(
        'Sarcina totală 21 kg (găleată + gripper) depășește limita UR20 de 20 kg.',
      );
      expect(validate(base({ bucketKg: '17,6', gripperKg: '2,9' })).errors.bucketKg).toBe(
        'Sarcina totală 20,5 kg (găleată + gripper) depășește limita UR20 de 20 kg.',
      );
    });
  });

  describe('Property 11: Required and range validation', () => {
    // Feature: paletcheck-ur20, Property 11: Required and range validation
    // **Validates: Requirements 2.3, 2.4, 2.9**

    type NumField =
      | 'bucketKg'
      | 'gripperKg'
      | 'ratePerMin'
      | 'shiftsPerDay'
      | 'operatorsPerShift'
      | 'bucketsPerPallet';

    // Independent oracle: intervals in thousandths, hard-coded from the requirements.
    const INTERVALS: Record<NumField, { min: number; max: number; int: boolean }> = {
      bucketKg: { min: 500, max: 30_000, int: false },
      gripperKg: { min: 0, max: 10_000, int: false },
      ratePerMin: { min: 100, max: 20_000, int: false },
      shiftsPerDay: { min: 1000, max: 3000, int: true },
      operatorsPerShift: { min: 1000, max: 10_000, int: true },
      bucketsPerPallet: { min: 1000, max: 200_000, int: true },
    };
    const FIELDS = Object.keys(INTERVALS) as NumField[];
    const fieldArb = fc.constantFrom(...FIELDS);

    /** Keeps the other weight small so the payload check does not mask range errors. */
    const isolate = (field: NumField, raw: string): Partial<FormValues> => {
      if (field === 'bucketKg') return { bucketKg: raw, gripperKg: '0' };
      if (field === 'gripperKg') return { bucketKg: '0,5', gripperKg: raw };
      return { [field]: raw };
    };

    /** Integer thousandths -> decimal string, e.g. 6500 -> "6,5" / "6.500" / "6". */
    const milliToString = (m: number, sep: ',' | '.', digits: 0 | 1 | 2 | 3): string => {
      const int = Math.floor(m / 1000);
      if (digits === 0) return String(int);
      const frac = String(m % 1000).padStart(3, '0').slice(0, digits);
      return `${int}${sep}${frac}`;
    };

    // Values whose string representation is exact for the chosen number of decimals.
    const parsableArb = fc
      .tuple(fc.integer({ min: 0, max: 250_000 }), sepArb, fc.constantFrom<0 | 1 | 2 | 3>(0, 1, 2, 3))
      .map(([m, sep, digits]) => {
        const step = [1000, 100, 10, 1][digits];
        const milli = Math.floor(m / step) * step;
        return { milli, sep, digits, raw: milliToString(milli, sep, digits) };
      });

    const digitsArb = fc
      .array(fc.constantFrom(...'0123456789'.split('')), { minLength: 1, maxLength: 4 })
      .map((a) => a.join(''));
    const invalidArb = fc.oneof(
      fc.constant(''),
      fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 4 }).map((a) => a.join('')),
      // Digits with a foreign character inserted.
      fc
        .tuple(digitsArb, digitsArb, fc.constantFrom('a', 'x', 'e', '-', '+', ' ', '/', '%', 'kg'))
        .map(([a, b, c]) => `${a}${c}${b}`),
      // A leading sign or more than one separator.
      fc.tuple(digitsArb, digitsArb, digitsArb, sepArb, sepArb).map(([a, b, c, s1, s2]) => `${a}${s1}${b}${s2}${c}`),
      fc.tuple(fc.constantFrom('-', '+'), digitsArb).map(([s, d]) => `${s}${d}`),
      fc.constantFrom('NaN', 'Infinity', ',5', '5,', '.'),
    );

    it('returns the required-numeric message for empty or non-numeric input', () => {
      fc.assert(
        fc.property(fieldArb, invalidArb, (field, raw) => {
          const { errors, parsed } = validate(base(isolate(field, raw)));
          expect(errors[field]).toBe('Câmp obligatoriu – introdu o valoare numerică.');
          expect(parsed).toBeNull();
        }),
        { numRuns: 300 },
      );
    });

    it('returns the range message exactly when a parsable value is outside the interval', () => {
      fc.assert(
        fc.property(fieldArb, parsableArb, (field, { milli, raw }) => {
          const { min, max, int } = INTERVALS[field];
          const outOfRange = milli < min || milli > max || (int && milli % 1000 !== 0);
          const { errors } = validate(base(isolate(field, raw)));
          if (outOfRange) {
            expect(errors[field]).toBe(MESSAGES.range[field]);
          } else if (field === 'bucketKg' && Math.floor((2 * milli + 100) / 200) > 200) {
            // In range but bucket alone exceeds the 20 kg payload (gripper = 0).
            const t = formatScaled(Math.floor((2 * milli + 100) / 200), 1, { min: 0, max: 1 });
            expect(errors.bucketKg).toBe(
              `Sarcina totală ${t} kg (găleată + gripper) depășește limita UR20 de 20 kg.`,
            );
          } else {
            expect(errors[field]).toBeUndefined();
          }
        }),
        { numRuns: 500 },
      );
    });

    it('checks interval boundaries and integer-only fields', () => {
      expect(validate(base(isolate('bucketKg', '0,5'))).errors.bucketKg).toBeUndefined();
      expect(validate(base(isolate('bucketKg', '0,4'))).errors.bucketKg).toBe(MESSAGES.range.bucketKg);
      expect(validate(base(isolate('bucketKg', '30,1'))).errors.bucketKg).toBe(MESSAGES.range.bucketKg);
      expect(validate(base(isolate('gripperKg', '10,01'))).errors.gripperKg).toBe(MESSAGES.range.gripperKg);
      expect(validate(base({ ratePerMin: '0,1' })).errors.ratePerMin).toBeUndefined();
      expect(validate(base({ ratePerMin: '20,001' })).errors.ratePerMin).toBe(MESSAGES.range.ratePerMin);
      expect(validate(base({ shiftsPerDay: '2,5' })).errors.shiftsPerDay).toBe(MESSAGES.range.shiftsPerDay);
      expect(validate(base({ shiftsPerDay: '4' })).errors.shiftsPerDay).toBe(MESSAGES.range.shiftsPerDay);
      expect(validate(base({ operatorsPerShift: '0' })).errors.operatorsPerShift).toBe(
        MESSAGES.range.operatorsPerShift,
      );
      expect(validate(base({ bucketsPerPallet: '200' })).errors.bucketsPerPallet).toBeUndefined();
      expect(validate(base({ bucketsPerPallet: '201' })).errors.bucketsPerPallet).toBe(
        MESSAGES.range.bucketsPerPallet,
      );
      expect(validate(base({ ratePerMin: '   ' })).errors.ratePerMin).toBe(MESSAGES.requiredNumeric);
    });

    it('parses a decimal identically with "," or "."', () => {
      fc.assert(
        fc.property(parsableArb, ({ milli, digits }) => {
          const comma = milliToString(milli, ',', digits);
          const dot = milliToString(milli, '.', digits);
          expect(parseMilli(comma)).toBe(milli);
          expect(parseMilli(dot)).toBe(milli);
        }),
        { numRuns: 300 },
      );
    });
  });

  describe('Property 12: All failing fields reported together', () => {
    // Feature: paletcheck-ur20, Property 12: All failing fields reported together
    // **Validates: Requirements 2.9, 2.10**

    type BreakableField = keyof FormValues;

    // Each breaker returns a value that fails exactly its own field. Breaking a weight
    // (empty or out of range) makes checkNumeric return null, which skips the payload
    // rule, so no extra error can appear on bucketKg on the other weight's behalf.
    const BREAKERS: Record<string, fc.Arbitrary<unknown>> = {
      company: fc.constantFrom('', '   ', '\t'),
      county: fc.constant(''),
      bucketKg: fc.constantFrom('', '31', '0,4', '30.1'),
      gripperKg: fc.constantFrom('', '11', '10,01'),
      ratePerMin: fc.constantFrom('', '0', '21', '20,001'),
      shiftsPerDay: fc.constantFrom('', '0', '4', '2,5'),
      operatorsPerShift: fc.constantFrom('', '0', '11', '1,5'),
      bucketsPerPallet: fc.constantFrom('', '0', '201', '6,5'),
      email: fc.constantFrom('x@firma.ro', 'ana@test.com', 'demo@example'),
      manualConfirmed: fc.constant(false),
    };
    const FIELDS = Object.keys(BREAKERS) as BreakableField[];

    const caseArb = fc
      .tuple(arbValidForm, fc.subarray(FIELDS))
      .chain(([valid, broken]) =>
        fc
          .tuple(...broken.map((f) => BREAKERS[f]))
          .map((vals) => {
            const values: FormValues = { ...valid.values };
            broken.forEach((f, i) => {
              (values as unknown as Record<string, unknown>)[f] = vals[i];
            });
            return { values, broken };
          }),
      );

    it('reports an error for exactly the broken subset of fields', () => {
      fc.assert(
        fc.property(caseArb, ({ values, broken }) => {
          const { errors, parsed } = validate(values);
          expect(Object.keys(errors).sort()).toEqual([...broken].sort());
          if (broken.length > 0) expect(parsed).toBeNull();
          else expect(parsed).not.toBeNull();
        }),
        { numRuns: 300 },
      );
    });

    it('reports every field at once when all are broken', () => {
      const { errors } = validate({
        company: '',
        contactName: '',
        email: 'x@firma.ro',
        county: '',
        segment: DEMO_NORMAL.segment,
        bucketKg: '31',
        gripperKg: '11',
        ratePerMin: '21',
        shiftsPerDay: '4',
        operatorsPerShift: '0',
        bucketsPerPallet: '201',
        manualConfirmed: false,
      });
      expect(Object.keys(errors).sort()).toEqual([...FIELDS].sort());
    });
  });

  describe('Property 13: Synthetic email rule', () => {
    // Feature: paletcheck-ur20, Property 13: Synthetic email rule
    // **Validates: Requirements 8.3, 8.4**

    const EMAIL_DEMO_MSG = 'Prototip demo: folosește doar adrese fictive cu domeniul .example.';

    const chars = (alphabet: string, minLength: number, maxLength: number) =>
      fc
        .array(fc.constantFrom(...alphabet.split('')), { minLength, maxLength })
        .map((a) => a.join(''));
    const localArb = chars('abcdefghijklmnopqrstuvwxyz0123456789._+-', 1, 12);
    const labelArb = chars('abcdefghijklmnopqrstuvwxyz0123456789-', 1, 12);
    const wsArb = chars(' \t\n', 0, 3);

    /** Randomly upper-cases characters to exercise case-insensitivity. */
    const withRandomCase = (s: string) =>
      fc
        .array(fc.boolean(), { minLength: s.length, maxLength: s.length })
        .map((flags) => s.split('').map((c, i) => (flags[i] ? c.toUpperCase() : c)).join(''));

    const syntheticArb = fc
      .tuple(localArb, labelArb, wsArb, wsArb)
      .chain(([local, label, pre, post]) =>
        withRandomCase(`${local}@${label}.example`).map((core) => `${pre}${core}${post}`),
      );

    const realisticNonExampleArb = fc
      .tuple(localArb, labelArb, fc.constantFrom('ro', 'com', 'eu', 'example.com', 'examples'), wsArb, wsArb)
      .chain(([local, label, tld, pre, post]) =>
        withRandomCase(`${local}@${label}.${tld}`).map((core) => `${pre}${core}${post}`),
      );
    const arbitraryNonExampleArb = fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => s.trim() !== '' && !s.trim().toLowerCase().endsWith('.example'));
    const nonSyntheticArb = fc.oneof(realisticNonExampleArb, arbitraryNonExampleArb);

    it('accepts any local@label.example address (any case, surrounding whitespace)', () => {
      fc.assert(
        fc.property(syntheticArb, (email) => {
          expect(isSyntheticEmail(email)).toBe(true);
          expect(validate(base({ email })).errors.email).toBeUndefined();
        }),
        { numRuns: 300 },
      );
    });

    it('rejects any non-empty email that does not end in .example', () => {
      fc.assert(
        fc.property(nonSyntheticArb, (email) => {
          expect(isSyntheticEmail(email)).toBe(false);
          expect(validate(base({ email })).errors.email).toBe(EMAIL_DEMO_MSG);
        }),
        { numRuns: 300 },
      );
    });

    it('accepts an empty email and the normal demo email', () => {
      expect(validate(base({ email: '' })).errors.email).toBeUndefined();
      expect(isSyntheticEmail('productie@lactosud-demo.example')).toBe(true);
      expect(validate(base({ email: 'productie@lactosud-demo.example' })).errors.email).toBeUndefined();
      expect(MESSAGES.emailDemo).toBe(EMAIL_DEMO_MSG);
    });
  });

  describe('Demo fixtures validation', () => {
    // Validates: Requirements 1.2, 1.3, 1.4, 2.5, 3.2

    it('DEMO_NORMAL holds the Req 1.2 values', () => {
      expect({ ...DEMO_NORMAL }).toEqual({
        company: 'SC LactoSud Demo SRL',
        contactName: 'Andrei Ionescu (Demo)',
        email: 'productie@lactosud-demo.example',
        county: 'Ilfov',
        segment: 'Lactate',
        bucketKg: '13',
        gripperKg: '3',
        ratePerMin: '6,5',
        shiftsPerDay: '2',
        operatorsPerShift: '2',
        bucketsPerPallet: '44',
        manualConfirmed: true,
      });
    });

    it('DEMO_ERRORS holds the Req 1.3 values', () => {
      expect({ ...DEMO_ERRORS }).toEqual({
        company: 'SC Test Erori Demo SRL',
        contactName: '',
        email: '',
        county: 'Ilfov',
        segment: 'Lactate',
        bucketKg: '18',
        gripperKg: '3',
        ratePerMin: '',
        shiftsPerDay: '2',
        operatorsPerShift: '2',
        bucketsPerPallet: '44',
        manualConfirmed: false,
      });
    });

    it('validate(DEMO_NORMAL) returns no errors and parsed values', () => {
      const { errors, parsed } = validate(DEMO_NORMAL);
      expect(errors).toEqual({});
      expect(parsed).not.toBeNull();
    });

    it('validate(DEMO_ERRORS) returns exactly the three Req 1.4 messages', () => {
      const { errors, parsed } = validate(DEMO_ERRORS);
      expect(Object.keys(errors).sort()).toEqual(['bucketKg', 'manualConfirmed', 'ratePerMin']);
      expect(errors.ratePerMin).toBe('Câmp obligatoriu – introdu o valoare numerică.');
      expect(errors.bucketKg).toBe(
        'Sarcina totală 21 kg (găleată + gripper) depășește limita UR20 de 20 kg.',
      );
      expect(errors.manualConfirmed).toBe(
        'Confirmă că schimbarea paleților și amplasarea separatoarelor rămân manuale.',
      );
      expect(parsed).toBeNull();
    });

    it('17,5 + 3 kg reports payload 20,5; 13,1 + 6,9 kg passes', () => {
      expect(validate(base({ bucketKg: '17,5', gripperKg: '3' })).errors.bucketKg).toBe(
        'Sarcina totală 20,5 kg (găleată + gripper) depășește limita UR20 de 20 kg.',
      );
      const ok = validate(base({ bucketKg: '13,1', gripperKg: '6,9' }));
      expect(ok.errors).toEqual({});
      expect(ok.parsed).not.toBeNull();
    });
  });
});
