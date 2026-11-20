import { AlertOctagon, AlertTriangle, CheckCircle2, Gauge, Info, Layers, MapPin, Weight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { MESSAGES } from '../logic/constants';
import type { EvaluationResult, Verdict } from '../logic/types';

export interface ResultPanelProps {
  result: EvaluationResult | null;
}

const VERDICT_STYLE: Record<Verdict, { box: string; icon: LucideIcon }> = {
  'Compatibil pentru evaluare tehnică': {
    box: 'border-teal-700 bg-teal-50 text-teal-900',
    icon: CheckCircle2,
  },
  'Validare suplimentară': {
    box: 'border-amber-600 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
  },
  'Eroare date': {
    box: 'border-amber-600 bg-white text-slate-900',
    icon: AlertOctagon,
  },
};

export function ResultPanel({ result }: ResultPanelProps) {
  if (result === null) return null;

  const style = VERDICT_STYLE[result.verdict];
  const VerdictIcon = style.icon;
  const iconColor = result.verdict === 'Compatibil pentru evaluare tehnică' ? 'text-teal-700' : 'text-amber-600';
  const isError = result.verdict === 'Eroare date';

  return (
    <section aria-live="polite" aria-labelledby="result-verdict" className="min-w-0 space-y-4">
      <div className={`rounded-lg border-l-4 p-4 ${style.box}`}>
        <div className="flex items-start gap-2">
          <VerdictIcon size={20} className={`mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
          <h2 id="result-verdict" className="min-w-0 break-words text-lg font-semibold">
            {result.verdict}
          </h2>
        </div>
        <p className="mt-2 break-words text-sm text-slate-700">{MESSAGES.scopeDisclaimer}</p>
      </div>

      {isError ? (
        <p className="break-words text-sm text-slate-700">{MESSAGES.fixFields}</p>
      ) : (
        <>
          {result.kpi ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <KpiCard icon={Weight} title="Sarcină utilă (găleată + gripper)" value={result.kpi.payload} />
              <KpiCard icon={Gauge} title="Ritm vs reper FAT" value={result.kpi.rate}>
                <p>{MESSAGES.fatDisclaimer}</p>
              </KpiCard>
              <KpiCard icon={Layers} title="Interval schimb palet" value={result.kpi.pallet}>
                <p>{MESSAGES.palletThresholdLabel}</p>
              </KpiCard>
              <KpiCard icon={MapPin} title="Hub Tech-Con" value={result.kpi.hub}>
                <p>{MESSAGES.hubLabel}</p>
                <p>{MESSAGES.deliveryNote}</p>
              </KpiCard>
            </div>
          ) : null}

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">De ce acest rezultat</h3>
            {result.reasons.length === 0 && result.notes.length === 0 ? (
              <p className="mt-2 flex items-start gap-2 break-words text-sm text-slate-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
                <span className="min-w-0">{MESSAGES.allPassed}</span>
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {result.reasons.map((reason) => (
                  <li key={`r-${reason}`} className="flex items-start gap-2 break-words text-sm text-slate-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                    <span className="min-w-0">{reason}</span>
                  </li>
                ))}
                {result.notes.map((note) => (
                  <li key={`n-${note}`} className="flex items-start gap-2 break-words text-sm text-slate-600">
                    <Info size={18} className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
                    <span className="min-w-0">{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {result.summary ? (
            <p
              data-testid="summary"
              className="break-words rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-900"
            >
              {result.summary}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
