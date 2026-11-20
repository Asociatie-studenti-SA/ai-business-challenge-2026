// PaletCheck UR20 — top-level wiring (task 9.6, design.md "App handlers").
// All logic is client-side and deterministic; no network calls, no alert/confirm/prompt.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DemoBar } from './components/DemoBar';
import { LineForm } from './components/LineForm';
import { ResultPanel } from './components/ResultPanel';
import { RequestPanel } from './components/RequestPanel';
import { BusinessStrip } from './components/BusinessStrip';
import { CellVisualizerSection } from './components/CellVisualizerSection';
import { Footer } from './components/Footer';
import { DEMO_ERRORS, DEMO_NORMAL, MESSAGES, SEGMENTS } from './logic/constants';
import { buildRequest, defaultBucketsPerPallet, evaluate } from './logic/engine';
import { downloadRequest } from './logic/exporter';
import { parseMilli } from './logic/numbers';
import { createRequestStore, safeLocalStorage } from './logic/requestStore';
import type { EvaluationResult, FieldErrors, FormValues, QualifiedRequest } from './logic/types';
import { isSyntheticEmail, validate } from './logic/validator';

const EMPTY_FORM: Readonly<FormValues> = Object.freeze({
  company: '',
  contactName: '',
  email: '',
  county: '',
  segment: SEGMENTS[0],
  bucketKg: '',
  gripperKg: '',
  ratePerMin: '',
  shiftsPerDay: '',
  operatorsPerShift: '',
  bucketsPerPallet: '',
  manualConfirmed: false,
});

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export default function App() {
  const store = useMemo(() => createRequestStore(safeLocalStorage()), []);

  const [values, setValues] = useState<FormValues>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [palletTouched, setPalletTouched] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [evaluatedSnapshot, setEvaluatedSnapshot] = useState<string | null>(null);
  const [requestCard, setRequestCard] = useState<QualifiedRequest | null>(null);
  const [requestMsg, setRequestMsg] = useState<string | null>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const [count, setCount] = useState(() => store.count());
  const [evalTick, setEvalTick] = useState(0);
  const [demoResetTick, setDemoResetTick] = useState(0);

  const resultRef = useRef<HTMLDivElement>(null);

  // After each evaluation, bring the result into view if its top is off-screen (mobile stack).
  useEffect(() => {
    if (evalTick === 0) return;
    const el = resultRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }, [evalTick]);

  const requestEnabled =
    result !== null &&
    result.verdict !== 'Eroare date' &&
    evaluatedSnapshot === JSON.stringify(values);

  const resetWith = (next: FormValues, nextErrors: FieldErrors) => {
    setValues(next);
    setErrors(nextErrors);
    setPalletTouched(false);
    setResult(null);
    setEvaluatedSnapshot(null);
    setRequestCard(null);
    setRequestMsg(null);
    setExportFailed(false);
  };

  const onDemoNormal = () => {
    resetWith({ ...DEMO_NORMAL }, {});
    setDemoResetTick((t) => t + 1);
  };

  const onDemoErrors = () => {
    const next = { ...DEMO_ERRORS };
    resetWith(next, validate(next).errors);
  };

  const onChange = <K extends keyof FormValues>(name: K, value: FormValues[K]) => {
    setValues((prev) => {
      const next: FormValues = { ...prev, [name]: value };
      if (name === 'bucketKg' && !palletTouched && typeof value === 'string') {
        const milli = parseMilli(value);
        if (milli !== null) next.bucketsPerPallet = String(defaultBucketsPerPallet(milli));
      }
      return next;
    });
    if (name === 'bucketsPerPallet') setPalletTouched(true);
    setRequestMsg(null);
  };

  const onEvaluate = () => {
    const r = evaluate(values);
    setErrors(r.errors);
    setResult(r);
    setEvaluatedSnapshot(JSON.stringify(values));
    setRequestMsg(null);
    setEvalTick((t) => t + 1);
  };

  const onRequest = () => {
    if (!requestEnabled || result === null) return;
    if (!isSyntheticEmail(values.email)) {
      setErrors((prev) => ({ ...prev, email: MESSAGES.emailDemo }));
      setRequestMsg(MESSAGES.emailDemo);
      return;
    }
    const res = store.save(buildRequest(values, result, new Date().toISOString()));
    setRequestCard(res.record);
    setRequestMsg(res.status === 'duplicate' ? MESSAGES.duplicate : null);
    setCount(store.count());
    setExportFailed(false);
  };

  const onExport = () => {
    if (requestCard) setExportFailed(!downloadRequest(requestCard));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="space-y-6 pb-2">
        <Hero />
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <DemoBar onDemoNormal={onDemoNormal} onDemoErrors={onDemoErrors} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <LineForm values={values} errors={errors} onChange={onChange} onSubmit={onEvaluate} />
            </div>
            <div ref={resultRef} className="min-w-0 scroll-mt-4">
              {result === null ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:p-6">
                  Rezultatul apare aici după evaluare.
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
                  <ResultPanel result={result} />
                </div>
              )}
            </div>
          </div>

          <CellVisualizerSection
            bucketKgRaw={values.bucketKg}
            ratePerMinRaw={values.ratePerMin}
            demoResetTick={demoResetTick}
          />

          <RequestPanel
            enabled={requestEnabled}
            onRequest={onRequest}
            card={requestCard}
            message={requestMsg}
            exportFailed={exportFailed}
            onExport={onExport}
            count={count}
          />
        </div>
        <BusinessStrip />
      </main>
      <Footer />
    </div>
  );
}
