// Business-model strip: four commercial chips from BUSINESS + scenario disclaimer.
// Figures come only from constants (no numeric literals here).

import { BUSINESS, MESSAGES } from '../logic/constants';
import { formatInt } from '../logic/numbers';

const CHIPS: readonly string[] = [
  `${formatInt(BUSINESS.pricePerCellEur)} EUR / celulă UR20 (fără TVA)`,
  `Contribuție ${formatInt(BUSINESS.contributionPerCellEur)} EUR / celulă`,
  `Buget promovare ${formatInt(BUSINESS.promoBudgetEur)} EUR / an`,
  `${formatInt(BUSINESS.cellsPerYear)} celule / an (scenariu de bază)`,
];

export function BusinessStrip() {
  return (
    <section aria-labelledby="business-strip-heading" className="max-w-6xl mx-auto px-4 sm:px-6">
      <h2 id="business-strip-heading" className="text-sm font-semibold text-slate-900">
        Model de business (scenariu de bază)
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {CHIPS.map((text) => (
          <li
            key={text}
            className="min-w-0 max-w-full break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-slate-600">{MESSAGES.stripLabel}</p>
    </section>
  );
}

export default BusinessStrip;
