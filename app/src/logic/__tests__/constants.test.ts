// Guard: business strip constants must equal brief/NUMBERS.json (read-only).
// Validates: Requirements 9.4, 9.5, 9.6

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUSINESS } from '../constants';

const NUMBERS_PATH = fileURLToPath(new URL('../../../../brief/NUMBERS.json', import.meta.url));

function loadNumbers(): unknown {
  return JSON.parse(readFileSync(NUMBERS_PATH, 'utf8'));
}

/** Resolve a dotted path; returns undefined if any segment is missing. */
function pick(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, key) =>
      acc !== null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
    obj,
  );
}

const MAPPING: ReadonlyArray<readonly [keyof typeof BUSINESS, string]> = [
  ['pricePerCellEur', 'pricing.unit_price'],
  ['contributionPerCellEur', 'unit_economics.contribution_per_cell'],
  ['promoBudgetEur', 'unit_economics.annual_promo_budget_cap'],
  ['cellsPerYear', 'funnel_year_1.cells_sold_and_delivered'],
];

describe('BUSINESS constants vs brief/NUMBERS.json', () => {
  it('resolves brief/NUMBERS.json', () => {
    expect(existsSync(NUMBERS_PATH), `missing file: ${NUMBERS_PATH}`).toBe(true);
  });

  it('every business strip figure matches NUMBERS.json', () => {
    const json = loadNumbers();
    const mismatches = MAPPING.flatMap(([name, path]) => {
      const app = BUSINESS[name];
      const value = pick(json, path);
      if (value === undefined) return [`${name}: app=${app} json=<missing ${path}>`];
      return value === app ? [] : [`${name}: app=${app} json=${String(value)}`];
    });
    expect(mismatches).toEqual([]);
  });

  it('price − contribution equals direct_cost_per_cell and 110000', () => {
    const direct = pick(loadNumbers(), 'unit_economics.direct_cost_per_cell');
    const diff = BUSINESS.pricePerCellEur - BUSINESS.contributionPerCellEur;
    expect(direct, 'json missing unit_economics.direct_cost_per_cell').not.toBeUndefined();
    expect(diff).toBe(direct);
    expect(diff).toBe(110_000);
  });
});
