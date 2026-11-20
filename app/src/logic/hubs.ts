// County list and county-to-hub routing for PaletCheck UR20 (see design.md, `hubs.ts`).
// Pure module: no side effects, no runtime sorting.

import type { Hub } from './types';

/** 42 entries: București first, then the 41 counties in Romanian alphabetical order. */
export const COUNTIES: readonly string[] = Object.freeze([
  'București',
  'Alba',
  'Arad',
  'Argeș',
  'Bacău',
  'Bihor',
  'Bistrița-Năsăud',
  'Botoșani',
  'Brașov',
  'Brăila',
  'Buzău',
  'Caraș-Severin',
  'Călărași',
  'Cluj',
  'Constanța',
  'Covasna',
  'Dâmbovița',
  'Dolj',
  'Galați',
  'Giurgiu',
  'Gorj',
  'Harghita',
  'Hunedoara',
  'Ialomița',
  'Iași',
  'Ilfov',
  'Maramureș',
  'Mehedinți',
  'Mureș',
  'Neamț',
  'Olt',
  'Prahova',
  'Satu Mare',
  'Sălaj',
  'Sibiu',
  'Suceava',
  'Teleorman',
  'Timiș',
  'Tulcea',
  'Vaslui',
  'Vâlcea',
  'Vrancea',
]);

const TIMISOARA: readonly string[] = [
  'Timiș', 'Arad', 'Caraș-Severin', 'Hunedoara', 'Bihor', 'Satu Mare',
  'Sălaj', 'Maramureș', 'Cluj', 'Alba', 'Mehedinți',
];

const IASI: readonly string[] = [
  'Iași', 'Suceava', 'Botoșani', 'Neamț', 'Bacău', 'Vaslui',
  'Harghita', 'Bistrița-Năsăud', 'Mureș',
];

const DRAGOMIRESTI: readonly string[] = [
  'București', 'Ilfov', 'Prahova', 'Dâmbovița', 'Argeș', 'Giurgiu',
  'Teleorman', 'Călărași', 'Ialomița', 'Constanța', 'Tulcea', 'Brăila',
  'Galați', 'Buzău', 'Vrancea', 'Brașov', 'Covasna', 'Sibiu',
  'Vâlcea', 'Olt', 'Dolj', 'Gorj',
];

function buildMap(): Readonly<Record<string, Hub>> {
  const map: Record<string, Hub> = {};
  for (const c of DRAGOMIRESTI) map[c] = 'Dragomirești-Deal';
  for (const c of TIMISOARA) map[c] = 'Timișoara';
  for (const c of IASI) map[c] = 'Iași';
  return Object.freeze(map);
}

/** Exactly the Glossary Hub_Map: 22 Dragomirești-Deal / 11 Timișoara / 9 Iași. */
export const HUB_MAP: Readonly<Record<string, Hub>> = buildMap();

/** Exact key match; returns null for empty, unknown or prototype-inherited keys. */
export function routeHub(county: string): Hub | null {
  if (typeof county !== 'string' || county === '') return null;
  return Object.prototype.hasOwnProperty.call(HUB_MAP, county) ? HUB_MAP[county] : null;
}
