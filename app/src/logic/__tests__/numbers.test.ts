import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatInt, formatScaled, parseMilli } from '../numbers';

const RO_FORMAT = /^\d{1,3}(\.\d{3})*(,\d+)?$/;

describe('formatScaled examples (design.md)', () => {
  it('matches documented outputs', () => {
    expect(formatScaled(160, 1, { min: 0, max: 1 })).toBe('16');
    expect(formatScaled(165, 1, { min: 0, max: 1 })).toBe('16,5');
    expect(formatScaled(68, 1, { min: 1, max: 1 })).toBe('6,8');
    expect(formatScaled(130000, 0)).toBe('130.000');
    expect(formatInt(130000)).toBe('130.000');
    expect(formatScaled(5, 3)).toBe('0,005');
  });
});

describe('parseMilli', () => {
  it('treats comma and dot decimal separators the same', () => {
    expect(parseMilli('6,5')).toBe(6500);
    expect(parseMilli(' 6.5 ')).toBe(6500);
    expect(parseMilli('13')).toBe(13000);
    expect(parseMilli('')).toBeNull();
    expect(parseMilli('-1')).toBeNull();
    expect(parseMilli('1,2,3')).toBeNull();
  });
});

// Feature: paletcheck-ur20, Property 9: Romanian number format round trip
// **Validates: Requirements 3.3, 4.7, 5.2, 9.1, 10.11**
describe('Property 9: Romanian number format round trip', () => {
  it('formats with RO separators and round-trips exactly (min = max = decimals)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), fc.integer({ min: 0, max: 3 }), (v, decimals) => {
        const s = formatScaled(v, decimals, { min: decimals, max: decimals });
        expect(s).toMatch(RO_FORMAT);

        const [intPart, frac = ''] = s.split(',');
        expect(frac.includes('.')).toBe(false);
        expect(frac.length).toBe(decimals);

        // Integer string arithmetic: "1.234,56" -> "1234.56" -> x10^decimals == digits "123456".
        const normalized = s.replace(/\./g, '').replace(',', '.');
        const [i, f = ''] = normalized.split('.');
        expect(i + f.padEnd(decimals, '0')).toBe(intPart.replace(/\./g, '') + frac);
        expect(BigInt(i + f.padEnd(decimals, '0'))).toBe(BigInt(v));
      }),
      { numRuns: 200 },
    );
  });

  it('never ends in ",0" when min = 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), fc.integer({ min: 0, max: 3 }), (v, decimals) => {
        const s = formatScaled(v, decimals, { min: 0, max: decimals });
        expect(s).toMatch(RO_FORMAT);
        expect(s.endsWith(',0')).toBe(false);
        expect(/,\d*0$/.test(s)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});
