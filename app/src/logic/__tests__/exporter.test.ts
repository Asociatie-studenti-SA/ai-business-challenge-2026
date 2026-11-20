// Feature: paletcheck-ur20, Property 18: Request build and export round trip
// **Validates: Requirements 6.6, 8.9, 14.10**

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { buildRequest, evaluate } from '../engine';
import { downloadRequest, exportFileName, parseRequest, serializeRequest } from '../exporter';
import type { FormValues } from '../types';
import { arbValidForm } from './arbitraries';

const DIACRITICS = ['ă', 'â', 'î', 'ș', 'ț', 'Ă', 'Â', 'Î', 'Ș', 'Ț'] as const;

/** Strings mixing Romanian diacritics, ASCII letters and spaces; always contain ≥1 diacritic. */
const arbDiacriticName = fc
  .tuple(
    fc.constantFrom(...DIACRITICS),
    fc.array(fc.constantFrom(...DIACRITICS, 'a', 'S', 'r', 'L', ' '), { maxLength: 20 }),
    fc.constantFrom('', ' ', '  '),
    fc.constantFrom('', ' ', '  '),
  )
  .map(([first, rest, pre, post]) => `${pre}${first}${rest.join('')}${post}`);

const arbIso = fc
  .date({ min: new Date('2020-01-01T00:00:00.000Z'), max: new Date('2035-12-31T23:59:59.999Z') })
  .filter((d) => !Number.isNaN(d.getTime()))
  .map((d) => d.toISOString());

describe('Property 18: Request build and export round trip', () => {
  it('buildRequest mirrors the evaluation and the JSON export round-trips with diacritics intact', () => {
    fc.assert(
      fc.property(arbValidForm, arbDiacriticName, arbDiacriticName, arbIso, (c, company, contact, iso) => {
        const values: FormValues = { ...c.values, company, contactName: contact };
        const result = evaluate(values);
        expect(result.verdict).not.toBe('Eroare date');

        const r = buildRequest(values, result, iso);
        expect(r.hub).toBe(result.hub);
        expect(r.verdict).toBe(result.verdict);
        expect(r.company).toBe(company.trim());
        expect(r.contactName).toBe(contact.trim());
        expect(r.email).toBe(values.email.trim());
        expect(r.createdAt).toBe(iso);

        const text = serializeRequest(r);
        expect(parseRequest(text)).toEqual(r);
        expect(text).not.toMatch(/\\u[0-9a-fA-F]{4}/);
        expect(text).toContain(r.company);
        if (r.contactName !== '') expect(text).toContain(r.contactName);

        expect(exportFileName(r)).toBe(`cerere-paletcheck-${iso.slice(0, 10)}.json`);
      }),
      { numRuns: 200 },
    );
  });

  it('buildRequest throws for an "Eroare date" result', () => {
    fc.assert(
      fc.property(arbValidForm, (c) => {
        const values: FormValues = { ...c.values, company: '   ' };
        const result = evaluate(values);
        expect(result.verdict).toBe('Eroare date');
        expect(() => buildRequest(values, result, new Date().toISOString())).toThrow();
      }),
      { numRuns: 100 },
    );
  });

  it('downloadRequest returns false without throwing when no DOM is available', () => {
    const [c] = fc.sample(arbValidForm, { numRuns: 1, seed: 42 });
    const values: FormValues = { ...c.values, company: 'SC Țară Șes Demo SRL' };
    const result = evaluate(values);
    const r = buildRequest(values, result, '2026-11-20T11:30:00.000Z');
    expect(typeof document).toBe('undefined');
    let ok: boolean | undefined;
    expect(() => {
      ok = downloadRequest(r);
    }).not.toThrow();
    expect(ok).toBe(false);
  });
});
