// Request store for PaletCheck UR20 (see design.md, `requestStore.ts`).
// Wraps an injectable StorageLike; the in-memory list is authoritative for the
// session, so blocked or failing localStorage never breaks the flow (Req 8.10).

import type { QualifiedRequest } from './types';

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export interface RequestStore {
  list(): readonly QualifiedRequest[];
  count(): number;
  save(r: QualifiedRequest): { status: 'saved' | 'duplicate'; record: QualifiedRequest };
}

export const STORAGE_KEY = 'paletcheck.requests.v1';

/** Same company (case/whitespace-insensitive) + same email (case-insensitive) + same county. */
export function dedupKey(r: Pick<QualifiedRequest, 'company' | 'email' | 'county'>): string {
  const company = r.company.trim().toLowerCase().replace(/\s+/g, ' ');
  const email = r.email.trim().toLowerCase();
  return `${company}|${email}|${r.county}`;
}

function isStoredRequest(x: unknown): x is QualifiedRequest {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.company === 'string' &&
    typeof o.email === 'string' &&
    typeof o.county === 'string' &&
    typeof o.createdAt === 'string'
  );
}

/**
 * Reads the persisted list. Policy: all-or-nothing. If the value is missing,
 * unreadable, not JSON, not an array, or ANY item fails the shape check, the
 * whole list is dropped and the store starts empty (design.md: "anything else
 * gives []"; Property 17).
 */
function load(storage: StorageLike | null): QualifiedRequest[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isStoredRequest)) return [];
    return parsed as QualifiedRequest[];
  } catch {
    return [];
  }
}

function copy(r: QualifiedRequest): QualifiedRequest {
  // `line` is not part of the load-time shape check, so guard before spreading.
  return r.line && typeof r.line === 'object' ? { ...r, line: { ...r.line } } : { ...r };
}

export function createRequestStore(storage: StorageLike | null): RequestStore {
  const items: QualifiedRequest[] = load(storage);

  return {
    list(): readonly QualifiedRequest[] {
      return items.map(copy);
    },
    count(): number {
      return items.length;
    },
    save(r) {
      const key = dedupKey(r);
      const existing = items.find((it) => dedupKey(it) === key);
      if (existing) return { status: 'duplicate', record: copy(existing) };

      items.push(copy(r));
      if (storage) {
        try {
          storage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
          // Quota / blocked storage: memory stays authoritative for the session.
        }
      }
      return { status: 'saved', record: copy(r) };
    },
  };
}

/** window.localStorage, or null when there is no window (Node) or access throws. */
export function safeLocalStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
