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
import { GuideChatbot } from './components/GuideChatbot';
import type { AppSection, AppSnapshot } from './logic/chatbotEngine';
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
  const [spotlight, setSpotlight] = useState<AppSection | null>(null);

  const demoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<HTMLDivElement>(null);
  const spotlightTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (spotlightTimerRef.current !== null) {
        window.clearTimeout(spotlightTimerRef.current);
      }
    };
  }, []);

  const currentSerialized = JSON.stringify(values);
  const formIsDirtySinceEval = evaluatedSnapshot !== null && evaluatedSnapshot !== currentSerialized;
  const requestEnabled =
    result !== null && result.verdict !== 'Eroare date' && !formIsDirtySinceEval;

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

  const onEvaluate = (): EvaluationResult => {
    const r = evaluate(values);
    setErrors(r.errors);
    setResult(r);
    setEvaluatedSnapshot(JSON.stringify(values));
    setRequestMsg(null);
    setEvalTick((t) => t + 1);
    return r;
  };

  const onRequest = (): boolean => {
    if (!requestEnabled || result === null) return false;
    if (!isSyntheticEmail(values.email)) {
      setErrors((prev) => ({ ...prev, email: MESSAGES.emailDemo }));
      setRequestMsg(MESSAGES.emailDemo);
      return false;
    }
    const res = store.save(buildRequest(values, result, new Date().toISOString()));
    setRequestCard(res.record);
    setRequestMsg(res.status === 'duplicate' ? MESSAGES.duplicate : null);
    setCount(store.count());
    setExportFailed(false);
    return true;
  };

  const onExport = () => {
    if (requestCard) setExportFailed(!downloadRequest(requestCard));
  };

  const onSpotlight = (section: AppSection) => {
    const map: Record<AppSection, HTMLDivElement | null> = {
      demo: demoRef.current,
      form: formRef.current,
      result: resultRef.current,
      visualizer: visualizerRef.current,
      request: requestRef.current,
    };
    const el = map[section];
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }
    setSpotlight(section);
    if (spotlightTimerRef.current !== null) {
      window.clearTimeout(spotlightTimerRef.current);
    }
    spotlightTimerRef.current = window.setTimeout(() => {
      setSpotlight(null);
      spotlightTimerRef.current = null;
    }, 4500);
  };

  const spotlightClass = (section: AppSection) =>
    spotlight === section
      ? 'relative rounded-xl ring-4 ring-teal-600/40 ring-offset-2 ring-offset-slate-50 transition-shadow'
      : 'relative';

  const spotlightBadge = (section: AppSection) =>
    spotlight === section ? (
      <span
        aria-live="polite"
        className="pointer-events-none absolute -top-3 right-3 z-10 rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
      >
        Uite aici!
      </span>
    ) : null;

  const chatSnapshot: AppSnapshot = {
    values,
    errors,
    result,
    requestEnabled,
    hasSavedRequest: requestCard !== null,
    savedCount: count,
    formIsDirtySinceEval,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <Header />
      <main className="space-y-6 pb-2">
        <Hero />
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <div ref={demoRef} className={`${spotlightClass('demo')} scroll-mt-6 p-1`}>
            {spotlightBadge('demo')}
            <DemoBar onDemoNormal={onDemoNormal} onDemoErrors={onDemoErrors} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div
              ref={formRef}
              className={`${spotlightClass('form')} min-w-0 scroll-mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6`}
            >
              {spotlightBadge('form')}
              <LineForm values={values} errors={errors} onChange={onChange} onSubmit={onEvaluate} />
            </div>
            <div ref={resultRef} className={`${spotlightClass('result')} min-w-0 scroll-mt-6`}>
              {spotlightBadge('result')}
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

          <div ref={visualizerRef} className={`${spotlightClass('visualizer')} scroll-mt-6`}>
            {spotlightBadge('visualizer')}
            <CellVisualizerSection
              bucketKgRaw={values.bucketKg}
              ratePerMinRaw={values.ratePerMin}
              demoResetTick={demoResetTick}
            />
          </div>

          <div ref={requestRef} className={`${spotlightClass('request')} scroll-mt-6`}>
            {spotlightBadge('request')}
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
        </div>
        <BusinessStrip />
      </main>
      <Footer />
      <GuideChatbot
        snapshot={chatSnapshot}
        onDemoNormal={onDemoNormal}
        onDemoErrors={onDemoErrors}
        onEvaluate={onEvaluate}
        onSaveRequest={onRequest}
        onSpotlight={onSpotlight}
      />
    </div>
  );
}
