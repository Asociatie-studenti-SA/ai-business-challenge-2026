/**
 * Hero: one heading line + one short sentence. Small vertical padding keeps
 * the block under 96 px at 360 px width so the demo buttons stay above the fold (Req 10.9).
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-3 sm:px-6">
      <h1 className="text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
        Verifică linia ta de găleți pentru UR20
      </h1>
      <p className="mt-1 text-sm leading-snug text-slate-600">
        Introdu datele liniei și primești verdictul în 30 de secunde.
      </p>
    </section>
  );
}
