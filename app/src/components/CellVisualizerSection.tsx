import { useMemo, useState } from 'react';
import { Box, Camera, CheckCircle2 } from 'lucide-react';
import {
  syncLineToCellParams,
  type CellCount,
  type ConveyorDirection,
  type SickZoneState,
} from '../logic/cellGeometry';
import { TabPhotoFit } from './TabPhotoFit';
import { TabVisualizer3D } from './TabVisualizer3D';

export type VisualizerTab = '3d' | 'photofit';

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
  const [activeTab, setActiveTab] = useState<VisualizerTab>('3d');
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
            Previzualizare spațiu și amplasare celulă UR20
          </h2>
          <p className="text-sm text-slate-600">
            Verificare orientativă a gabaritului, direcției transportorului și suprapunere pe poza
            halei.
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

      <div
        role="tablist"
        aria-label="Mod previzualizare celulă UR20"
        className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row"
      >
        <button
          id="tab-btn-3d"
          type="button"
          role="tab"
          aria-selected={activeTab === '3d'}
          aria-controls="tab-panel-3d"
          onClick={() => setActiveTab('3d')}
          className={`inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === '3d'
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Box size={18} className="shrink-0" aria-hidden="true" />
          <span>Previzualizare 3D / Izometrică</span>
        </button>

        <button
          id="tab-btn-photofit"
          type="button"
          role="tab"
          aria-selected={activeTab === 'photofit'}
          aria-controls="tab-panel-photofit"
          onClick={() => setActiveTab('photofit')}
          className={`inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'photofit'
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Camera size={18} className="shrink-0" aria-hidden="true" />
          <span>Photo-Fit: Suprapunere pe Poza Halei</span>
        </button>
      </div>

      <div
        id="tab-panel-3d"
        role="tabpanel"
        aria-labelledby="tab-btn-3d"
        hidden={activeTab !== '3d'}
        className="min-w-0"
      >
        <TabVisualizer3D
          isActive={activeTab === '3d'}
          synced={synced}
          demoResetTick={demoResetTick}
          conveyorDir={conveyorDir}
          onConveyorDirChange={setConveyorDir}
          cellCount={cellCount}
          onCellCountChange={setCellCount}
          sickZone={sickZone}
          onSickZoneChange={setSickZone}
        />
      </div>

      <div
        id="tab-panel-photofit"
        role="tabpanel"
        aria-labelledby="tab-btn-photofit"
        hidden={activeTab !== 'photofit'}
        className="min-w-0"
      >
        <TabPhotoFit
          isActive={activeTab === 'photofit'}
          synced={synced}
          conveyorDir={conveyorDir}
          cellCount={cellCount}
          sickZone={sickZone}
        />
      </div>
    </section>
  );
}
