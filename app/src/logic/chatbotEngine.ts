// Deterministic, client-side interactive teaching chatbot engine for PaletCheck UR20.
// Explains every part of the app in ultra-simple, step-by-step Romanian.
// Pure module: no DOM access, no network calls, never mutates inputs.

import { BUSINESS, LABELS, MESSAGES } from './constants';
import { formatInt, formatScaled } from './numbers';
import type { EvaluationResult, FieldErrors, FieldName, FormValues } from './types';

export type AppSection = 'demo' | 'form' | 'result' | 'visualizer' | 'request';

export type ChatActionKind =
  | 'start_tour'
  | 'tour_step'
  | 'run_demo_normal'
  | 'run_demo_errors'
  | 'run_evaluate'
  | 'run_save_request'
  | 'spotlight'
  | 'ask_topic';

export interface ChatAction {
  label: string;
  kind: ChatActionKind;
  section?: AppSection;
  step?: number;
  topic?: string;
  primary?: boolean;
}

export interface ChatStepItem {
  badge: string;
  text: string;
}

export interface BotReply {
  title?: string;
  paragraphs: string[];
  steps?: ChatStepItem[];
  tip?: string;
  actions?: ChatAction[];
}

export interface AppSnapshot {
  values: FormValues;
  errors: FieldErrors;
  result: EvaluationResult | null;
  requestEnabled: boolean;
  hasSavedRequest: boolean;
  savedCount: number;
  formIsDirtySinceEval: boolean;
}

export interface ProgressStep {
  id: 'data' | 'eval' | 'request';
  label: string;
  done: boolean;
  section: AppSection;
}

export interface AppProgress {
  steps: readonly ProgressStep[];
  completedCount: number;
  summaryText: string;
}

export interface QuickTopic {
  id: string;
  label: string;
}

const TOTAL_TOUR_STEPS = 5;

