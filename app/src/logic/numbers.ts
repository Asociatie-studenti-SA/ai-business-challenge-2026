// Exact numeric helpers on scaled integers + deterministic Romanian formatting.
// No Intl.NumberFormat / toLocaleString: output must be identical in Node and browsers.

const NUMERIC_RE = /^\d+([.,]\d+)?$/;

/** Parses "6,5", " 6.5 ", "13" into integer thousandths. Returns null for empty,
 *  whitespace-only, non-numeric, NaN/Infinity, signed values, or more than one separator.
 *  Inputs with more than 3 decimals are rounded half-up to thousandths. */
export function parseMilli(raw: string): number | null {
  const trimmed = raw.trim();
  if (!NUMERIC_RE.test(trimmed)) return null;
  const n = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const milli = Math.round(n * 1000);
  return Number.isSafeInteger(milli) ? milli : null;
}

/** Integer half-up rounding of a non-negative scaled value to a coarser scale.
 *  roundDiv(16050, 100) === 161 (16,05 kg -> 16,1 kg in tenths). */
export function roundDiv(value: number, divisor: number): number {
  return Math.floor((2 * value + divisor) / (2 * divisor));
}

function groupThousands(digits: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return out;
}

/** Formats an integer `value` that represents value / 10^decimals, Romanian style
 *  (',' decimal separator, '.' thousands separator).
 *  - `max` (default `decimals`): maximum fraction digits. If `max < decimals`, the value
 *    is rounded half-up to `max` digits first.
 *  - `min` (default `max`): trailing zeros are trimmed down to `min` digits; if `min`
 *    exceeds the available digits, zeros are padded.
 *  formatScaled(160, 1, {min:0, max:1}) === "16"
 *  formatScaled(165, 1, {min:0, max:1}) === "16,5"
 *  formatScaled(68, 1, {min:1, max:1})  === "6,8"
 *  formatScaled(130000, 0)              === "130.000" */
export function formatScaled(
  value: number,
  decimals: number,
  opts?: { min?: number; max?: number },
): string {
  const max = Math.max(0, opts?.max ?? decimals);
  const min = Math.min(Math.max(0, opts?.min ?? max), max);

  const negative = value < 0;
  let abs = Math.round(Math.abs(value));
  let digits = decimals;
  if (max < decimals) {
    abs = roundDiv(abs, 10 ** (decimals - max));
    digits = max;
  }

  let s = String(abs).padStart(digits + 1, '0');
  let intPart = s.slice(0, s.length - digits);
  let frac = digits > 0 ? s.slice(s.length - digits) : '';

  while (frac.length > min && frac.endsWith('0')) frac = frac.slice(0, -1);
  while (frac.length < min) frac += '0';

  const body = groupThousands(intPart) + (frac ? ',' + frac : '');
  return negative && /[1-9]/.test(body) ? '-' + body : body;
}

/** Integer with dot thousands, e.g. formatInt(130000) === "130.000". */
export const formatInt = (n: number): string => formatScaled(n, 0);
