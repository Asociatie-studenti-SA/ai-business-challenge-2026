import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  syncLineToCellParams,
  type CellCount,
  type ConveyorDirection,
  type SickZoneState,
} from '../logic/cellGeometry';
import { TabVisualizer3D } from './TabVisualizer3D';

export interface CellVisualizerSectionProps {
  bucketKgRaw: string;
  ratePerMinRaw: string;
  demoResetTick: number;
}

export function CellVisualizerSection({
  bucketKgRaw,
  ratePerMinRaw,
  demoResetTick,
}: CellVisualizerSectionProps) {
  const [conveyorDir, setConveyorDir] = useState<ConveyorDirection>('spate');
  const [cellCount, setCellCount] = useState<CellCount>(1);
  const [sickZone, setSickZone] = useState<SickZoneState>('free');

  const synced = useMemo(
    () => syncLineToCellParams(bucketKgRaw, ratePerMinRaw),
    [bucketKgRaw, ratePerMinRaw],
  );

  return (
    <section
      aria-labelledby="cell-visualizer-heading"
      className="min-w-0 space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="cell-visualizer-heading" className="text-lg font-semibold text-slate-900">
            Previzualizare 3D / Plan 2D celulă UR20
          </h2>
          <p className="text-sm text-slate-600">
            Verificare orientativă a gabaritului, direcției transportorului și zonelor de siguranță
            SICK.
          </p>
        </div>

        <div
          aria-live="polite"
          className={`inline-flex flex-none items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-medium sm:self-auto ${
            synced.allSynced
              ? 'border-teal-700 bg-teal-50 text-teal-900'
              : 'border-slate-300 bg-slate-50 text-slate-800'
          }`}
        >
          <CheckCircle2
            size={14}
            className={`shrink-0 ${synced.allSynced ? 'text-teal-700' : 'text-slate-500'}`}
            aria-hidden="true"
          />
          <span>
            {synced.allSynced
              ? `Sincronizat formular: ${synced.bucketLabel} (${synced.bucketsPerPallet}/palet) • ${synced.rateLabel}`
              : `Valori curente: ${synced.bucketLabel} (${synced.bucketsPerPallet}/palet) • ${synced.rateLabel}`}
          </span>
        </div>
      </div>

      <TabVisualizer3D
        isActive
        synced={synced}
        demoResetTick={demoResetTick}
        conveyorDir={conveyorDir}
        onConveyorDirChange={setConveyorDir}
        cellCount={cellCount}
        onCellCountChange={setCellCount}
        sickZone={sickZone}
        onSickZoneChange={setSickZone}
      />
    </section>
  );
}
