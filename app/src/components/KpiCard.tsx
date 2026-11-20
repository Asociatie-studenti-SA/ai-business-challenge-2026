import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  /** lucide-react icon component; always rendered at size 18 (Req 10.2). */
  icon: LucideIcon;
  title: string;
  /** Already formatted in Romanian by the logic layer. */
  value: string;
  /** Optional notes / disclaimers shown inside the card, always visible. */
  children?: ReactNode;
}

export function KpiCard({ icon: Icon, title, value, children }: KpiCardProps) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Icon size={18} className="shrink-0 text-teal-700" aria-hidden="true" />
        <span className="min-w-0 break-words">{title}</span>
      </div>
      <p className="mt-1 break-words text-xl font-semibold text-slate-900">{value}</p>
      {children ? (
        <div className="mt-2 space-y-1 break-words text-sm text-slate-600">{children}</div>
      ) : null}
    </div>
  );
}
