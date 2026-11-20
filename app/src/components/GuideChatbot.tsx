import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  Eye,
  Lightbulb,
  PlayCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  answerUserMessage,
  computeProgress,
  explainCurrentErrorsReply,
  explainCurrentResultReply,
  getQuickTopics,
  getTourStepReply,
  getWelcomeReply,
  type AppSection,
  type AppSnapshot,
  type BotReply,
  type ChatAction,
} from '../logic/chatbotEngine';
import { DEMO_ERRORS, LABELS } from '../logic/constants';
import { validate } from '../logic/validator';
import type { EvaluationResult } from '../logic/types';

export interface GuideChatbotProps {
  snapshot: AppSnapshot;
  onDemoNormal: () => void;
  onDemoErrors: () => void;
  onEvaluate: () => EvaluationResult;
  onSaveRequest: () => boolean;
  onSpotlight: (section: AppSection) => void;
}

interface ChatMessage {
  id: number;
  sender: 'bot' | 'user';
  text?: string;
  reply?: BotReply;
}

const SECTION_LABELS: Record<AppSection, string> = {
  demo: 'Testare rapidă (Demo)',
  form: 'Formularul cu date',
  result: 'Panoul cu rezultatul',
  visualizer: 'Desenul 3D al robotului',
  request: 'Panoul de Cerere (.json)',
};

