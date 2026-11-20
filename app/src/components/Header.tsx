import { Layers } from 'lucide-react';

/** App header: product name left, demo badge right (Req 10.8). */
export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Layers size={18} className="shrink-0 text-teal-700" aria-hidden="true" />
          <span className="text-base font-semibold text-slate-900">PaletCheck UR20</span>
        </div>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          Prototip Demo • Date fictive
        </span>
      </div>
    </header>
  );
}
