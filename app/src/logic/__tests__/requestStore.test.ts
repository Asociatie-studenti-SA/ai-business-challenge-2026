import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { dedupKey, createRequestStore, STORAGE_KEY } from '../requestStore';
import type { StorageLike } from '../requestStore';
import { COUNTIES } from '../hubs';
import { SEGMENTS } from '../constants';
import type { QualifiedRequest, Segment } from '../types';

// ---------------------------------------------------------------------------
// Shared generators for requestStore property tests (tasks 8.2–8.4).
// ---------------------------------------------------------------------------

/** Lowercase letters incl. Romanian diacritics; toUpperCase/toLowerCase are 1:1 on these. */
const LETTERS = 'abcdefghijklmnopqrstuvwxyzăâîșț'.split('');

const arbWord = fc
  .array(fc.constantFrom(...LETTERS), { minLength: 1, maxLength: 8 })
  .map((cs) => cs.join(''));

/** Canonical (lowercase, single-spaced, trimmed) company name, e.g. "brutăria țara noastră". */
export const arbCompany = fc
  .array(arbWord, { minLength: 1, maxLength: 4 })
  .map((ws) => ws.join(' '));

/** Canonical (lowercase, trimmed) synthetic email on a .example domain. */
export const arbEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._]{0,10}$/),
    fc.stringMatching(/^[a-z]{2,10}$/),
  )
  .map(([local, dom]) => `${local}@${dom}.example`);

export const arbCounty = fc.constantFrom(...COUNTIES);

const arbContactName = fc
  .tuple(arbWord, arbWord)
  .map(([a, b]) => `${a[0].toUpperCase()}${a.slice(1)} ${b[0].toUpperCase()}${b.slice(1)}`);

/** A plausible stored QualifiedRequest with synthetic data. */
export const arbRequest: fc.Arbitrary<QualifiedRequest> = fc.record({
  company: arbCompany,
  contactName: arbContactName,
  email: arbEmail,
  county: arbCounty,
  segment: fc.constantFrom(...(SEGMENTS as readonly Segment[])),
  line: fc.record({
    bucketKg: fc.integer({ min: 1000, max: 15000 }).map((m) => m / 1000),
    gripperKg: fc.integer({ min: 0, max: 5000 }).map((m) => m / 1000),
    ratePerMin: fc.integer({ min: 1000, max: 6000 }).map((m) => m / 1000),
    shiftsPerDay: fc.integer({ min: 1, max: 3 }),
    operatorsPerShift: fc.integer({ min: 1, max: 5 }),
    bucketsPerPallet: fc.integer({ min: 1, max: 200 }),
    manualConfirmed: fc.constant(true as const),
  }),
  verdict: fc.constantFrom(
    'Compatibil pentru evaluare tehnică' as const,
    'Validare suplimentară' as const,
  ),
  hub: fc.constantFrom('Dragomirești-Deal' as const, 'Timișoara' as const, 'Iași' as const),
  createdAt: fc
    .integer({ min: Date.UTC(2026, 0, 1), max: Date.UTC(2027, 0, 1) })
    .map((t) => new Date(t).toISOString()),
});

// --- Variation helpers -----------------------------------------------------

/** Randomly flips the case of each character. */
function arbRecase(s: string): fc.Arbitrary<string> {
  return fc
    .array(fc.boolean(), { minLength: s.length, maxLength: s.length })
    .map((flags) => s.split('').map((c, i) => (flags[i] ? c.toUpperCase() : c)).join(''));
}

const arbWs = fc
  .array(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 3 })
  .map((a) => a.join(''));
const arbWsRun = fc
  .array(fc.constantFrom(' ', '\t'), { minLength: 1, maxLength: 4 })
  .map((a) => a.join(''));

/** Case changes + leading/trailing whitespace + variable internal whitespace runs. */
function arbCompanyVariant(canonical: string): fc.Arbitrary<string> {
  const words = canonical.split(' ');
  return fc
    .tuple(
      arbRecase(canonical),
      fc.array(arbWsRun, { minLength: words.length, maxLength: words.length }),
      arbWs,
      arbWs,
    )
    .map(([recased, runs, lead, trail]) => {
      const ws = recased.split(' ');
      return lead + ws.map((w, i) => (i === 0 ? w : runs[i] + w)).join('') + trail;
    });
}

/** Case changes + leading/trailing whitespace only. */
function arbEmailVariant(canonical: string): fc.Arbitrary<string> {
  return fc
    .tuple(arbRecase(canonical), arbWs, arbWs)
    .map(([e, lead, trail]) => lead + e + trail);
}

// ---------------------------------------------------------------------------