function isNarrowViewport(): boolean {
  try {
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

export function GuideChatbot({
  snapshot,
  onDemoNormal,
  onDemoErrors,
  onEvaluate,
  onSaveRequest,
  onSpotlight,
}: GuideChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [peekLabel, setPeekLabel] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(true);
  const [input, setInput] = useState('');
  const nextIdRef = useRef(2);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 1, sender: 'bot', reply: getWelcomeReply(snapshot) },
  ]);

  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = useMemo(() => computeProgress(snapshot), [snapshot]);
  const quickTopics = useMemo(() => getQuickTopics(snapshot), [snapshot]);
  const errorCount = Object.keys(snapshot.errors).length;

  useEffect(() => {
    if (!isOpen || peekLabel !== null) return;
    listEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [messages, isOpen, peekLabel]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setPeekLabel(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const appendExchange = (userText: string | null, reply: BotReply) => {
    setMessages((prev) => {
      const next = [...prev];
      if (userText) {
        next.push({ id: nextIdRef.current++, sender: 'user', text: userText });
      }
      next.push({ id: nextIdRef.current++, sender: 'bot', reply });
      return next.slice(-24);
    });
  };

  const openGuide = () => {
    setIsOpen(true);
    setPeekLabel(null);
    setShowNudge(false);
  };

  const handleReset = () => {
    setMessages([{ id: nextIdRef.current++, sender: 'bot', reply: getWelcomeReply(snapshot) }]);
    setInput('');
  };

  const triggerSpotlight = (section: AppSection) => {
    onSpotlight(section);
    if (isNarrowViewport()) {
      setPeekLabel(SECTION_LABELS[section]);
    }
  };

  const handleAction = (action: ChatAction) => {
    if (action.kind === 'start_tour') {
      appendExchange(action.label, getTourStepReply(1, snapshot));
      return;
    }

    if (action.kind === 'tour_step') {
      const step = action.step ?? 1;
      appendExchange(action.label, getTourStepReply(step, snapshot));
      return;
    }

    if (action.kind === 'spotlight' && action.section) {
      triggerSpotlight(action.section);
      appendExchange(action.label, {
        title: `Uite aici: ${SECTION_LABELS[action.section]}!`,
        paragraphs: [
          'Am derulat pagina și am aprins un chenar verde în jurul zonei. Aruncă o privire acolo, apoi poți reveni oricând aici!',
        ],
        actions: [{ label: 'Ce să fac mai departe?', kind: 'ask_topic', topic: 'what_next', primary: true }],
      });
      return;
    }

    if (action.kind === 'run_demo_normal') {
      onDemoNormal();
      triggerSpotlight('form');
      appendExchange(action.label, {
        title: 'Gata! Am umplut toate căsuțele cu exemplul bun!',
        paragraphs: [
          'Am pus o fabrică inventată de lactate (SC LactoSud Demo SRL), cu găleți de 13 kg + gripper 3 kg = 16 kg și 6,5 găleți pe minut.',
          `Acum pasul următor este super simplu: apasă butonul mare verde «${LABELS.evaluate}» (sau apasă mai jos și îl apăs eu pentru tine!).`,
        ],
        actions: [
          { label: 'Apasă Evaluarea chiar acum', kind: 'run_evaluate', primary: true },
          { label: 'Continuă turul (Pasul 3)', kind: 'tour_step', step: 3 },
        ],
      });
      return;
    }

    if (action.kind === 'run_demo_errors') {
      onDemoErrors();
      triggerSpotlight('form');
      const errorSnapshot: AppSnapshot = {
        ...snapshot,
        values: { ...DEMO_ERRORS },
        errors: validate({ ...DEMO_ERRORS }).errors,
        result: null,
        requestEnabled: false,
        formIsDirtySinceEval: false,
      };
      appendExchange(action.label, explainCurrentErrorsReply(errorSnapshot));
      return;
    }

    if (action.kind === 'run_evaluate') {
      const evalResult = onEvaluate();
      const freshSnapshot: AppSnapshot = {
        ...snapshot,
        errors: evalResult.errors,
        result: evalResult,
        requestEnabled: evalResult.verdict !== 'Eroare date',
        formIsDirtySinceEval: false,
      };
      triggerSpotlight(evalResult.verdict === 'Eroare date' ? 'form' : 'result');
      appendExchange(action.label, explainCurrentResultReply(freshSnapshot));
      return;
    }

    if (action.kind === 'run_save_request') {
      const saved = onSaveRequest();
      triggerSpotlight('request');
      if (saved) {
        appendExchange(action.label, {
          title: 'Bravo! Cererea ta a fost salvată!',
          paragraphs: [
            'Cererea a fost salvată aici în browserul tău și a apărut fișa cu rezumatul.',
            `Acum poți apăsa butonul «${LABELS.export}» din panoul evidențiat ca să o descarci ca fișier!`,
          ],
          actions: [
            { label: 'Arată-mi robotul în 3D', kind: 'spotlight', section: 'visualizer', primary: true },
            { label: 'Încearcă exemplul cu erori', kind: 'run_demo_errors' },
          ],
        });
      } else {
        appendExchange(action.label, {
          title: 'Încă un mic pas înainte de salvare!',
          paragraphs: [
            'Ca să salvăm cererea, avem nevoie de o evaluare fără erori și de un email de probă care se termină cu «.example».',
            'Dacă vrei, încarc eu datele bune de probă și facem evaluarea împreună!',
          ],
          actions: [
            { label: 'Pune exemplul bun (Demo)', kind: 'run_demo_normal', primary: true },
            { label: 'Arată-mi formularul', kind: 'spotlight', section: 'form' },
          ],
        });
      }
      return;
    }

    if (action.kind === 'ask_topic' && action.topic) {
      const reply = answerUserMessage(action.topic, snapshot);
      appendExchange(action.label, reply);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const reply = answerUserMessage(trimmed, snapshot);
    appendExchange(trimmed, reply);
    setInput('');
  };

  const handleQuickTopic = (topicId: string, label: string) => {
    const reply = answerUserMessage(topicId, snapshot);
    appendExchange(label, reply);
  };

  const handleStepPillClick = (stepId: 'data' | 'eval' | 'request', section: AppSection) => {
    triggerSpotlight(section);
    if (stepId === 'data') {
      appendExchange('Explică Pasul 1: Date', getTourStepReply(2, snapshot));
    } else if (stepId === 'eval') {
      appendExchange(
        'Explică Pasul 2: Evaluare',
        snapshot.result ? explainCurrentResultReply(snapshot) : getTourStepReply(3, snapshot),
      );
    } else {
      appendExchange('Explică Pasul 3: Cerere', getTourStepReply(5, snapshot));
    }
  };

  const actionIcon = (kind: ChatAction['kind']) => {
    if (kind === 'run_demo_normal' || kind === 'run_demo_errors' || kind === 'run_evaluate') {
      return <PlayCircle size={15} className="shrink-0" aria-hidden="true" />;
    }
    if (kind === 'spotlight') {
      return <Eye size={15} className="shrink-0" aria-hidden="true" />;
    }
    if (kind === 'run_save_request') {
      return <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />;
    }
    if (kind === 'start_tour' || kind === 'tour_step') {
      return <Compass size={15} className="shrink-0" aria-hidden="true" />;
    }
    return <ArrowRight size={15} className="shrink-0" aria-hidden="true" />;
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-end p-3 sm:p-4">
      {/* Compact mobile peek bar when user clicks "Arata-mi pe pagina" on narrow screens */}
      {isOpen && peekLabel !== null ? (
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2 rounded-xl border-2 border-teal-700 bg-white px-3.5 py-2.5 shadow-xl">
          <div className="flex min-w-0 items-center gap-2">
            <Eye size={18} className="shrink-0 text-teal-700" aria-hidden="true" />
            <p className="truncate text-sm font-medium text-slate-900">
              Uite aici: <span className="font-semibold text-teal-800">{peekLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeekLabel(null)}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
          >
            <Bot size={15} aria-hidden="true" />
            <span>Înapoi la Ghid</span>
          </button>
        </div>
      ) : null}

      {/* Full interactive chatbot dialog */}
      {isOpen && peekLabel === null ? (
        <section
          role="dialog"
          aria-label="Ghid interactiv PaletCheck UR20"
          className="pointer-events-auto flex h-[min(78vh,580px)] w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-teal-700 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Bot size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold leading-tight">Ghidul UR20</h2>
                <p className="truncate text-xs text-teal-100">Te învăț simplu, pas cu pas</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reîncepe conversația ghidului"
                title="Reîncepe ghidul"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-teal-100 hover:bg-white/15 hover:text-white"
              >
                <RotateCcw size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Închide ghidul"
                title="Închide"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-teal-100 hover:bg-white/15 hover:text-white"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Live 3-step visual progress tracker */}
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
            <div className="grid grid-cols-3 gap-1.5">
              {progress.steps.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStepPillClick(s.id, s.section)}
                  className={`inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                    s.done
                      ? 'border-teal-700 bg-teal-50 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2
                    size={13}
                    className={s.done ? 'shrink-0 text-teal-700' : 'shrink-0 text-slate-400'}
                    aria-hidden="true"
                  />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 truncate text-xs text-slate-600">{progress.summaryText}</p>
          </div>

          {/* Chat messages */}
          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-3 py-3"
          >
            {messages.map((msg) =>
              msg.sender === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] break-words rounded-2xl rounded-br-sm bg-teal-700 px-3.5 py-2 text-sm text-white shadow-xs">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-start">
                  <div className="w-full max-w-[95%] space-y-2.5 rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-3.5 text-sm text-slate-800 shadow-xs">
                    {msg.reply?.title ? (
                      <div className="flex items-start gap-2">
                        <Lightbulb
                          size={17}
                          className="mt-0.5 shrink-0 text-teal-700"
                          aria-hidden="true"
                        />
                        <p className="font-semibold leading-snug text-slate-900">
                          {msg.reply.title}
                        </p>
                      </div>
                    ) : null}

                    {msg.reply?.paragraphs.map((p, idx) => (
                      <p key={idx} className="break-words leading-relaxed text-slate-700">
                        {p}
                      </p>
                    ))}

                    {msg.reply?.steps && msg.reply.steps.length > 0 ? (
                      <ul className="space-y-1.5">
                        {msg.reply.steps.map((st, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-slate-800"
                          >
                            <span className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal-700 px-1 text-[11px] font-bold text-white">
                              {st.badge}
                            </span>
                            <span className="min-w-0 break-words">{st.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {msg.reply?.tip ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-900">
                        {msg.reply.tip}
                      </div>
                    ) : null}

                    {msg.reply?.actions && msg.reply.actions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.reply.actions.map((act, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAction(act)}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${
                              act.primary
                                ? 'border-teal-700 bg-teal-700 text-white hover:bg-teal-800'
                                : 'border-teal-700/40 bg-teal-50 text-teal-900 hover:bg-teal-100'
                            }`}
                          >
                            {actionIcon(act.kind)}
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            <div ref={listEndRef} />
          </div>

          {/* 1-tap quick topics */}
          <div className="border-t border-slate-200 bg-white px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              {quickTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleQuickTopic(topic.id, topic.label)}
                  className="inline-flex min-h-8 items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-teal-700 hover:bg-teal-50 hover:text-teal-900"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Free-text input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Întreabă simplu (ex: ce e gripper-ul?)"
              aria-label="Scrie o întrebare pentru ghidul UR20"
              className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={input.trim().length === 0}
              aria-label="Trimite întrebarea"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </section>
      ) : null}

      {/* Floating launcher when closed */}
      {!isOpen ? (
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {showNudge ? (
            <div className="flex items-center gap-2 rounded-xl border border-teal-700/30 bg-white px-3 py-2 text-xs text-slate-800 shadow-lg">
              <button
                type="button"
                onClick={openGuide}
                className="flex items-center gap-1.5 text-left font-medium text-slate-900 hover:text-teal-800"
              >
                <Sparkles size={14} className="shrink-0 text-teal-700" aria-hidden="true" />
                <span>Nou aici? Te învăț în 1 minut!</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNudge(false)}
                aria-label="Ascunde mesajul de bun venit"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={openGuide}
            aria-label="Deschide Ghidul interactiv pas cu pas"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-teal-800 bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-teal-800"
          >
            <Bot size={20} className="shrink-0" aria-hidden="true" />
            <span>Ghid pas cu pas</span>
            {errorCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-slate-950">
                {errorCount}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
