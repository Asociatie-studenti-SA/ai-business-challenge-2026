// Deterministic UR20 compatibility engine for PaletCheck UR20 (see design.md, `engine.ts`).
// Pure module: validates first, then computes payload, FAT reference, pallet interval,
// reasons (fixed order), notes, verdict, hub and formatted display strings.
// Never mutates its input.

import {
  FAT,
  LIGHT_BUCKET_MAX_MILLI,
  MESSAGES,
  NON_FOOD_SEGMENT,
  PALLET_THRESHOLD_TENTHS,
} from './constants';
import { routeHub } from './hubs';
import { formatScaled, roundDiv } from './numbers';
import type { EvaluationResult, FormValues, QualifiedRequest, Verdict } from './types';
import { totalPayloadTenths, validate } from './validator';

/** Default buckets per pallet: light buckets (≤ 5 kg) → 100, otherwise 44. */
export function defaultBucketsPerPallet(bucketMilli: number): 100 | 44 {
  return bucketMilli <= LIGHT_BUCKET_MAX_MILLI ? 100 : 44;
}

export function evaluate(values: FormValues): EvaluationResult {
  const { errors, parsed } = validate(values);
  const hub = parsed ? routeHub(values.county) : null;

  if (!parsed || hub === null) {
    return {
      verdict: 'Eroare date',
      errors: { ...errors },
      totalPayloadTenths: null,
      fatRefMilli: null,
      palletIntervalTenths: null,
      hub: null,
      reasons: [],
      notes: [],
      kpi: null,
      summary: null,
    };
  }

  const { bucketMilli, gripperMilli, rateMilli, bucketsPerPallet } = parsed;

  // 1–3. Core figures on scaled integers.
  const payloadTenths = totalPayloadTenths(bucketMilli, gripperMilli);
  const fatRefMilli: 8600 | 7400 =
    bucketMilli <= LIGHT_BUCKET_MAX_MILLI ? FAT.refLightMilli : FAT.refHeavyMilli;
  const palletTenths = roundDiv(bucketsPerPallet * 10_000, rateMilli);

  // 4. Reasons in fixed order: rate, weight, pallet, segment.
  const reasons: string[] = [];
  if (rateMilli > fatRefMilli) reasons.push(MESSAGES.reasons.rate);
  if (bucketMilli > FAT.maxTestedMilli) reasons.push(MESSAGES.reasons.weight);
  if (palletTenths < PALLET_THRESHOLD_TENTHS) reasons.push(MESSAGES.reasons.pallet);
  if (values.segment === NON_FOOD_SEGMENT) reasons.push(MESSAGES.reasons.segment);

  // 5. Notes.
  const notes: string[] = [];
  if (rateMilli < FAT.minTargetMilli) notes.push(MESSAGES.belowTargetNote);

  // 6. Verdict.
  const verdict: Verdict =
    reasons.length > 0 ? 'Validare suplimentară' : 'Compatibil pentru evaluare tehnică';

  // 8. Display strings.
  const kpi = {
    payload: `${formatScaled(payloadTenths, 1, { min: 0, max: 1 })} kg / 20 kg UR20`,
    rate:
      `${formatScaled(roundDiv(rateMilli, 10), 2, { min: 1, max: 2 })} vs ` +
      `${formatScaled(fatRefMilli / 100, 1, { min: 1, max: 1 })} găleți/min (reper FAT)`,
    pallet:
      `Schimb palet la ~${formatScaled(palletTenths, 1, { min: 1, max: 1 })} min ` +
      `(${bucketsPerPallet} găleți/palet)`,
    hub: `Hub: ${hub}`,
  };
  const summary = [verdict, kpi.payload, kpi.rate, kpi.pallet, kpi.hub].join(' • ');

  return {
    verdict,
    errors: {},
    totalPayloadTenths: payloadTenths,
    fatRefMilli,
    palletIntervalTenths: palletTenths,
    hub,
    reasons,
    notes,
    kpi,
    summary,
  };
}

/** Builds the CRM record from a non-error evaluation. Throws on misuse (programmer error). */
export function buildRequest(
  values: FormValues,
  result: EvaluationResult,
  iso: string,
): QualifiedRequest {
  if (result.verdict === 'Eroare date' || result.hub === null) {
    throw new Error('buildRequest requires a non-error evaluation result');
  }
  const { parsed } = validate(values);
  if (!parsed) {
    throw new Error('buildRequest requires valid form values');
  }

  return {
    company: values.company.trim(),
    contactName: values.contactName.trim(),
    email: values.email.trim(),
    county: values.county,
    segment: values.segment,
    line: {
      bucketKg: parsed.bucketMilli / 1000,
      gripperKg: parsed.gripperMilli / 1000,
      ratePerMin: parsed.rateMilli / 1000,
      shiftsPerDay: parsed.shifts,
      operatorsPerShift: parsed.operators,
      bucketsPerPallet: parsed.bucketsPerPallet,
      manualConfirmed: true,
    },
    verdict: result.verdict,
    hub: result.hub,
    createdAt: iso,
  };
}