describe('requestStore', () => {
  describe('Property 15: Dedup key normalization', () => {
    // Feature: paletcheck-ur20, Property 15: Dedup key normalization
    // **Validates: Requirements 14.9**

    it('is equal across case / whitespace variants of company and email', () => {
      const arbCase = arbRequest.chain((r) =>
        fc.tuple(fc.constant(r), arbCompanyVariant(r.company), arbEmailVariant(r.email)),
      );
      fc.assert(
        fc.property(arbCase, ([r, company, email]) => {
          expect(dedupKey({ ...r, company, email })).toBe(dedupKey(r));
        }),
        { numRuns: 200 },
      );
    });

    it('handles Romanian diacritic case pairs', () => {
      expect(dedupKey({ company: '  ȚARA   Brutăriei ', email: ' Ana@Exemplu.EXAMPLE ', county: 'Iași' }))
        .toBe(dedupKey({ company: 'țara brutăriei', email: 'ana@exemplu.example', county: 'Iași' }));
    });

    it('differs whenever county differs, all else equal', () => {
      const arbPair = fc
        .tuple(arbRequest, arbCounty, arbCounty)
        .filter(([, a, b]) => a !== b);
      fc.assert(
        fc.property(arbPair, ([r, a, b]) => {
          expect(dedupKey({ ...r, county: a })).not.toBe(dedupKey({ ...r, county: b }));
        }),
        { numRuns: 200 },
      );
    });
  });

  describe('Property 16: Save, dedup idempotence and persistence round trip', () => {
    // Feature: paletcheck-ur20, Property 16: Save, dedup idempotence and persistence round trip
    // **Validates: Requirements 8.5, 8.7, 8.11, 14.8**

    /** Map-backed StorageLike that counts setItem calls. */
    function createFakeStorage(): StorageLike & { setCalls: number; map: Map<string, string> } {
      const map = new Map<string, string>();
      return {
        map,
        setCalls: 0,
        getItem(k) {
          return map.has(k) ? (map.get(k) as string) : null;
        },
        setItem(k, v) {
          this.setCalls += 1;
          map.set(k, v);
        },
      };
    }

    /**
     * Base requests plus re-saves of sampled ones (with case/whitespace variants
     * of company and email), shuffled into one save sequence.
     */
    const arbSequence: fc.Arbitrary<QualifiedRequest[]> = fc
      .array(arbRequest, { minLength: 0, maxLength: 12 })
      .chain((base) => {
        const arbDup =
          base.length === 0
            ? fc.constant<QualifiedRequest[]>([])
            : fc.array(
                fc
                  .integer({ min: 0, max: base.length - 1 })
                  .chain((i) =>
                    fc
                      .tuple(
                        arbCompanyVariant(base[i].company),
                        arbEmailVariant(base[i].email),
                        fc.boolean(),
                      )
                      .map(([company, email, exact]) =>
                        exact ? base[i] : { ...base[i], company, email },
                      ),
                  ),
                { minLength: 0, maxLength: 8 },
              );
        return arbDup.chain((dups) => {
          const all = [...base, ...dups];
          return fc
            .array(fc.double({ min: 0, max: 1, noNaN: true }), {
              minLength: all.length,
              maxLength: all.length,
            })
            .map((keys) =>
              all
                .map((r, i) => ({ r, k: keys[i], i }))
                .sort((a, b) => a.k - b.k || a.i - b.i)
                .map((x) => x.r),
            );
        });
      });

    it('dedups idempotently, counts distinct keys, and round-trips through storage', () => {
      fc.assert(
        fc.property(arbSequence, (seq) => {
          const storage = createFakeStorage();
          const store = createRequestStore(storage);
          const firstByKey = new Map<string, QualifiedRequest>();

          for (const r of seq) {
            const key = dedupKey(r);
            const listBefore = store.list();
            const countBefore = store.count();
            const setsBefore = storage.setCalls;
            const storedBefore = storage.map.get(STORAGE_KEY);

            const res = store.save(r);
            const original = firstByKey.get(key);

            if (original) {
              expect(res.status).toBe('duplicate');
              expect(res.record).toEqual(original);
              expect(store.count()).toBe(countBefore);
              expect(store.list()).toEqual(listBefore);
              expect(storage.setCalls).toBe(setsBefore);
              expect(storage.map.get(STORAGE_KEY)).toBe(storedBefore);
            } else {
              firstByKey.set(key, r);
              expect(res.status).toBe('saved');
              expect(res.record).toEqual(r);
              expect(store.count()).toBe(countBefore + 1);
              expect(store.list()).toEqual([...listBefore, r]);
            }
          }

          const distinct = new Set(seq.map(dedupKey)).size;
          expect(store.count()).toBe(distinct);
          expect(store.list()).toEqual([...firstByKey.values()]);

          // Saving every request again changes nothing (saving twice ≡ saving once).
          const listAfter = store.list();
          const setsAfter = storage.setCalls;
          for (const r of seq) {
            expect(store.save(r).status).toBe('duplicate');
          }
          expect(store.list()).toEqual(listAfter);
          expect(storage.setCalls).toBe(setsAfter);

          // Persistence round trip.
          const reloaded = createRequestStore(storage);
          expect(reloaded.list()).toEqual(store.list());
          expect(reloaded.count()).toBe(store.count());
        }),
        { numRuns: 150 },
      );
    });
  });

  describe('Property 17: Corrupt or failing storage falls back to memory', () => {
    // Feature: paletcheck-ur20, Property 17: Corrupt or failing storage falls back to memory
    // **Validates: Requirements 8.10, 8.11**

    /** StorageLike that returns a fixed value for STORAGE_KEY. */
    function storageWith(value: string | null): StorageLike {
      return {
        getItem: (k) => (k === STORAGE_KEY ? value : null),
        setItem: () => {},
      };
    }

    const REQUIRED = ['company', 'email', 'county', 'createdAt'] as const;

    /** A stored item that fails the shape check: missing or non-string required field, or not an object. */
    const arbBadItem: fc.Arbitrary<unknown> = fc.oneof(
      fc
        .tuple(arbRequest, fc.constantFrom(...REQUIRED))
        .map(([r, f]) => {
          const o: Record<string, unknown> = { ...r };
          delete o[f];
          return o;
        }),
      fc
        .tuple(
          arbRequest,
          fc.constantFrom(...REQUIRED),
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.string(), { maxLength: 2 })),
        )
        .map(([r, f, v]) => ({ ...r, [f]: v })),
      fc.oneof(fc.integer(), fc.string(), fc.constant(null), fc.boolean(), fc.array(fc.integer(), { maxLength: 3 })),
    );

    /** Arrays of valid requests with at least one bad item inserted at a random position. */
    const arbMixedArray = fc
      .tuple(fc.array(arbRequest, { maxLength: 5 }), arbBadItem, fc.nat())
      .map(([good, bad, pos]) => {
        const arr: unknown[] = [...good];
        arr.splice(pos % (good.length + 1), 0, bad);
        return JSON.stringify(arr);
      });

    const arbCorrupt: fc.Arbitrary<string | null> = fc.oneof(
      fc.constant(null),
      fc.string(),
      fc.string().map((s) => `{${s}`), // invalid JSON
      fc.string().map((s) => `[${JSON.stringify(s)}`), // truncated array
      fc
        .jsonValue()
        .filter((v) => !Array.isArray(v))
        .map((v) => JSON.stringify(v)), // valid JSON, not an array
      arbMixedArray,
    );

    it('starts empty for any value that is not a valid request array', () => {
      fc.assert(
        fc.property(arbCorrupt, (value) => {
          const store = createRequestStore(storageWith(value));
          expect(store.count()).toBe(0);
          expect(store.list()).toEqual([]);
        }),
        { numRuns: 300 },
      );
    });

    /** Base requests plus re-saves (exact or case/whitespace variants). */
    const arbSequence: fc.Arbitrary<QualifiedRequest[]> = fc
      .array(arbRequest, { minLength: 0, maxLength: 10 })
      .chain((base) =>
        base.length === 0
          ? fc.constant<QualifiedRequest[]>([])
          : fc
              .array(
                fc.integer({ min: 0, max: base.length - 1 }).chain((i) =>
                  fc
                    .tuple(arbCompanyVariant(base[i].company), arbEmailVariant(base[i].email))
                    .map(([company, email]) => ({ ...base[i], company, email })),
                ),
                { maxLength: 6 },
              )
              .map((dups) => [...base, ...dups]),
      );

    type Mode = 'getThrows' | 'setThrows' | 'bothThrow' | 'null';
    const arbMode = fc.constantFrom<Mode>('getThrows', 'setThrows', 'bothThrow', 'null');

    function failingStorage(mode: Mode): StorageLike | null {
      if (mode === 'null') return null;
      return {
        getItem() {
          if (mode === 'getThrows' || mode === 'bothThrow') throw new Error('SecurityError');
          return null;
        },
        setItem() {
          if (mode === 'setThrows' || mode === 'bothThrow') throw new Error('QuotaExceededError');
        },
      };
    }

    it('keeps saves and dedup in memory when storage throws or is absent', () => {
      fc.assert(
        fc.property(arbMode, arbSequence, (mode, seq) => {
          let store!: ReturnType<typeof createRequestStore>;
          expect(() => {
            store = createRequestStore(failingStorage(mode));
          }).not.toThrow();
          expect(store.count()).toBe(0);

          const firstByKey = new Map<string, QualifiedRequest>();
          for (const r of seq) {
            const key = dedupKey(r);
            const countBefore = store.count();
            let res!: ReturnType<typeof store.save>;
            expect(() => {
              res = store.save(r);
            }).not.toThrow();

            const original = firstByKey.get(key);
            if (original) {
              expect(res.status).toBe('duplicate');
              expect(res.record).toEqual(original);
              expect(store.count()).toBe(countBefore);
            } else {
              firstByKey.set(key, r);
              expect(res.status).toBe('saved');
              expect(store.count()).toBe(countBefore + 1);
            }
          }

          expect(store.count()).toBe(new Set(seq.map(dedupKey)).size);
          expect(store.list()).toEqual([...firstByKey.values()]);
        }),
        { numRuns: 200 },
      );
    });
  });
});
