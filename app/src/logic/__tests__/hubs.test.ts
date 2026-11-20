import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { COUNTIES, HUB_MAP, routeHub } from '../hubs';
import type { Hub } from '../types';

// Independent copy of the requirements Glossary Hub_Map (do NOT import from hubs.ts),
// so a typo in hubs.ts is caught here.
const GLOSSARY: Record<Hub, readonly string[]> = {
  'Timișoara': [
    'Timiș', 'Arad', 'Caraș-Severin', 'Hunedoara', 'Bihor', 'Satu Mare',
    'Sălaj', 'Maramureș', 'Cluj', 'Alba', 'Mehedinți',
  ],
  'Iași': [
    'Iași', 'Suceava', 'Botoșani', 'Neamț', 'Bacău', 'Vaslui',
    'Harghita', 'Bistrița-Năsăud', 'Mureș',
  ],
  'Dragomirești-Deal': [
    'București', 'Ilfov', 'Prahova', 'Dâmbovița', 'Argeș', 'Giurgiu',
    'Teleorman', 'Călărași', 'Ialomița', 'Constanța', 'Tulcea', 'Brăila',
    'Galați', 'Buzău', 'Vrancea', 'Brașov', 'Covasna', 'Sibiu',
    'Vâlcea', 'Olt', 'Dolj', 'Gorj',
  ],
} as Record<Hub, readonly string[]>;

const HUBS: readonly string[] = ['Dragomirești-Deal', 'Timișoara', 'Iași'];

describe('hubs', () => {
  // Feature: paletcheck-ur20, Property 7: Hub total mapping
  // **Validates: Requirements 6.1, 6.2, 14.5**
  describe('Property 7: Hub total mapping', () => {
    it('COUNTIES has 42 unique entries equal to the HUB_MAP key set', () => {
      expect(COUNTIES).toHaveLength(42);
      expect(new Set(COUNTIES).size).toBe(42);
      expect([...COUNTIES].sort()).toEqual(Object.keys(HUB_MAP).sort());
    });

    it('routes every county to HUB_MAP[county], one of the three hubs', () => {
      for (const county of COUNTIES) {
        const hub = routeHub(county);
        expect(hub).toBe(HUB_MAP[county]);
        expect(HUBS).toContain(hub);
      }
    });

    it('per-hub counts are 22 / 11 / 9', () => {
      const counts: Record<string, number> = {};
      for (const county of COUNTIES) {
        const hub = routeHub(county) as string;
        counts[hub] = (counts[hub] ?? 0) + 1;
      }
      expect(counts).toEqual({ 'Dragomirești-Deal': 22, 'Timișoara': 11, 'Iași': 9 });
    });

    it('HUB_MAP matches the Glossary table exactly', () => {
      const expected: Record<string, string> = {};
      for (const [hub, counties] of Object.entries(GLOSSARY)) {
        for (const c of counties) expected[c] = hub;
      }
      expect(Object.keys(expected)).toHaveLength(42);
      expect({ ...HUB_MAP }).toEqual(expected);
      for (const [county, hub] of Object.entries(expected)) {
        expect(routeHub(county)).toBe(hub);
      }
    });

    it('returns null for any string not in COUNTIES', () => {
      const countySet = new Set<string>(COUNTIES);
      const tricky = fc.constantFrom(
        '', 'toString', '__proto__', 'constructor', 'hasOwnProperty', 'valueOf',
        ...COUNTIES.map((c) => c.toLowerCase()),
        ...COUNTIES.map((c) => c.toUpperCase()),
        ...COUNTIES.map((c) => ` ${c}`),
        ...COUNTIES.map((c) => `${c} `),
        'Bucuresti', 'Iasi', 'Timis', 'Cluj-Napoca', 'Timișoara', 'Dragomirești-Deal',
      );
      const arb = fc.oneof(tricky, fc.string(), fc.string({ unit: 'grapheme' }))
        .filter((s) => !countySet.has(s));
      fc.assert(
        fc.property(arb, (s) => {
          expect(routeHub(s)).toBeNull();
        }),
        { numRuns: 200 },
      );
    });
  });

  // Unit examples — Requirements 6.1, 6.5
  describe('routeHub examples', () => {
    it('routes Ilfov to Dragomirești-Deal', () => {
      expect(routeHub('Ilfov')).toBe('Dragomirești-Deal');
    });

    it('routes Cluj to Timișoara', () => {
      expect(routeHub('Cluj')).toBe('Timișoara');
    });

    it('routes Suceava to Iași', () => {
      expect(routeHub('Suceava')).toBe('Iași');
    });

    it('returns null for an empty county', () => {
      expect(routeHub('')).toBeNull();
    });
  });
});
