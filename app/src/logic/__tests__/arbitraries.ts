// Shared fast-check generators for PaletCheck UR20 property tests (see design.md,
// Correctness Properties intro: `arbValidForm`).
// Every generated form passes validate() with zero errors. The underlying scaled
// integers are returned alongside the form so tests can compute an oracle.

import fc from 'fast-check';
import { SEGMENTS } from '../constants';
import { COUNTIES } from '../hubs';
import type { FormValues, Segment } from '../types';

export interface ValidFormCase {
  values: FormValues;
  bucketMilli: number;
  gripperMilli: number;
  rateMilli: number;
  shifts: number;
  operators: number;
  buckets: number;
  segment: Segment;
  county: string;
}

/** Payload limit in milli (200 tenths = 20 kg). */
const PAYLOAD_LIMIT_MILLI = 20_000;

/** Renders integer thousandths as a decimal string with the chosen separator and
 *  optional trailing zeros, e.g. (6500, ',', false) -> "6,5", (6500, '.', true) -> "6.500". */
export function milliToString(milli: number, sep: ',' | '.', padZeros: boolean): string {
  const int = Math.floor(milli / 1000);
  let frac = String(milli % 1000).padStart(3, '0');
  if (!padZeros) frac = frac.replace(/0+$/, '');
  return frac === '' ? String(int) : `${int}${sep}${frac}`;
}

const arbNumText = (milli: number): fc.Arbitrary<string> =>
  fc
    .tuple(fc.constantFrom<',' | '.'>(',', '.'), fc.boolean())
    .map(([sep, pad]) => milliToString(milli, sep, pad));

/** Bucket milli 500–20000 step 100, with 5000 and 13000 boundaries mixed in. */
const arbBucketMilli = fc.oneof(
  fc.constantFrom(5000, 13_000),
  fc.integer({ min: 5, max: 200 }).map((n) => n * 100),
);

/** Gripper milli 0–10000 step 100 built from the remaining payload budget,
 *  with "payload exactly 200 tenths" mixed in. */
const arbGripperMilli = (bucketMilli: number): fc.Arbitrary<number> => {
  const maxSteps = Math.min(100, (PAYLOAD_LIMIT_MILLI - bucketMilli) / 100);
  return fc.oneof(
    fc.constant(maxSteps * 100),
    fc.integer({ min: 0, max: maxSteps }).map((n) => n * 100),
  );
};

/** Rate milli 100–20000 step 10, with 6000 / 7400 / 8600 boundaries mixed in. */
const arbRateMilli = fc.oneof(
  fc.constantFrom(6000, 7400, 8600),
  fc.integer({ min: 10, max: 2000 }).map((n) => n * 10),
);

/** (rateMilli, buckets): generic, or pallet interval exactly 50 tenths (rate = 200 × buckets). */
const arbRateAndBuckets: fc.Arbitrary<{ rateMilli: number; buckets: number }> = fc.oneof(
  fc.record({ rateMilli: arbRateMilli, buckets: fc.integer({ min: 1, max: 200 }) }),
  fc.integer({ min: 1, max: 100 }).map((b) => ({ rateMilli: 200 * b, buckets: b })),
);

const arbEmail = fc.oneof(
  fc.constant(''),
  fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
      fc.stringMatching(/^[a-z][a-z0-9-]{0,9}$/),
    )
    .map(([user, domain]) => `${user}@${domain}.example`),
);

export const arbValidForm: fc.Arbitrary<ValidFormCase> = arbBucketMilli
  .chain((bucketMilli) =>
    fc.record({
      bucketMilli: fc.constant(bucketMilli),
      gripperMilli: arbGripperMilli(bucketMilli),
      rb: arbRateAndBuckets,
      shifts: fc.integer({ min: 1, max: 3 }),
      operators: fc.integer({ min: 1, max: 10 }),
      segment: fc.constantFrom(...SEGMENTS),
      county: fc.constantFrom(...COUNTIES),
      email: arbEmail,
      company: fc.stringMatching(/^SC [A-Z][a-z]{1,10} Demo SRL$/),
      contactName: fc.constantFrom('', 'Ana Popescu (Demo)', 'Test Operator (Demo)'),
    }),
  )
  .chain((r) =>
    fc
      .record({
        bucketKg: arbNumText(r.bucketMilli),
        gripperKg: arbNumText(r.gripperMilli),
        ratePerMin: arbNumText(r.rb.rateMilli),
        shiftsPerDay: arbNumText(r.shifts * 1000),
        operatorsPerShift: arbNumText(r.operators * 1000),
        bucketsPerPallet: arbNumText(r.rb.buckets * 1000),
      })
      .map(
        (texts): ValidFormCase => ({
          values: {
            company: r.company,
            contactName: r.contactName,
            email: r.email,
            county: r.county,
            segment: r.segment,
            ...texts,
            manualConfirmed: true,
          },
          bucketMilli: r.bucketMilli,
          gripperMilli: r.gripperMilli,
          rateMilli: r.rb.rateMilli,
          shifts: r.shifts,
          operators: r.operators,
          buckets: r.rb.buckets,
          segment: r.segment,
          county: r.county,
        }),
      ),
  );