/** Lowercase, strip Romanian diacritics and normalize whitespace for forgiving matching. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAnyInput(values: FormValues): boolean {
  return Boolean(
    values.company.trim() ||
      values.contactName.trim() ||
      values.email.trim() ||
      values.county.trim() ||
      values.bucketKg.trim() ||
      values.ratePerMin.trim(),
  );
}

/** Computes the simple 3-step live progress indicator shown inside the chatbot. */
export function computeProgress(snapshot: AppSnapshot): AppProgress {
  const hasData = hasAnyInput(snapshot.values);
  const evalOk =
    snapshot.result !== null &&
    snapshot.result.verdict !== 'Eroare date' &&
    !snapshot.formIsDirtySinceEval;
  const saved = snapshot.hasSavedRequest || snapshot.savedCount > 0;

  const steps: ProgressStep[] = [
    { id: 'data', label: '1. Date', done: hasData, section: 'form' },
    { id: 'eval', label: '2. Evaluare', done: evalOk, section: 'result' },
    { id: 'request', label: '3. Cerere', done: saved, section: 'request' },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  let summaryText = 'Pasul 1: Încarcă exemplul sau scrie datele.';
  if (hasData && !evalOk) {
    summaryText =
      Object.keys(snapshot.errors).length > 0
        ? 'Corectează căsuțele cu roșu, apoi apasă Evaluare.'
        : 'Pasul 2: Apasă butonul verde de Evaluare.';
  } else if (evalOk && !saved) {
    summaryText = 'Pasul 3: Vezi rezultatul 3D și salvează cererea.';
  } else if (saved) {
    summaryText = 'Bravo! Ai parcurs toți cei 3 pași principali.';
  }

  return { steps, completedCount, summaryText };
}

/** Initial friendly greeting when the user opens the chatbot. */
export function getWelcomeReply(snapshot: AppSnapshot): BotReply {
  const hasErrors = Object.keys(snapshot.errors).length > 0;
  const actions: ChatAction[] = [
    {
      label: 'Începe turul pas cu pas (1 min)',
      kind: 'start_tour',
      primary: true,
    },
    {
      label: 'Umple exemplul bun pentru mine',
      kind: 'run_demo_normal',
    },
    {
      label: hasErrors ? 'De ce am erori?' : 'Ce să fac chiar acum?',
      kind: 'ask_topic',
      topic: hasErrors ? 'explain_errors' : 'what_next',
    },
  ];

  return {
    title: 'Salut! Sunt Ghidul tău UR20',
    paragraphs: [
      'Te învăț cum să folosești aplicația foarte ușor, pas cu pas — fără termeni grei.',
      'Gândește-te la aplicație ca la un joc în 3 pași mici care verifică dacă un braț de robot poate ridica gălețile tale:',
    ],
    steps: [
      { badge: '1', text: 'Pui datele (sau apeși un singur buton de probă ca să se umple singure).' },
      { badge: '2', text: 'Apeși butonul verde mare și afli imediat dacă robotul se potrivește.' },
      { badge: '3', text: 'Vezi robotul cum lucrează în 3D și, dacă vrei, salvezi cererea.' },
    ],
    tip: 'Apasă orice buton de mai jos sau scrie-mi o întrebare simplă!',
    actions,
  };
}

/** 5-step interactive guided tour that teaches the entire app like talking to a young child. */
export function getTourStepReply(rawStep: number, snapshot: AppSnapshot): BotReply {
  const step = Math.max(1, Math.min(TOTAL_TOUR_STEPS, Math.round(rawStep)));

  if (step === 1) {
    return {
      title: `Pasul 1 din ${TOTAL_TOUR_STEPS}: Ce face aplicația asta?`,
      paragraphs: [
        'Imaginează-ți un braț de robot mare și puternic (UR20). Treaba lui este să ia găleți grele de pe bandă și să le așeze frumos pe un palet de lemn, ca pe niște cuburi LEGO.',
        'Aplicația asta verifică în 30 de secunde dacă robotul poate face treaba asta în fabrica ta fără să obosească sau să se blocheze.',
      ],
      tip: 'Nu trebuie să îți faci cont și nu trimite date reale nicăieri.',
      actions: [
        { label: 'Mergi la Pasul 2', kind: 'tour_step', step: 2, primary: true },
        { label: 'Încearcă direct cu un exemplu', kind: 'run_demo_normal' },
      ],
    };
  }

  if (step === 2) {
    return {
      title: `Pasul 2 din ${TOTAL_TOUR_STEPS}: Încearcă fără să scrii nimic!`,
      paragraphs: [
        `Sus pe pagină ai zona «Testare rapidă» cu două butoane. Dacă apeși «${LABELS.demoNormal}», toate căsuțele se umplu singure cu o fabrică inventată de lactate.`,
        'Așa vezi imediat ce trebuie scris în fiecare căsuță, fără să ghicești!',
      ],
      steps: [
        { badge: 'A', text: `«${LABELS.demoNormal}» = pune date corecte, gata de test.` },
        { badge: 'B', text: `«${LABELS.demoErrors}» = pune intenționat greșeli, ca să vezi cum te avertizează aplicația.` },
      ],
      actions: [
        { label: 'Apasă exemplul bun pentru mine', kind: 'run_demo_normal', primary: true },
        { label: 'Arată-mi unde sunt butoanele', kind: 'spotlight', section: 'demo' },
        { label: 'Mergi la Pasul 3', kind: 'tour_step', step: 3 },
      ],
    };
  }

  if (step === 3) {
    const readyToEval = hasAnyInput(snapshot.values);
    return {
      title: `Pasul 3 din ${TOTAL_TOUR_STEPS}: Apasă butonul verde mare!`,
      paragraphs: [
        `Sub căsuțe găsești butonul mare verde «${LABELS.evaluate}». Când îl apeși, aplicația face 4 verificări simple în locul tău:`,
      ],
      steps: [
        { badge: '1', text: 'Greutatea: găleata + mâna robotului (gripper) trebuie să fie cel mult 20 kg.' },
        { badge: '2', text: 'Viteza: câte găleți vin pe minut față de testul robotului.' },
        { badge: '3', text: 'Schimbul de palet: cât de des vine un om să schimbe paletul plin.' },
        { badge: '4', text: 'Sediul apropiat: alege singură cel mai aproape sediu Tech-Con după județ.' },
      ],
      actions: [
        ...(readyToEval
          ? [{ label: 'Apasă Evaluarea chiar acum', kind: 'run_evaluate' as const, primary: true }]
          : [{ label: 'Întâi umple exemplul bun', kind: 'run_demo_normal' as const, primary: true }]),
        { label: 'Arată-mi unde apare rezultatul', kind: 'spotlight', section: 'result' },
        { label: 'Mergi la Pasul 4', kind: 'tour_step', step: 4 },
      ],
    };
  }

  if (step === 4) {
    return {
      title: `Pasul 4 din ${TOTAL_TOUR_STEPS}: Joacă-te cu robotul 3D!`,
      paragraphs: [
        'Mai jos pe pagină ai o fereastră vie unde vezi brațul robotului cum mută gălețile pe 2 paleți! Poți apăsa butoanele de deasupra desenului ca să testezi:',
      ],
      steps: [
        { badge: '3D', text: 'Apasă «Vedere 3D izometrică / Vedere de sus (Plan 2D)» ca să schimbi unghiul camerei.' },
        { badge: 'M', text: 'Schimbă Lungimea și Lățimea camerei — dacă e prea strâmt, apare un mesaj roșu.' },
        { badge: 'S', text: 'Testează semaforul SICK: Verde = viteză normală, Galben = încet, Roșu = stop de siguranță!' },
      ],
      actions: [
        { label: 'Arată-mi robotul 3D acum', kind: 'spotlight', section: 'visualizer', primary: true },
        { label: 'Mergi la Pasul 5 (ultimul!)', kind: 'tour_step', step: 5 },
      ],
    };
  }

  return {
    title: `Pasul 5 din ${TOTAL_TOUR_STEPS}: Salvează și descarcă fișa!`,
    paragraphs: [
      `După ce ai un rezultat fără erori, jos pe pagină butonul «${LABELS.request}» se face verde.`,
      `Când îl apeși, aplicația salvează cererea aici în browser și îți deblochează butonul «${LABELS.export}» ca să o păstrezi ca fișier pe telefon sau calculator.`,
    ],
    tip: 'Gata! Acum știi să folosești toată aplicația cap-coadă. Mă poți întreba oricând despre orice căsuță!',
    actions: [
      ...(snapshot.requestEnabled
        ? [{ label: 'Salvează cererea acum', kind: 'run_save_request' as const, primary: true }]
        : [{ label: 'Arată-mi zona de Cerere', kind: 'spotlight' as const, section: 'request' as const, primary: true }]),
      { label: 'Explică rezultatul meu actual', kind: 'ask_topic', topic: 'explain_current' },
      { label: 'Reia turul de la Pasul 1', kind: 'tour_step', step: 1 },
    ],
  };
}

/** Plain, toddler-friendly translation of every form field error. */
const SIMPLE_FIELD_HELP: Record<FieldName, { name: string; howToFix: string }> = {
  company: {
    name: 'Firmă',
    howToFix: 'Scrie un nume inventat de fabrică, de exemplu: «SC LactoSud Demo SRL».',
  },
  contactName: {
    name: 'Persoană de contact',
    howToFix: 'Scrie un nume inventat de persoană, de exemplu: «Andrei Ionescu (Demo)».',
  },
  email: {
    name: 'Email (doar .example)',
    howToFix: 'Scrie un email de probă care se termină cu .example, de exemplu: «test@fabrica.example».',
  },
  county: {
    name: 'Județ',
    howToFix: 'Alege un județ din listă (de exemplu Ilfov, Cluj sau Iași).',
  },
  segment: {
    name: 'Segment',
    howToFix: 'Alege tipul de produse din fabrică (ex: Lactate sau Panificație).',
  },
  bucketKg: {
    name: 'Greutate găleată (kg)',
    howToFix: 'Pune cât cântărește o găleată (între 0,5 și 30 kg). Atenție: împreună cu gripper-ul nu are voie să treacă de 20 kg!',
  },
  gripperKg: {
    name: 'Greutate gripper (kg)',
    howToFix: 'Pune cât cântărește «mâna» robotului (de obicei 2 sau 3 kg). Împreună cu găleata trebuie să fie cel mult 20 kg.',
  },
  ratePerMin: {
    name: 'Ritm linie (găleți/min)',
    howToFix: 'Scrie câte găleți vin pe bandă într-un minut (de exemplu 6,5).',
  },
  shiftsPerDay: {
    name: 'Schimburi pe zi',
    howToFix: 'Scrie 1, 2 sau 3 (câte ture lucrează fabrica pe zi).',
  },
  operatorsPerShift: {
    name: 'Operatori pe schimb',
    howToFix: 'Scrie un număr întreg între 1 și 10 (câți oameni pun gălețile acum).',
  },
  bucketsPerPallet: {
    name: 'Găleți pe palet',
    howToFix: 'Scrie câte găleți încap pe un palet (de obicei 44 la găleți mari sau 100 la găleți mici de 5 kg).',
  },
  manualConfirmed: {
    name: 'Bifa de jos (paleți și separatoare manuale)',
    howToFix: 'Pune bifa în pătrățel ca să confirmi că un om schimbă paleții și pune foile separatoare.',
  },
};

/** Translates the exact current app state into one crystal-clear next step. */
export function getContextualNextStepReply(snapshot: AppSnapshot): BotReply {
  const errorKeys = Object.keys(snapshot.errors) as FieldName[];

  if (errorKeys.length > 0) {
    return explainCurrentErrorsReply(snapshot);
  }

  if (!hasAnyInput(snapshot.values)) {
    return {
      title: 'Următorul pas simplu pentru tine:',
      paragraphs: [
        'Momentan căsuțele sunt goale. Cel mai ușor mod de a începe este să apeși butonul de probă ca să se umple toate singure!',
        'Sau poți scrie tu datele tale în formularul «Date firmă» și «Parametri linie».',
      ],
      actions: [
        { label: 'Umple exemplul bun pentru mine', kind: 'run_demo_normal', primary: true },
        { label: 'Arată-mi formularul', kind: 'spotlight', section: 'form' },
        { label: 'Începe turul pas cu pas', kind: 'start_tour' },
      ],
    };
  }

  if (snapshot.result === null || snapshot.formIsDirtySinceEval) {
    return {
      title: 'Ești gata să apeși butonul verde!',
      paragraphs: [
        snapshot.formIsDirtySinceEval
          ? 'Ai schimbat ceva în căsuțe după ultima evaluare. Hai să mai apăsăm o dată pe butonul verde ca să actualizăm rezultatul!'
          : 'Ai date în formular! Acum apasă butonul verde «' +
            LABELS.evaluate +
            '» ca să afli dacă robotul UR20 se potrivește.',
      ],
      actions: [
        { label: 'Apasă Evaluarea pentru mine', kind: 'run_evaluate', primary: true },
        { label: 'Arată-mi unde e formularul', kind: 'spotlight', section: 'form' },
      ],
    };
  }

  if (snapshot.requestEnabled && !snapshot.hasSavedRequest) {
    return {
      title: 'Ai deja rezultatul! Iată ce poți face acum:',
      paragraphs: [
        `Rezultatul tău este «${snapshot.result.verdict}». Acum poți face două lucruri distractive și utile:`,
      ],
      steps: [
        { badge: '1', text: 'Uită-te la robotul 3D de mai jos ca să vezi cum stă în cameră.' },
        { badge: '2', text: `Apasă butonul verde «${LABELS.request}» ca să salvezi cererea și să o descarci.` },
      ],
      actions: [
        { label: 'Salvează cererea acum', kind: 'run_save_request', primary: true },
        { label: 'Arată-mi robotul 3D', kind: 'spotlight', section: 'visualizer' },
        { label: 'Explică rezultatul pe înțelesul meu', kind: 'ask_topic', topic: 'explain_current' },
      ],
    };
  }

  return {
    title: 'Super treabă! Ai terminat toți pașii!',
    paragraphs: [
      `Ai salvat deja cererea (total salvate local: ${snapshot.savedCount}). Poți apăsa «${LABELS.export}» ca să descarci fișierul .json pe dispozitiv.`,
      'Dacă vrei, poți testa și alte greutăți de găleată (de exemplu 5 kg) sau butonul cu erori ca să vezi cum reacționează aplicația!',
    ],
    actions: [
      { label: 'Arată-mi butonul de descărcare', kind: 'spotlight', section: 'request', primary: true },
      { label: 'Testează cum arată o eroare', kind: 'run_demo_errors' },
      { label: 'Arată-mi robotul 3D', kind: 'spotlight', section: 'visualizer' },
    ],
  };
}

/** Explains current form errors in warm, ultra-simple language. */
export function explainCurrentErrorsReply(snapshot: AppSnapshot): BotReply {
  const errorEntries = Object.entries(snapshot.errors).filter(
    (entry): entry is [FieldName, string] => typeof entry[1] === 'string' && entry[1].length > 0,
  );

  if (errorEntries.length === 0) {
    return {
      title: 'Nu ai nicio eroare acum!',
      paragraphs: [
        'Toate căsuțele arată curat și fără mesaje de eroare. Dacă vrei să vezi cum arată o greșeală și cum o rezolvăm, putem testa butonul de probă cu erori!',
      ],
      actions: [
        { label: 'Ce să fac chiar acum?', kind: 'ask_topic', topic: 'what_next', primary: true },
        { label: 'Arată-mi un exemplu cu erori', kind: 'run_demo_errors' },
      ],
    };
  }

  const steps: ChatStepItem[] = errorEntries.slice(0, 6).map(([field, rawMsg], idx) => {
    const info = SIMPLE_FIELD_HELP[field];
    const isPayloadError =
      field === 'bucketKg' && rawMsg.includes('depășește limita UR20 de 20 kg');
    return {
      badge: String(idx + 1),
      text: isPayloadError
        ? `${info.name}: Găleata + mâna robotului depășesc 20 kg! Scade greutatea găleții (ex: 13 kg) ca să poată ridica robotul.`
        : `${info.name}: ${info.howToFix}`,
    };
  });

  return {
    title: `Am găsit ${errorEntries.length} ${errorEntries.length === 1 ? 'căsuță' : 'căsuțe'} de reparat`,
    paragraphs: [
      'Nu-ți face griji, e foarte ușor să le reparăm! Aplicația ne spune exact ce lipsește sau e prea mare:',
    ],
    steps,
    tip: 'După ce repari căsuțele, apasă din nou butonul verde «' + LABELS.evaluate + '» — sau apasă mai jos ca să pun eu datele corecte de probă!',
    actions: [
      { label: 'Arată-mi căsuțele pe pagină', kind: 'spotlight', section: 'form', primary: true },
      { label: 'Pune datele corecte (Demo)', kind: 'run_demo_normal' },
    ],
  };
}

/** Explains the current EvaluationResult in super-simple terms. */
export function explainCurrentResultReply(snapshot: AppSnapshot): BotReply {
  if (snapshot.result === null) {
    return {
      title: 'Încă nu avem un rezultat!',
      paragraphs: [
        `Ca să apară rezultatul, trebuie mai întâi să ai date în căsuțe și să apeși butonul verde «${LABELS.evaluate}».`,
      ],
      actions: [
        ...(hasAnyInput(snapshot.values)
          ? [{ label: 'Apasă Evaluarea acum', kind: 'run_evaluate' as const, primary: true }]
          : [{ label: 'Umple exemplul bun', kind: 'run_demo_normal' as const, primary: true }]),
        { label: 'Arată-mi unde apare rezultatul', kind: 'spotlight', section: 'result' },
      ],
    };
  }

  if (snapshot.result.verdict === 'Eroare date') {
    return explainCurrentErrorsReply(snapshot);
  }

  const { verdict, kpi, reasons, notes } = snapshot.result;
  const isCompatible = verdict === 'Compatibil pentru evaluare tehnică';

  const steps: ChatStepItem[] = [];
  if (kpi) {
    steps.push({
      badge: 'KG',
      text: `Greutate totală: ${kpi.payload}. Robotul UR20 ridică sigur până la 20 kg.`,
    });
    steps.push({
      badge: 'V',
      text: `Viteză: ${kpi.rate}. Comparăm viteza fabricii tale cu testul PURATOS.`,
    });
    steps.push({
      badge: 'P',
      text: `Palet: ${kpi.pallet}. Atât de des vine un om să schimbe paletul plin.`,
    });
    steps.push({
      badge: 'H',
      text: `${kpi.hub} — acesta este cel mai apropiat sediu Tech-Con pentru tine.`,
    });
  }

  const paragraphs: string[] = isCompatible
    ? [
        'Veste bună! «Compatibil pentru evaluare tehnică» înseamnă că toate cele 4 verificări de bază au trecut cu bine!',
        'Uite pe scurt ce arată cele 4 cartonașe din rezultat:',
      ]
    : [
        '«Validare suplimentară» NU înseamnă că nu se poate — înseamnă doar că un inginer Tech-Con trebuie să verifice 1–2 detalii speciale la linia ta:',
        ...reasons.map((r) => `• ${r}`),
      ];

  if (notes.length > 0) {
    paragraphs.push(`Notă utilă: ${notes[0]}`);
  }

  return {
    title: isCompatible ? 'Rezultatul tău: Totul se potrivește!' : 'Rezultatul tău: Nevoie de o privire extra',
    paragraphs,
    steps,
    tip: 'Nu uita: robotul pune gălețile pe palet, dar paleții și foile separatoare se schimbă manual de un om.',
    actions: [
      { label: 'Arată-mi rezultatul pe pagină', kind: 'spotlight', section: 'result' },
      ...(snapshot.requestEnabled
        ? [{ label: 'Salvează cererea acum', kind: 'run_save_request' as const, primary: true }]
        : [{ label: 'Vezi robotul în 3D', kind: 'spotlight' as const, section: 'visualizer' as const, primary: true }]),
    ],
  };
}

/** Contextual quick-tap question chips shown right above the chat input. */
export function getQuickTopics(snapshot: AppSnapshot): readonly QuickTopic[] {
  const hasErrors = Object.keys(snapshot.errors).length > 0;
  const hasGoodResult =
    snapshot.result !== null && snapshot.result.verdict !== 'Eroare date';

  const topics: QuickTopic[] = [
    { id: 'what_next', label: 'Ce fac acum?' },
    { id: 'tour', label: 'Tur pas cu pas' },
  ];

  if (hasErrors) {
    topics.push({ id: 'explain_errors', label: 'Cum repar erorile?' });
  } else if (hasGoodResult) {
    topics.push({ id: 'explain_current', label: 'Explică rezultatul' });
  } else {
    topics.push({ id: 'gripper', label: 'Ce e gripper-ul?' });
  }

  topics.push({ id: 'visualizer_3d', label: 'Cum merge 3D-ul?' });
  topics.push({ id: 'save_request', label: 'Cum salvez cererea?' });
  return topics;
}

/** Answers a topic shortcut or any free-text user question in super-simple Romanian. */
export function answerUserMessage(rawInput: string, snapshot: AppSnapshot): BotReply {
  const q = normalizeText(rawInput);

  // Direct topic IDs from quick buttons
  if (q === 'what_next' || q === 'ce fac acum' || q === 'ce sa fac chiar acum') {
    return getContextualNextStepReply(snapshot);
  }
  if (q === 'tour' || q === 'tur' || q === 'tur pas cu pas') {
    return getTourStepReply(1, snapshot);
  }
  if (q === 'explain_current' || q === 'explica rezultatul') {
    return explainCurrentResultReply(snapshot);
  }
  if (q === 'explain_errors' || q === 'cum repar erorile' || q === 'de ce am erori') {
    return explainCurrentErrorsReply(snapshot);
  }

  // 1. Guided tour / how to use / help / confused
  if (
    /\b(tur|ghid|tutorial|pas cu pas|cum folosesc|cum se foloseste|cum functioneaza|cum incep|incep|ajutor|help|how|start|nu inteleg|nu stiu|ce face aplicatia|explica tot)\b/.test(
      q,
    )
  ) {
    return getTourStepReply(1, snapshot);
  }

  // 2. What should I do right now?
  if (
    /\b(ce fac|ce sa fac|urmatorul pas|pasul urmator|unde apas|ce buton|acum|next)\b/.test(q)
  ) {
    return getContextualNextStepReply(snapshot);
  }

  // 3. 3D visualizer & SICK safety zones (checked before generic errors so "rosu la sick" routes here)
  if (
    q === 'visualizer_3d' ||
    /\b(3d|2d|desen|vizualiz|visualizer|sick|semafor|verde|galben|scaner|siguranta|spatiu|lungime|latime|camera|hala|transportor|banda|2 celule|izometric)\b/.test(
      q,
    )
  ) {
    return {
      title: 'Cum te joci cu desenul 3D al robotului?',
      paragraphs: [
        'Desenul 3D îți arată robotul cum se mișcă și cât loc ocupă în hală (împreună cu cei 2 paleți). Este sincronizat direct cu greutatea și viteza pe care le-ai scris sus!',
        'Cele 3 butoane SICK funcționează exact ca un semafor pe stradă:',
      ],
      steps: [
        { badge: 'V', text: 'Verde (100%): nu e nimeni lângă robot, lucrează la viteză normală.' },
        { badge: 'G', text: 'Galben (40%): s-a apropiat cineva, robotul încetinește ca să fie atent.' },
        { badge: 'R', text: 'Roșu (0%): cineva e foarte aproape, robotul se oprește complet pe loc!' },
      ],
      tip: 'Poți testa și «2 celule (PURATOS)» sau să micșorezi Lungimea/Lățimea spațiului ca să vezi alerta roșie de spațiu insuficient!',
      actions: [
        { label: 'Du-mă la robotul 3D acum', kind: 'spotlight', section: 'visualizer', primary: true },
        { label: 'Ce fac mai departe?', kind: 'ask_topic', topic: 'what_next' },
      ],
    };
  }

  // 4. Saving request / CRM / JSON export / why button is disabled/gray
  if (
    q === 'save_request' ||
    /\b(cerere|crm|salvez|salvare|descarc|descarcare|json|fisier|trimit|gri|dezactivat|nu pot apasa|duplicat|save|export|download)\b/.test(
      q,
    )
  ) {
    return {
      title: 'Cum salvezi și descarci cererea (.json)?',
      paragraphs: [
        `Jos pe pagină ai panoul «Cerere către Tech-Con». Butonul «${LABELS.request}» stă gri (blocat) până când termini o evaluare fără erori.`,
        'De ce uneori redevine gri? Dacă schimbi orice cifră din formular după evaluare, trebuie să mai apeși o dată «' +
          LABELS.evaluate +
          '»!',
      ],
      steps: [
        { badge: '1', text: `Apasă «${LABELS.evaluate}» și verifică să nu fie erori.` },
        { badge: '2', text: `Apasă «${LABELS.request}» — cererea se salvează în browserul tău.` },
        { badge: '3', text: `Apasă «${LABELS.export}» ca să primești fișierul pe dispozitiv.` },
      ],
      tip: 'Dacă apeși de două ori cu aceeași firmă și același email, aplicația recunoaște duplicatul și o păstrează o singură dată.',
      actions: [
        ...(snapshot.requestEnabled
          ? [{ label: 'Salvează cererea chiar acum', kind: 'run_save_request' as const, primary: true }]
          : [{ label: 'Du-mă la zona de Cerere', kind: 'spotlight' as const, section: 'request' as const, primary: true }]),
        { label: 'Ce să fac chiar acum?', kind: 'ask_topic', topic: 'what_next' },
      ],
    };
  }

  // 5. Email & .example rule
  if (/\b(email|mail|example|adresa|gdpr|date personale|fictive)\b/.test(q)) {
    return {
      title: 'De ce trebuie email cu «.example»?',
      paragraphs: [
        'Aplicația asta este un prototip de demonstrație, așa că nu vrem să salvăm adrese reale de email ale oamenilor.',
        'Scrie orice adresă inventată care se termină cu «.example», de exemplu: productie@lactosud-demo.example sau ion@fabrica.example.',
      ],
      tip: 'Dacă folosești butonul «' + LABELS.demoNormal + '», emailul corect se pune automat!',
      actions: [
        { label: 'Pune exemplul bun (Demo)', kind: 'run_demo_normal', primary: true },
        { label: 'Arată-mi câmpul de email', kind: 'spotlight', section: 'form' },
      ],
    };
  }

  // 6. Errors / red messages / validation
  if (/\b(eroare|erori|gresit|greseala|nu merge|rosu|lipsa|repar|corectez|blocat|error)\b/.test(q)) {
    if (Object.keys(snapshot.errors).length > 0) {
      return explainCurrentErrorsReply(snapshot);
    }
    return {
      title: 'Cum funcționează erorile din formular?',
      paragraphs: [
        'Când o căsuță e goală, are un număr imposibil sau găleata + mâna robotului trec de 20 kg, aplicația o încadrează cu roșu și îți scrie dedesubt ce trebuie schimbat.',
        'Vrei să vezi un exemplu live de erori ca să exersezi?',
      ],
      actions: [
        { label: 'Arată-mi exemplul cu erori', kind: 'run_demo_errors', primary: true },
        { label: 'Încarcă exemplul fără erori', kind: 'run_demo_normal' },
      ],
    };
  }

  // 7. Gripper & 20 kg payload limit
  if (
    q === 'gripper' ||
    /\b(gripper|greutate|grea|greu|kg|20|sarcina|ridica|mana|prinde|payload|weight)\b/.test(q)
  ) {
    return {
      title: 'Ce este «gripper-ul» și regula de 20 kg?',
      paragraphs: [
        'Gripper-ul este «mâna» specială a robotului care apucă găleata. Și mâna asta are o greutate (de obicei 2–3 kg).',
        'Robotul UR20 poate ridica cel mult 20 kg în total. Deci facem o adunare simplă: greutatea găleții + greutatea gripper-ului <= 20 kg!',
      ],
      steps: [
        { badge: 'OK', text: 'Exemplu bun: găleată 13 kg + gripper 3 kg = 16 kg (încape sub 20 kg!).' },
        { badge: 'NU', text: 'Prea greu: găleată 18 kg + gripper 3 kg = 21 kg (trece de 20 kg!).' },
      ],
      tip: 'Dacă găleata are peste 13 kg (dar totalul rămâne sub 20 kg), aplicația cere «Validare suplimentară» pentru că testul FAT a fost făcut până la 13 kg.',
      actions: [
        { label: 'Arată-mi căsuțele de greutate', kind: 'spotlight', section: 'form', primary: true },
        { label: 'Testează exemplul de 13 kg', kind: 'run_demo_normal' },
      ],
    };
  }

  // 8. Rate / speed / FAT PURATOS
  if (/\b(ritm|viteza|minut|fat|puratos|repede|incet|galeti|rate|speed)\b/.test(q)) {
    return {
      title: 'Ce înseamnă «Ritm linie (găleți/min)» și testul FAT?',
      paragraphs: [
        'Ritmul înseamnă câte găleți vin pe bandă într-un singur minut. De exemplu, 6 găleți/min înseamnă o găleată la fiecare 10 secunde.',
        'La testul real de fabrică (FAT PURATOS), robotul a reușit:',
      ],
      steps: [
        { badge: '5 kg', text: 'Până la 8,6 găleți/min pentru găleți ușoare (≤ 5 kg).' },
        { badge: '13 kg', text: 'Până la 7,4 găleți/min pentru găleți mai grele (> 5 kg).' },
      ],
      tip: 'Atenție: cifrele FAT sunt rezultate din testul PURATOS, nu o garanție că merge identic fără opriri în orice fabrică.',
      actions: [
        { label: 'Arată-mi formularul', kind: 'spotlight', section: 'form', primary: true },
        { label: 'Explică rezultatul meu', kind: 'ask_topic', topic: 'explain_current' },
      ],
    };
  }

  // 9. Manual pallets / separators / checkbox / 5 min threshold
  if (
    /\b(palet|paleti|manual|bifa|bifez|separator|separatoare|44|100|5 min|blocaj|aval|checkbox)\b/.test(
      q,
    )
  ) {
    return {
      title: 'De ce trebuie bifa cu paleți și separatoare manuale?',
      paragraphs: [
        'Robotul UR20 pune gălețile frumos pe palet, dar NU aduce paleți goi din depozit și NU așază foile dintre rânduri. Asta face în continuare un coleg (om).',
        'Bifa din formular doar confirmă că știi asta. În plus, aplicația calculează din câte în câte minute se umple paletul:',
      ],
      steps: [
        { badge: '100', text: 'La găleți mici (≤ 5 kg), încap cam 100 de găleți pe un palet.' },
        { badge: '44', text: 'La găleți mari (> 5 kg), încap cam 44 de găleți pe un palet.' },
        { badge: '5m', text: 'Dacă paletul se umple în mai puțin de 5 minute, omul ar alerga prea des — aplicația te avertizează!' },
      ],
      actions: [
        { label: 'Arată-mi bifa în formular', kind: 'spotlight', section: 'form', primary: true },
        { label: 'Vezi cei 2 paleți în 3D', kind: 'spotlight', section: 'visualizer' },
      ],
    };
  }

  // 10. Current result / verdict meaning
  if (/\b(rezultat|verdict|compatibil|validare|kpi|cartonas|explica)\b/.test(q)) {
    return explainCurrentResultReply(snapshot);
  }

  // 11. Demo buttons
  if (/\b(demo|proba|exemplu|test|lactosud)\b/.test(q)) {
    return {
      title: 'Butoanele de testare rapidă (1 click)',
      paragraphs: [
        'Nu trebuie să inventezi cifre ca să încerci aplicația! Sus de tot ai două butoane magice:',
      ],
      steps: [
        { badge: '1', text: `«${LABELS.demoNormal}» — umple tot formularul cu o fabrică fictivă compatibilă (13 kg, Ilfov).` },
        { badge: '2', text: `«${LABELS.demoErrors}» — umple cu date incomplete și 21 kg, ca să vezi cum prinde aplicația erorile.` },
      ],
      actions: [
        { label: 'Încarcă exemplul bun acum', kind: 'run_demo_normal', primary: true },
        { label: 'Încarcă exemplul cu erori', kind: 'run_demo_errors' },
      ],
    };
  }

  // 12. Hubs / county / delivery lead time
  if (
    /\b(hub|sediu|sedii|judet|dragomiresti|timisoara|iasi|livrare|luni|august|unde|zona|regiune)\b/.test(
      q,
    )
  ) {
    return {
      title: 'Cum alege aplicația sediul Tech-Con și cât durează livrarea?',
      paragraphs: [
        'După județul ales de tine, aplicația te trimite automat la cel mai apropiat sediu Tech-Con din România:',
      ],
      steps: [
        { badge: 'S', text: 'Dragomirești-Deal — pentru Sud și Centru (ex: Ilfov, București, Brașov).' },
        { badge: 'V', text: 'Timișoara — pentru Vest (ex: Timiș, Arad, Bihor, Cluj).' },
        { badge: 'E', text: 'Iași — pentru Est / Moldova (ex: Iași, Suceava, Bacău, Galați).' },
      ],
      tip: 'Livrarea unei celule durează cam 4 luni — deci pentru livrare în același an, comanda trebuie semnată până la final de august.',
      actions: [
        { label: 'Arată-mi lista de județe', kind: 'spotlight', section: 'form', primary: true },
        { label: 'Explică rezultatul meu', kind: 'ask_topic', topic: 'explain_current' },
      ],
    };
  }

  // 13. Out of scope (MiR, wrapping, shipping)
  if (/\b(mir|infoliere|expediere|transport|nu face|limita|scop)\b/.test(q)) {
    return {
      title: 'Ce face robotul și ce NU face?',
      paragraphs: [
        'Robotul UR20 face foarte bine un singur lucru: ia gălețile de pe bandă, vede mânerul cu camera SICK 2D și le așază ordonat pe cei 2 paleți.',
        'În schimb, NU sunt incluse aici: mutarea paleților cu roboței MiR, înfolierea paleților și expedierea. Schimbarea paleților și foile separatoare rămân manuale.',
      ],
      actions: [
        { label: 'Vezi celula în 3D', kind: 'spotlight', section: 'visualizer', primary: true },
        { label: 'Începe turul pas cu pas', kind: 'start_tour' },
      ],
    };
  }

  // 14. Price / business model (uses constants.ts BUSINESS — never hardcoded)
  if (/\b(pret|cost|bani|euro|eur|buget|business|scump|ieftin|vanzare|celule)\b/.test(q)) {
    const price = formatInt(BUSINESS.pricePerCellEur);
    const contrib = formatInt(BUSINESS.contributionPerCellEur);
    const budget = formatInt(BUSINESS.promoBudgetEur);
    const cells = formatInt(BUSINESS.cellsPerYear);
    return {
      title: 'Cifrele din scenariul de concurs',
      paragraphs: [
        `În scenariul de concurs (date orientative, NU prețuri reale PURATOS): o celulă UR20 costă ${price} EUR fără TVA, cu o contribuție de ${contrib} EUR/celulă.`,
        `Bugetul anual de promovare este ${budget} EUR, iar scenariul de bază țintește ${cells} celule pe an.`,
      ],
      tip: MESSAGES.stripLabel,
      actions: [
        { label: 'Ce să fac în aplicație acum?', kind: 'ask_topic', topic: 'what_next', primary: true },
      ],
    };
  }

  // 15. Friendly greeting / thank you
  if (/^(salut|buna|hey|hello|hi|ciao|neata|multumesc|mersi|ms|super|bravo|ok|bine|gata)$/.test(q)) {
    return {
      title: 'Cu mare drag!',
      paragraphs: [
        'Sunt chiar aici lângă tine ori de câte ori ai nevoie. Alege ce vrei să explorăm acum:',
      ],
      actions: [
        { label: 'Ce să fac chiar acum?', kind: 'ask_topic', topic: 'what_next', primary: true },
        { label: 'Tur pas cu pas (1 min)', kind: 'start_tour' },
        { label: 'Arată-mi robotul 3D', kind: 'spotlight', section: 'visualizer' },
      ],
    };
  }

  // 16. Helpful fallback — never a dead end!
  const rateHint = formatScaled(74, 1, { min: 1, max: 1 });
  return {
    title: 'Hai să o luăm simplu împreună!',
    paragraphs: [
      `Nu sunt sigur exact la ce te referi prin «${rawInput.trim().slice(0, 48)}», dar îți pot arăta imediat orice parte a aplicației.`,
      `Poți să mă întrebi lucruri precum «ce e gripper-ul?», «de ce e limita de 20 kg?», «ce înseamnă ${rateHint} găleți/min?», «cum merge 3D-ul?» sau să apeși direct un buton:`,
    ],
    actions: [
      { label: 'Începe turul pas cu pas', kind: 'start_tour', primary: true },
      { label: 'Ce să fac chiar acum?', kind: 'ask_topic', topic: 'what_next' },
      { label: 'Explică erorile / câmpurile', kind: 'ask_topic', topic: 'explain_errors' },
      { label: 'Cum merge desenul 3D?', kind: 'ask_topic', topic: 'visualizer_3d' },
    ],
  };
}
