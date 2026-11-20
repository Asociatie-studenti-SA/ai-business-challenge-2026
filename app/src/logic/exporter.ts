// Request_Exporter (Req 8.9, 14.10): serialize a QualifiedRequest and download it as UTF-8 JSON.
// Safe to import in Node: browser globals are touched only inside downloadRequest.

import type { QualifiedRequest } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export function serializeRequest(r: QualifiedRequest): string {
  return JSON.stringify(r, null, 2);
}

export function parseRequest(json: string): QualifiedRequest {
  return JSON.parse(json) as QualifiedRequest;
}

/** `cerere-paletcheck-<YYYY-MM-DD>.json`, date taken from createdAt (fallback: today's UTC date). */
export function exportFileName(r: QualifiedRequest): string {
  const created = typeof r.createdAt === 'string' ? r.createdAt : '';
  const date = ISO_DATE.test(created)
    ? created.slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return `cerere-paletcheck-${date}.json`;
}

/** Triggers a browser download. Returns true on success, false on any failure (never throws). */
export function downloadRequest(r: QualifiedRequest): boolean {
  let url: string | null = null;
  let anchor: HTMLAnchorElement | null = null;
  try {
    const blob = new Blob([serializeRequest(r)], { type: 'application/json;charset=utf-8' });
    url = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFileName(r);
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    try {
      anchor?.remove();
    } catch {
      /* ignore */
    }
    if (url !== null) {
      const toRevoke = url;
      setTimeout(() => {
        try {
          URL.revokeObjectURL(toRevoke);
        } catch {
          /* ignore */
        }
      }, 0);
    }
  }
}
