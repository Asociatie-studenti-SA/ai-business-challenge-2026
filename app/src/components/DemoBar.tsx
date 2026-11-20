import { AlertTriangle, PlayCircle } from 'lucide-react';
import { LABELS } from '../logic/constants';

export interface DemoBarProps {
  onDemoNormal: () => void;
  onDemoErrors: () => void;
}

const buttonBase =
  'inline-flex min-h-11 min-w-0 flex-auto items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700';

/** 1-click demo fixtures, rendered before the form (Req 1.1–1.3). */
export function DemoBar({ onDemoNormal, onDemoErrors }: DemoBarProps) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-medium text-slate-700">Testare rapidă:</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDemoNormal}
          className={`${buttonBase} border-teal-700 bg-teal-50 text-teal-900 hover:bg-teal-100`}
        >
          <PlayCircle size={18} className="shrink-0" aria-hidden="true" />
          <span>{LABELS.demoNormal}</span>
        </button>
        <button
          type="button"
          onClick={onDemoErrors}
          className={`${buttonBase} border-slate-300 bg-white text-slate-900 hover:bg-slate-50`}
        >
          <AlertTriangle size={18} className="shrink-0 text-amber-600" aria-hidden="true" />
          <span>{LABELS.demoErrors}</span>
        </button>
      </div>
    </div>
  );
}
