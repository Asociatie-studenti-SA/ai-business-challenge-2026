import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DEMO_ERRORS, DEMO_NORMAL, SEGMENTS } from '../constants';
import { defaultBucketsPerPallet, evaluate } from '../engine';
import type { FormValues } from '../types';
import { validate } from '../validator';
import { arbValidForm, milliToString, type ValidFormCase } from './arbitraries';

describe('engine', () => {
  describe('arbValidForm generator', () => {
    it('produces forms that validate with zero errors and parse to the generated integers', () => {
      fc.assert(
        fc.property(arbValidForm, (c) => {
          const { errors, parsed } = validate(c.values);
          expect(errors).toEqual({});
          expect(parsed).toEqual({
            bucketMilli: c.bucketMilli,
            gripperMilli: c.gripperMilli,
            rateMilli: c.rateMilli,
            shifts: c.shifts,
            operators: c.operators,
            bucketsPerPallet: c.buckets,
          });
        }),
        { numRuns: 200 },
      );
    });
  });

  // Feature: paletcheck-ur20, Property 2: FAT reference classification
  describe('Property 2: FAT reference classification', () => {
    /** **Validates: Requirements 4.1, 14.2** */
    it('fatRefMilli is 8600 for buckets <= 5 kg and 7400 otherwise', () => {
      fc.assert(
        fc.property(arbValidForm, (c) => {
          const result = evaluate(c.values);
          expect(result.fatRefMilli).toBe(c.bucketMilli <= 5000 ? 8600 : 7400);
        }),
        { numRuns: 200 },
      );
    });

    it('classifies the 5 kg boundary as light and 5,1 kg as heavy', () => {
      const base = { ...DEMO_NORMAL, gripperKg: '3' };
      expect(evaluate({ ...base, bucketKg: '5' }).fatRefMilli).toBe(8600);
      expect(evaluate({ ...base, bucketKg: '5,0' }).fatRefMilli).toBe(8600);
      expect(evaluate({ ...base, bucketKg: '5.1' }).fatRefMilli).toBe(7400);
      expect(evaluate({ ...base, bucketKg: '13' }).fatRefMilli).toBe(7400);
    });
  });

  // Feature: paletcheck-ur20, Property 3: Reason triggers, order and uniqueness
  describe('Property 3: Reason triggers, order and uniqueness', () => {
    const RATE_REASON = 'Ritm peste reperul testat la FAT PURATOS';
    const WEIGHT_REASON = 'Greutate peste 13 kg, netestată la FAT PURATOS';
    const PALLET_REASON =
      'Risc blocaj aval: schimbul manual de palet apare la mai puțin de 5 minute';
    const SEGMENT_REASON = 'Industrie non-alimentară: necesită validare tehnică separată';

    /** **Validates: Requirements 4.2, 4.3, 4.5, 5.3, 5.5, 7.5, 7.6, 14.3** */
    it('reasons equal the canonical list filtered by the four triggers, in fixed order', () => {
      fc.assert(
        fc.property(arbValidForm, (c) => {
          const fatRef = c.bucketMilli <= 5000 ? 8600 : 7400;
          // Integer half-up of buckets * 10000 / rate (pallet interval in tenths of a minute).
          const palletTenths = Math.floor(
            (2 * c.buckets * 10_000 + c.rateMilli) / (2 * c.rateMilli),
          );
          const expected = [
            c.rateMilli > fatRef ? RATE_REASON : null,
            c.bucketMilli > 13_000 ? WEIGHT_REASON : null,
            palletTenths < 50 ? PALLET_REASON : null,
            c.segment === 'Altă industrie (non-alimentară)' ? SEGMENT_REASON : null,
          ].filter((r): r is string => r !== null);

          const { reasons } = evaluate(c.values);
          expect(reasons).toEqual(expected);
          expect(new Set(reasons).size).toBe(reasons.length);
        }),
        { numRuns: 200 },
      );
    });

    it('rate exactly 7,4 with a 13 kg bucket adds no rate reason', () => {
      const r = evaluate({ ...DEMO_NORMAL, bucketKg: '13', ratePerMin: '7,4' });
      expect(r.reasons).not.toContain(RATE_REASON);
    });

    it('rate exactly 8,6 with a 5 kg bucket adds no rate reason', () => {
      const r = evaluate({ ...DEMO_NORMAL, bucketKg: '5', ratePerMin: '8,6' });
      expect(r.reasons).not.toContain(RATE_REASON);
    });

    it('bucket exactly 13 kg adds no weight reason', () => {
      const r = evaluate({ ...DEMO_NORMAL, bucketKg: '13' });
      expect(r.reasons).not.toContain(WEIGHT_REASON);
    });

    it('pallet interval exactly 5,0 min adds no pallet reason', () => {
      // 37 buckets / 7,4 per min = 5,0 min exactly.
      const r = evaluate({ ...DEMO_NORMAL, ratePerMin: '7,4', bucketsPerPallet: '37' });
      expect(r.palletIntervalTenths).toBe(50);
      expect(r.reasons).not.toContain(PALLET_REASON);
    });
  });

  // Feature: paletcheck-ur20, Property 4: Verdict invariant
  describe('Property 4: Verdict invariant', () => {
    const VERDICTS = [
      'Compatibil pentru evaluare tehnică',
      'Validare suplimentară',
      'Eroare date',
    ];

    const arbNumericCorruption = fc.oneof(
      fc.string(),
      fc.constantFrom('', ' ', '   ', 'abc', '1,2,3', '-5', '0', '1e3', 'NaN', '99999', '0,0001'),
      fc.double({ noNaN: false }).map((d) => String(d)),
      fc.integer({ min: -1000, max: 100_000 }).map(String),
    );

    const corruptors: Partial<Record<keyof FormValues, fc.Arbitrary<unknown>>> = {
      company: fc.oneof(fc.constantFrom('', ' ', '\t'), fc.string()),
      contactName: fc.string(),
      email: fc.oneof(fc.string(), fc.constantFrom('a@b.com', 'x@y.example', ' ', '')),
      county: fc.oneof(fc.string(), fc.constantFrom('', 'Narnia', 'Ilfov ', 'bucurești')),
      bucketKg: arbNumericCorruption,
      gripperKg: arbNumericCorruption,
      ratePerMin: arbNumericCorruption,
      shiftsPerDay: arbNumericCorruption,
      operatorsPerShift: arbNumericCorruption,
      bucketsPerPallet: arbNumericCorruption,
      manualConfirmed: fc.boolean(),
    };
    const fieldNames = Object.keys(corruptors) as (keyof FormValues)[];

    const arbAnyForm: fc.Arbitrary<FormValues> = fc
      .tuple(arbValidForm, fc.subarray(fieldNames))
      .chain(([c, fields]) =>
        fc
          .tuple(...fields.map((f) => corruptors[f] as fc.Arbitrary<unknown>))
          .map((vals) => {
            const out = { ...c.values } as Record<string, unknown>;
            fields.forEach((f, i) => {
              out[f] = vals[i];
            });
            return out as unknown as FormValues;
          }),
      );

    /** **Validates: Requirements 3.5, 4.6, 5.4, 7.1, 7.2, 7.3, 7.4, 14.6** */
    it('verdict is one of three values and consistent with errors and reasons', () => {
      fc.assert(
        fc.property(arbAnyForm, (values) => {
          const v = validate(values);
          const result = evaluate(values);
          expect(VERDICTS).toContain(result.verdict);

          const hasErrors = Object.keys(v.errors).length > 0;
          expect(result.verdict === 'Eroare date').toBe(hasErrors);

          if (hasErrors) {
            expect(result.kpi).toBeNull();
            expect(result.summary).toBeNull();
            expect(result.hub).toBeNull();
            expect(result.reasons).toEqual([]);
            expect(result.notes).toEqual([]);
            expect(result.errors).toEqual(v.errors);
          } else {
            expect(result.verdict === 'Validare suplimentară').toBe(result.reasons.length >= 1);
            expect(result.kpi).not.toBeNull();
            expect(result.summary).not.toBeNull();
            expect(result.hub).not.toBeNull();
          }
        }),
        { numRuns: 300 },
      );
    });
  });

  // Feature: paletcheck-ur20, Property 5: Below-target note is informational
  describe('Property 5: Below-target note is informational', () => {
    const BELOW_TARGET_NOTE =
      'Ritmul liniei este sub ținta FAT de 6 găleți/min; celula nu va fi factorul limitativ.';
    const NON_FOOD = 'Altă industrie (non-alimentară)';

    /** Independent oracle: true when any of the four reason conditions holds. */
    const anyReason = (c: ValidFormCase): boolean => {
      const fatRef = c.bucketMilli <= 5000 ? 8600 : 7400;
      const palletTenths = Math.floor((2 * c.buckets * 10_000 + c.rateMilli) / (2 * c.rateMilli));
      return (
        c.rateMilli > fatRef ||
        c.bucketMilli > 13_000 ||
        palletTenths < 50 ||
        c.segment === NON_FOOD
      );
    };

    /** Targeted no-reason cases: food segment, bucket ≤ 13 kg, rate < 6, buckets ≥ ceil(5 × rate). */
    const arbBelowTargetNoReason: fc.Arbitrary<ValidFormCase> = fc
      .tuple(
        arbValidForm.filter((c) => c.bucketMilli <= 13_000),
        fc.integer({ min: 10, max: 599 }).map((n) => n * 10),
        fc.constantFrom(...SEGMENTS.filter((s) => s !== NON_FOOD)),
        fc.integer({ min: 0, max: 20 }),
      )
      .map(([c, rateMilli, segment, extra]) => {
        const buckets = Math.ceil((5 * rateMilli) / 1000) + extra;
        return {
          ...c,
          rateMilli,
          buckets,
          segment,
          values: {
            ...c.values,
            segment,
            ratePerMin: milliToString(rateMilli, ',', false),
            bucketsPerPallet: String(buckets),
          },
        };
      });

    /** **Validates: Requirements 4.4, 7.3, 14.11** */
    it('note appears exactly once iff rate < 6, never in reasons; no-reason cases are compatible', () => {
      let noReasonBelowTarget = 0;
      fc.assert(
        fc.property(fc.oneof(arbValidForm, arbBelowTargetNoReason), (c) => {
          const result = evaluate(c.values);
          const count = result.notes.filter((n) => n === BELOW_TARGET_NOTE).length;
          expect(result.reasons).not.toContain(BELOW_TARGET_NOTE);
          if (c.rateMilli < 6000) {
            expect(count).toBe(1);
            if (!anyReason(c)) {
              noReasonBelowTarget++;
              expect(result.verdict).toBe('Compatibil pentru evaluare tehnică');
            }
          } else {
            expect(count).toBe(0);
          }
        }),
        { numRuns: 300 },
      );
      expect(noReasonBelowTarget).toBeGreaterThan(0);
    });

    it('rate exactly 6 adds no note', () => {
      const r = evaluate({ ...DEMO_NORMAL, ratePerMin: '6' });
      expect(r.notes).not.toContain(BELOW_TARGET_NOTE);
    });
  });

  // Feature: paletcheck-ur20, Property 6: Pallet interval accuracy and monotonicity
  describe('Property 6: Pallet interval accuracy and monotonicity', () => {
    /** Rate milli 100–20000 at step 1 or step 10. */
    const arbRate = fc.oneof(
      fc.integer({ min: 100, max: 20_000 }),
      fc.integer({ min: 10, max: 2000 }).map((n) => n * 10),
    );
    const arbBuckets = fc.integer({ min: 1, max: 200 });

    const rateText = (milli: number): string =>
      `${Math.floor(milli / 1000)},${String(milli % 1000).padStart(3, '0')}`;

    const intervalTenths = (rateMilli: number, buckets: number): number | null => {
      const r = evaluate({
        ...DEMO_NORMAL,
        bucketKg: '13',
        gripperKg: '3',
        ratePerMin: rateText(rateMilli),
        bucketsPerPallet: String(buckets),
      });
      expect(r.verdict).not.toBe('Eroare date');
      return r.palletIntervalTenths;
    };

    /** **Validates: Requirements 5.1, 14.4** */
    it('interval is within 0,05 min of buckets / rate', () => {
      fc.assert(
        fc.property(arbRate, arbBuckets, (rateMilli, buckets) => {
          const tenths = intervalTenths(rateMilli, buckets);
          expect(tenths).not.toBeNull();
          const exact = buckets / (rateMilli / 1000);
          expect(Math.abs((tenths as number) / 10 - exact)).toBeLessThanOrEqual(0.05 + 1e-9);
        }),
        { numRuns: 200 },
      );
    });

    /** **Validates: Requirements 5.1, 14.4** */
    it('for fixed buckets, a higher rate never gives a longer interval', () => {
      fc.assert(
        fc.property(arbRate, arbRate, arbBuckets, (a, b, buckets) => {
          fc.pre(a !== b);
          const r1 = Math.max(a, b);
          const r2 = Math.min(a, b);
          expect(intervalTenths(r1, buckets) as number).toBeLessThanOrEqual(
            intervalTenths(r2, buckets) as number,
          );
        }),
        { numRuns: 200 },
      );
    });

    it('DEMO_NORMAL shows the expected pallet KPI string', () => {
      expect(evaluate(DEMO_NORMAL).kpi?.pallet).toBe('Schimb palet la ~6,8 min (44 găleți/palet)');
    });
  });

  // Feature: paletcheck-ur20, Property 8: Determinism and non-mutation
  describe('Property 8: Determinism and non-mutation', () => {
    const arbNumericCorruption = fc.oneof(
      fc.string(),
      fc.constantFrom('', ' ', '   ', 'abc', '1,2,3', '-5', '0', '1e3', 'NaN', '99999', '0,0001'),
      fc.double({ noNaN: false }).map((d) => String(d)),
      fc.integer({ min: -1000, max: 100_000 }).map(String),
    );

    const corruptors: Partial<Record<keyof FormValues, fc.Arbitrary<unknown>>> = {
      company: fc.oneof(fc.constantFrom('', ' ', '\t'), fc.string()),
      contactName: fc.string(),
      email: fc.oneof(fc.string(), fc.constantFrom('a@b.com', 'x@y.example', ' ', '')),
      county: fc.oneof(fc.string(), fc.constantFrom('', 'Narnia', 'Ilfov ', 'bucurești')),
      bucketKg: arbNumericCorruption,
      gripperKg: arbNumericCorruption,
      ratePerMin: arbNumericCorruption,
      shiftsPerDay: arbNumericCorruption,
      operatorsPerShift: arbNumericCorruption,
      bucketsPerPallet: arbNumericCorruption,
      manualConfirmed: fc.boolean(),
    };
    const fieldNames = Object.keys(corruptors) as (keyof FormValues)[];

    const arbAnyForm: fc.Arbitrary<FormValues> = fc
      .tuple(arbValidForm, fc.subarray(fieldNames))
      .chain(([c, fields]) =>
        fc
          .tuple(...fields.map((f) => corruptors[f] as fc.Arbitrary<unknown>))
          .map((vals) => {
            const out = { ...c.values } as Record<string, unknown>;
            fields.forEach((f, i) => {
              out[f] = vals[i];
            });
            return out as unknown as FormValues;
          }),
      );

    /** **Validates: Requirements 1.7, 2.11, 14.7** */
    it('evaluate() is deterministic and does not mutate its input', () => {
      fc.assert(
        fc.property(fc.oneof(arbValidForm.map((c) => c.values), arbAnyForm), (values) => {
          const before = structuredClone(values);
          const r1 = evaluate(values);
          const r2 = evaluate(values);
          expect(r2).toEqual(r1);
          expect(r2.reasons).toEqual(r1.reasons);
          expect(r2.notes).toEqual(r1.notes);
          expect(values).toEqual(before);
        }),
        { numRuns: 300 },
      );
    });

    /** **Validates: Requirements 1.7, 2.11, 14.7** */
    it('validate() does not mutate its input', () => {
      fc.assert(
        fc.property(fc.oneof(arbValidForm.map((c) => c.values), arbAnyForm), (values) => {
          const before = structuredClone(values);
          validate(values);
          expect(values).toEqual(before);
        }),
        { numRuns: 200 },
      );
    });

    it('evaluating the frozen demo presets does not throw and is deterministic', () => {
      expect(Object.isFrozen(DEMO_NORMAL)).toBe(true);
      expect(Object.isFrozen(DEMO_ERRORS)).toBe(true);
      expect(() => evaluate(DEMO_NORMAL)).not.toThrow();
      expect(() => evaluate(DEMO_ERRORS)).not.toThrow();
      expect(() => validate(DEMO_ERRORS)).not.toThrow();
      expect(evaluate(DEMO_NORMAL)).toEqual(evaluate(DEMO_NORMAL));
      expect(evaluate(DEMO_ERRORS)).toEqual(evaluate(DEMO_ERRORS));
    });
  });
  // Feature: paletcheck-ur20, Property 10: Summary composition
  describe('Property 10: Summary composition', () => {
    const PAYLOAD_RE = /^\d+(,\d)? kg \/ 20 kg UR20$/;
    const RATE_RE = /^\d+,\d{1,2} vs (8,6|7,4) găleți\/min \(reper FAT\)$/;
    // Integer part may carry dot thousands grouping (e.g. 200 buckets at 0,1/min → "2.000,0").
    const PALLET_RE = /^Schimb palet la ~\d{1,3}(\.\d{3})*,\d min \(\d+ găleți\/palet\)$/;
    /** **Validates: Requirements 3.3, 4.7, 5.2, 6.3, 7.9** */
    it('summary joins verdict and the four KPI strings; each KPI string has its fixed shape', () => {
      fc.assert(
        fc.property(arbValidForm, (c) => {
          const r = evaluate(c.values);
          expect(r.kpi).not.toBeNull();
          const kpi = r.kpi!;
          expect(r.summary).toBe([r.verdict, kpi.payload, kpi.rate, kpi.pallet, kpi.hub].join(' • '));
          expect(kpi.payload.endsWith(' kg / 20 kg UR20')).toBe(true);
          expect(kpi.payload).toMatch(PAYLOAD_RE);
          expect(kpi.payload).not.toMatch(/,0 kg/);
          expect(kpi.rate).toMatch(RATE_RE);
          expect(kpi.rate.endsWith(` vs ${c.bucketMilli <= 5000 ? '8,6' : '7,4'} găleți/min (reper FAT)`)).toBe(true);
          expect(kpi.pallet).toMatch(PALLET_RE);
          expect(kpi.pallet.endsWith(`(${c.buckets} găleți/palet)`)).toBe(true);
          expect(kpi.hub).toBe('Hub: ' + r.hub);
        }),
        { numRuns: 200 },
      );
    });
    it('DEMO_NORMAL produces the exact summary line', () => {
      expect(evaluate(DEMO_NORMAL).summary).toBe(
        'Compatibil pentru evaluare tehnică • 16 kg / 20 kg UR20 • 6,5 vs 7,4 găleți/min (reper FAT) • Schimb palet la ~6,8 min (44 găleți/palet) • Hub: Dragomirești-Deal',
      );
    });
    it('long pallet intervals use dot thousands grouping', () => {
      const r = evaluate({ ...DEMO_NORMAL, ratePerMin: '0,1', bucketsPerPallet: '200' });
      expect(r.kpi?.pallet).toBe('Schimb palet la ~2.000,0 min (200 găleți/palet)');
    });
  });

  // Feature: paletcheck-ur20, Property 14: Default buckets per pallet
  describe('Property 14: Default buckets per pallet', () => {
    /** **Validates: Requirements 2.2** */
    it('returns 100 for bucketMilli <= 5000 and 44 otherwise', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer({ min: 0, max: 30000 }), fc.constantFrom(5000, 5001)),
          (bucketMilli) => {
            expect(defaultBucketsPerPallet(bucketMilli)).toBe(bucketMilli <= 5000 ? 100 : 44);
          },
        ),
        { numRuns: 200 },
      );
    });
    it('boundary and typical examples', () => {
      expect(defaultBucketsPerPallet(5000)).toBe(100);
      expect(defaultBucketsPerPallet(5001)).toBe(44);
      expect(defaultBucketsPerPallet(13000)).toBe(44);
    });
  });

  // Feature: paletcheck-ur20, Task 6.10: engine examples
  describe('engine examples', () => {
    /** Requirements 3.6, 6.5, 7.10 */
    it('DEMO_NORMAL gives the Req 7.10 summary with no reasons or notes', () => {
      const r = evaluate(DEMO_NORMAL);
      expect(r.summary).toBe(
        'Compatibil pentru evaluare tehnică • 16 kg / 20 kg UR20 • 6,5 vs 7,4 găleți/min (reper FAT) • Schimb palet la ~6,8 min (44 găleți/palet) • Hub: Dragomirești-Deal',
      );
      expect(r.reasons).toEqual([]);
      expect(r.notes).toEqual([]);
    });

    it('17 kg bucket + 3 kg gripper sits exactly at the limit and is not an error', () => {
      const r = evaluate({ ...DEMO_NORMAL, bucketKg: '17', gripperKg: '3' });
      expect(r.kpi?.payload).toBe('20 kg / 20 kg UR20');
      expect(r.verdict).not.toBe('Eroare date');
    });

    it('non-food segment on DEMO_NORMAL needs extra validation', () => {
      const r = evaluate({ ...DEMO_NORMAL, segment: 'Altă industrie (non-alimentară)' });
      expect(r.verdict).toBe('Validare suplimentară');
      expect(r.reasons).toEqual(['Industrie non-alimentară: necesită validare tehnică separată']);
    });

    it('empty county gives Eroare date with no hub, KPI or summary', () => {
      const r = evaluate({ ...DEMO_NORMAL, county: '' });
      expect(r.verdict).toBe('Eroare date');
      expect(r.hub).toBeNull();
      expect(r.errors.county).toBe('Câmp obligatoriu.');
      expect(r.kpi).toBeNull();
      expect(r.summary).toBeNull();
    });
  });
});
