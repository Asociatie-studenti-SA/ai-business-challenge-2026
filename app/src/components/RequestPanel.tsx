import { Download, Send } from 'lucide-react';
import { LABELS, MESSAGES } from '../logic/constants';
import type { QualifiedRequest } from '../logic/types';

export interface RequestPanelProps {
  /** Req 8.1/8.2: true only after an error-free evaluation with no form change since. */
  enabled: boolean;
  onRequest: () => void;
  /** Most recently saved request (Req 8.6); null until one is saved. */
  card: QualifiedRequest | null;
  /** Status message, e.g. MESSAGES.duplicate or MESSAGES.emailDemo. */
  message: string | null;
  /** Req 8.11: true when the .json download could not start. */
  exportFailed: boolean;
  onExport: () => void;
  /** Number of requests currently stored in localStorage. */
  count: number;
}

const HINT_ID = 'request-hint';

export function RequestPanel({
  enabled,
  onRequest,
  card,
  message,
  exportFailed,
  onExport,
  count,
}: RequestPanelProps) {
  const rows: Array<[string, string]> = card
    ? [
        ['Firmă', card.company],
        ['Contact', card.contactName],
        ['Hub', card.hub],
        ['Verdict', card.verdict],
      ]
    : [];

  return (
    <section
      aria-labelledby="request-heading"
      className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6"
    >
      <h2 id="request-heading" className="text-lg font-semibold text-slate-900">
        Cerere către Tech-Con
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        Cererea se salvează doar în acest browser și poate fi descărcată ca fișier .json.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={onRequest}
          disabled={!enabled}
          aria-describedby={enabled ? undefined : HINT_ID}
          className={
            'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ' +
            (enabled
              ? 'bg-teal-700 text-white hover:bg-teal-800'
              : 'cursor-not-allowed bg-slate-200 text-slate-600')
          }
        >
          <Send size={18} aria-hidden="true" />
          {LABELS.request}
        </button>
        {!enabled ? (
          <p id={HINT_ID} className="text-sm text-slate-700">
            {MESSAGES.requestHint}
          </p>
        ) : null}
      </div>

      <div aria-live="polite" className="mt-3 min-w-0">
        {message ? (
          <p className="break-words rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
      </div>

      {card ? (
        <div className="mt-4 min-w-0 rounded-lg border border-slate-200 bg-white p-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-medium text-slate-600">{label}</dt>
                <dd className="min-w-0 break-words text-slate-900">{value}</dd>
              </div>
            ))}
            <dt className="font-medium text-slate-600">Creată la</dt>
            <dd className="min-w-0 break-all text-slate-900">
              <time dateTime={card.createdAt}>{card.createdAt}</time>
            </dd>
          </dl>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={onExport}
          disabled={card === null}
          className={
            'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ' +
            (card === null
              ? 'cursor-not-allowed bg-slate-100 text-slate-600'
              : 'text-slate-900 hover:bg-slate-100')
          }
        >
          <Download size={18} aria-hidden="true" />
          {LABELS.export}
        </button>
        {exportFailed ? (
          <p role="status" className="text-sm text-amber-900">
            {MESSAGES.downloadFailed}
          </p>
        ) : null}
      </div>

      <p data-testid="saved-count" className="mt-4 text-sm text-slate-700">
        {MESSAGES.savedCount(count)}
      </p>
    </section>
  );
}
