import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GuideChatbot } from '../../components/GuideChatbot';
import {
  answerUserMessage,
  computeProgress,
  explainCurrentErrorsReply,
  explainCurrentResultReply,
  getContextualNextStepReply,
  getQuickTopics,
  getTourStepReply,
  getWelcomeReply,
  normalizeText,
  type AppSnapshot,
} from '../chatbotEngine';
import { BUSINESS, DEMO_ERRORS, DEMO_NORMAL, LABELS, SEGMENTS } from '../constants';
import { evaluate } from '../engine';
import { formatInt } from '../numbers';
import type { FormValues } from '../types';
import { validate } from '../validator';

const EMPTY_VALUES: FormValues = {
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
};

function makeSnapshot(overrides: Partial<AppSnapshot> = {}): AppSnapshot {
  return {
    values: { ...EMPTY_VALUES },
    errors: {},
    result: null,
    requestEnabled: false,
    hasSavedRequest: false,
    savedCount: 0,
    formIsDirtySinceEval: false,
    ...overrides,
  };
}

describe('chatbotEngine', () => {
  it('normalizes Romanian diacritics and punctuation cleanly', () => {
    expect(normalizeText('Găleți, șîț — 20 kg?!')).toBe('galeti sit 20 kg');
    expect(normalizeText('what_next')).toBe('what_next');
  });

  it('tracks live 3-step app progress accurately', () => {
    const empty = computeProgress(makeSnapshot());
    expect(empty.completedCount).toBe(0);

    const filled = computeProgress(makeSnapshot({ values: { ...DEMO_NORMAL } }));
    expect(filled.completedCount).toBe(1);

    const evalRes = evaluate({ ...DEMO_NORMAL });
    const evaluated = computeProgress(
      makeSnapshot({
        values: { ...DEMO_NORMAL },
        result: evalRes,
        requestEnabled: true,
      }),
    );
    expect(evaluated.completedCount).toBe(2);

    const saved = computeProgress(
      makeSnapshot({
        values: { ...DEMO_NORMAL },
        result: evalRes,
        requestEnabled: true,
        hasSavedRequest: true,
        savedCount: 1,
      }),
    );
    expect(saved.completedCount).toBe(3);
  });

  it('produces welcome reply and all 5 guided tour steps with interactive actions', () => {
    const snap = makeSnapshot();
    const welcome = getWelcomeReply(snap);
    expect(welcome.steps?.length).toBe(3);
    expect(welcome.actions?.some((a) => a.kind === 'start_tour')).toBe(true);

    for (let step = 1; step <= 5; step++) {
      const reply = getTourStepReply(step, snap);
      expect(reply.title).toContain(`Pasul ${step} din 5`);
      expect(reply.paragraphs.length).toBeGreaterThan(0);
      expect(reply.actions && reply.actions.length).toBeGreaterThan(0);
    }
  });

  it('guides the user contextually depending on current app state', () => {
    const emptyNext = getContextualNextStepReply(makeSnapshot());
    expect(emptyNext.actions?.some((a) => a.kind === 'run_demo_normal')).toBe(true);

    const filledNext = getContextualNextStepReply(makeSnapshot({ values: { ...DEMO_NORMAL } }));
    expect(filledNext.actions?.some((a) => a.kind === 'run_evaluate')).toBe(true);

    const evalRes = evaluate({ ...DEMO_NORMAL });
    const readyNext = getContextualNextStepReply(
      makeSnapshot({
        values: { ...DEMO_NORMAL },
        result: evalRes,
        requestEnabled: true,
      }),
    );
    expect(readyNext.actions?.some((a) => a.kind === 'run_save_request')).toBe(true);

    const dirtyNext = getContextualNextStepReply(
      makeSnapshot({
        values: { ...DEMO_NORMAL },
        result: evalRes,
        formIsDirtySinceEval: true,
      }),
    );
    expect(dirtyNext.paragraphs[0]).toContain('schimbat ceva');
  });

  it('explains live form errors and live evaluation results in simple language', () => {
    const errSnap = makeSnapshot({
      values: { ...DEMO_ERRORS },
      errors: validate({ ...DEMO_ERRORS }).errors,
    });
    const errReply = explainCurrentErrorsReply(errSnap);
    expect(errReply.steps && errReply.steps.length).toBeGreaterThan(0);
    expect(errReply.steps?.some((s) => s.text.includes('20 kg'))).toBe(true);

    const okRes = evaluate({ ...DEMO_NORMAL });
    const okReply = explainCurrentResultReply(
      makeSnapshot({
        values: { ...DEMO_NORMAL },
        result: okRes,
        requestEnabled: true,
      }),
    );
    expect(okReply.title).toContain('Totul se potrivește');
    expect(okReply.steps?.length).toBe(4);

    const extraRes = evaluate({ ...DEMO_NORMAL, bucketKg: '15' });
    const extraReply = explainCurrentResultReply(
      makeSnapshot({
        values: { ...DEMO_NORMAL, bucketKg: '15' },
        result: extraRes,
        requestEnabled: true,
      }),
    );
    expect(extraReply.paragraphs[0]).toContain('Validare suplimentară');
  });

  it('routes natural Romanian questions accurately without intent collisions', () => {
    const snap = makeSnapshot();

    expect(answerUserMessage('nu inteleg cum se foloseste', snap).title).toContain('Pasul 1 din 5');
    expect(answerUserMessage('ce este gripper-ul?', snap).title).toContain('gripper');
    expect(answerUserMessage('de ce trebuie email cu .example?', snap).title).toContain('.example');
    expect(answerUserMessage('ce face rosu la sick?', snap).title).toContain('3D');
    expect(answerUserMessage('de ce e butonul de cerere blocat sau gri?', snap).title).toContain(
      '.json',
    );
    expect(answerUserMessage('ce inseamna ritm galeti pe minut?', snap).title).toContain('Ritm');
    expect(answerUserMessage('de ce trebuie bifa manuala de paleti?', snap).title).toContain(
      'paleți',
    );
    expect(answerUserMessage('unde e sediul pentru judetul Iasi?', snap).title).toContain('Tech-Con');
    expect(answerUserMessage('face si infoliere sau MiR?', snap).title).toContain('NU face');

    const priceReply = answerUserMessage('cat costa o celula in euro?', snap);
    expect(priceReply.paragraphs[0]).toContain(formatInt(BUSINESS.pricePerCellEur));

    // Quick topic IDs work directly
    expect(answerUserMessage('what_next', snap).title).toBeTruthy();
    expect(answerUserMessage('visualizer_3d', snap).title).toContain('3D');
    expect(answerUserMessage('save_request', snap).title).toContain('.json');

    // Unknown question gets helpful guided fallback (never dead-end)
    const fallback = answerUserMessage('xyzqwerty123', snap);
    expect(fallback.actions?.some((a) => a.kind === 'start_tour')).toBe(true);
  });

  it('adapts quick topics to error and evaluated states', () => {
    const errTopics = getQuickTopics(
      makeSnapshot({ errors: { company: 'Câmp obligatoriu.' } }),
    );
    expect(errTopics.some((t) => t.id === 'explain_errors')).toBe(true);

    const okTopics = getQuickTopics(
      makeSnapshot({ result: evaluate({ ...DEMO_NORMAL }) }),
    );
    expect(okTopics.some((t) => t.id === 'explain_current')).toBe(true);
  });

  it('renders GuideChatbot launcher cleanly in SSR', () => {
    const html = renderToStaticMarkup(
      createElement(GuideChatbot, {
        snapshot: makeSnapshot(),
        onDemoNormal: () => {},
        onDemoErrors: () => {},
        onEvaluate: () => evaluate({ ...DEMO_NORMAL }),
        onSaveRequest: () => false,
        onSpotlight: () => {},
      }),
    );
    expect(html).toContain('Ghid pas cu pas');
    expect(html).toContain('Nou aici? Te învăț în 1 minut!');
    expect(LABELS.evaluate).toBe('Evaluează compatibilitatea UR20');
  });
});
