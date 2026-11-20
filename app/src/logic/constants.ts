// Constants, verbatim UI labels/messages and demo fixtures for PaletCheck UR20.
// No dependency on numbers.ts: templates receive already-formatted values.

import type { FormValues, Segment } from './types';

/** Commercial figures, must equal brief/NUMBERS.json (checked by constants.test.ts). */
export const BUSINESS = {
  pricePerCellEur: 130_000,
  contributionPerCellEur: 20_000,
  promoBudgetEur: 30_000,
  cellsPerYear: 17,
} as const;

export const UR20_PAYLOAD_LIMIT_TENTHS = 200;

export const FAT = {
  refLightMilli: 8600,
  refHeavyMilli: 7400,
  minTargetMilli: 6000,
  maxTestedMilli: 13000,
} as const;

/** Bucket weight (milli) at or below which the light FAT reference applies. */
export const LIGHT_BUCKET_MAX_MILLI = 5000;

export const PALLET_THRESHOLD_TENTHS = 50;

export const NON_FOOD_SEGMENT: Segment = 'Altă industrie (non-alimentară)';

export const SEGMENTS: readonly Segment[] = [
  'Panificație / patiserie / ingrediente',
  'Lactate',
  'Sosuri / muștar / maioneză',
  'Creme / gemuri / miere',
  NON_FOOD_SEGMENT,
];

export const LABELS = {
  demoNormal: 'Încarcă caz normal (Demo)',
  demoErrors: 'Testează date lipsă / erori',
  evaluate: 'Evaluează compatibilitatea UR20',
  request: 'Generează cerere relevantă (CRM)',
  export: 'Descarcă cererea (.json)',
} as const;

export const MESSAGES = {
  required: 'Câmp obligatoriu.',
  requiredNumeric: 'Câmp obligatoriu – introdu o valoare numerică.',
  range: {
    bucketKg: 'Valoarea trebuie să fie între 0,5 și 30 kg.',
    gripperKg: 'Valoarea trebuie să fie între 0 și 10 kg.',
    ratePerMin: 'Valoarea trebuie să fie între 0,1 și 20 găleți/min.',
    shiftsPerDay: 'Introdu un număr întreg între 1 și 3 schimburi/zi.',
    operatorsPerShift: 'Introdu un număr întreg între 1 și 10 operatori/schimb.',
    bucketsPerPallet: 'Introdu un număr întreg între 1 și 200 găleți/palet.',
  },
  /** `total` must already be in Romanian format, e.g. "21" or "20,5". */
  payload: (total: string): string =>
    `Sarcina totală ${total} kg (găleată + gripper) depășește limita UR20 de 20 kg.`,
  manualConfirm: 'Confirmă că schimbarea paleților și amplasarea separatoarelor rămân manuale.',
  emailDemo: 'Prototip demo: folosește doar adrese fictive cu domeniul .example.',
  duplicate: 'Cerere existentă – aceeași firmă și același email au fost deja înregistrate.',
  requestHint: 'Rulează mai întâi o evaluare fără erori.',
  fixFields: 'Corectează câmpurile care au mesaj de eroare, apoi rulează din nou evaluarea.',
  allPassed:
    'Toate verificările au trecut: sarcină utilă, ritm FAT, interval schimb palet și segment.',
  reasons: {
    rate: 'Ritm peste reperul testat la FAT PURATOS',
    weight: 'Greutate peste 13 kg, netestată la FAT PURATOS',
    pallet: 'Risc blocaj aval: schimbul manual de palet apare la mai puțin de 5 minute',
    segment: 'Industrie non-alimentară: necesită validare tehnică separată',
  },
  belowTargetNote:
    'Ritmul liniei este sub ținta FAT de 6 găleți/min; celula nu va fi factorul limitativ.',
  fatDisclaimer:
    'Cifrele FAT sunt rezultatele testului aplicației PURATOS, nu garanții de funcționare fără opriri în orice fabrică.',
  scopeDisclaimer:
    'În afara scopului: transportul paleților către logistică (MiR), înfolierea și expedierea. Schimbarea paleților și amplasarea separatoarelor rămân manuale.',
  deliveryNote:
    'Livrare estimată ~4 luni de la comandă; pentru livrare în anul curent, comanda trebuie semnată până la final de august.',
  hubLabel: 'alocare pe regiuni (aproximare)',
  palletThresholdLabel: 'prag 5 min – ipoteză prototip, de validat cu Tech-Con',
  stripLabel: 'Date de scenariu concurs, nu prețuri reale PURATOS',
  downloadFailed: 'Descărcarea nu a pornit în acest browser.',
  /** `n` is the integer count of saved requests. */
  savedCount: (n: number): string => `Cereri salvate local: ${n}`,
} as const;

export const DEMO_NORMAL: Readonly<FormValues> = Object.freeze({
  company: 'SC LactoSud Demo SRL',
  contactName: 'Andrei Ionescu (Demo)',
  email: 'productie@lactosud-demo.example',
  county: 'Ilfov',
  segment: 'Lactate',
  bucketKg: '13',
  gripperKg: '3',
  ratePerMin: '6,5',
  shiftsPerDay: '2',
  operatorsPerShift: '2',
  bucketsPerPallet: '44',
  manualConfirmed: true,
});

export const DEMO_ERRORS: Readonly<FormValues> = Object.freeze({
  company: 'SC Test Erori Demo SRL',
  contactName: '',
  email: '',
  county: 'Ilfov',
  segment: 'Lactate',
  bucketKg: '18',
  gripperKg: '3',
  ratePerMin: '',
  shiftsPerDay: '2',
  operatorsPerShift: '2',
  bucketsPerPallet: '44',
  manualConfirmed: false,
});
