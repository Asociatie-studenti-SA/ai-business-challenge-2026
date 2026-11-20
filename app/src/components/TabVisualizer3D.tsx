import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Eye, Layers, ShieldAlert } from 'lucide-react';
import {
  computeUr20ArmPose,
  DEFAULT_SPACE_LENGTH,
  DEFAULT_SPACE_WIDTH,
  evaluateCellSpace,
  sickSpeedFactor,
  type CellConfig,
  type CellCount,
  type ConveyorDirection,
  type SickZoneState,
  type SyncedLineParams,
  type ViewMode,
} from '../logic/cellGeometry';
import { renderCellCanvas } from '../logic/cellRenderer';
import { formatScaled } from '../logic/numbers';

export interface TabVisualizer3DProps {
  isActive?: boolean;
  synced: SyncedLineParams;
  demoResetTick: number;
  conveyorDir: ConveyorDirection;
  onConveyorDirChange: (dir: ConveyorDirection) => void;
  cellCount: CellCount;
  onCellCountChange: (count: CellCount) => void;
  sickZone: SickZoneState;
  onSickZoneChange: (zone: SickZoneState) => void;
}

const CONVEYOR_OPTIONS: readonly ConveyorDirection[] = ['stânga', 'dreapta', 'spate'];

const SICK_OPTIONS: readonly {
  id: SickZoneState;
  label: string;
  speedText: string;
  activeClass: string;
}[] = [
  {
    id: 'free',
    label: 'Liber (Verde)',
    speedText: '100%',
    activeClass: 'border-emerald-700 bg-emerald-50 text-emerald-900',
  },
  {
    id: 'slow',
    label: 'Reducere viteză (Galben)',
    speedText: '40%',
    activeClass: 'border-amber-600 bg-amber-50 text-amber-900',
  },
  {
    id: 'stop',
    label: 'Oprire protecție (Roșu)',
    speedText: '0%',
    activeClass: 'border-red-700 bg-red-50 text-red-900',
  },
];

function checkReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function TabVisualizer3D({
  isActive = true,
  synced,
  demoResetTick,
  conveyorDir,
  onConveyorDirChange,
  cellCount,
  onCellCountChange,
  sickZone,
  onSickZoneChange,
}: TabVisualizer3DProps) {
  const [lengthRaw, setLengthRaw] = useState(DEFAULT_SPACE_LENGTH);
  const [widthRaw, setWidthRaw] = useState(DEFAULT_SPACE_WIDTH);
  const [viewMode, setViewMode] = useState<ViewMode>('iso');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animTimeRef = useRef<number>(0);
  const lastHandledTickRef = useRef<number>(0);

  useEffect(() => {
    if (demoResetTick > lastHandledTickRef.current) {
      lastHandledTickRef.current = demoResetTick;
      setLengthRaw(DEFAULT_SPACE_LENGTH);
      setWidthRaw(DEFAULT_SPACE_WIDTH);
      onConveyorDirChange('spate');
      onCellCountChange(1);
      onSickZoneChange('free');
    }
  }, [demoResetTick, onConveyorDirChange, onCellCountChange, onSickZoneChange]);

  const spaceEval = useMemo(
    () => evaluateCellSpace(lengthRaw, widthRaw, cellCount),
    [lengthRaw, widthRaw, cellCount],
  );

  const cellConfig: CellConfig = useMemo(
    () => ({
      lengthM: spaceEval.lengthM ?? 2.5,
      widthM: spaceEval.widthM ?? 2.5,
      conveyorDir,
      cellCount,
      viewMode,
      sickZone,
      bucketKg: synced.bucketKg,
      ratePerMin: synced.ratePerMin,
      isLightBucket: synced.isLightBucket,
      bucketsPerPallet: synced.bucketsPerPallet,
      hasCollision: !spaceEval.valid,
    }),
    [spaceEval, conveyorDir, cellCount, viewMode, sickZone, synced],
  );

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = checkReducedMotion();
    let rafId = 0;
    let lastTs = 0;

    const drawFrame = (elapsedSec: number) => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(260, Math.floor(rect.width || 640));
      const cssH = cssW < 480 ? 300 : 390;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const targetW = Math.floor(cssW * dpr);
      const targetH = Math.floor(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        canvas.style.height = `${cssH}px`;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Use unit speedFactor inside pose since animTimeRef already accumulates dt * speedFactor
      const rawPose = computeUr20ArmPose(
        reducedMotion ? 0.45 * (60 / cellConfig.ratePerMin) : elapsedSec,
        cellConfig.ratePerMin,
        'free',
      );
      const pose = {
        ...rawPose,
        speedFactor: sickSpeedFactor(cellConfig.sickZone),
      };

      renderCellCanvas(ctx, cssW, cssH, cellConfig, pose, {
        transparentBg: false,
        spaceEval,
        showDimensions: true,
      });
      ctx.restore();
    };

    const tick = (ts: number) => {
      if (lastTs === 0) lastTs = ts;
      const dt = Math.min(0.1, (ts - lastTs) / 1000);
      lastTs = ts;
      animTimeRef.current += dt * sickSpeedFactor(cellConfig.sickZone);
      drawFrame(animTimeRef.current);
      if (!reducedMotion && cellConfig.sickZone !== 'stop') {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    drawFrame(animTimeRef.current);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => drawFrame(animTimeRef.current));
      ro.observe(container);
    }

    if (!reducedMotion && cellConfig.sickZone !== 'stop') {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [isActive, cellConfig, spaceEval]);

  const cycleSecStr = formatScaled(Math.round(synced.cycleSeconds * 10), 1, { min: 1, max: 1 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0">
          <label htmlFor="cell-length-m" className="mb-1 block text-sm font-medium text-slate-900">
            Lungime spațiu (m)
          </label>
          <input
            id="cell-length-m"
            type="text"
            inputMode="decimal"
            value={lengthRaw}
            onChange={(e) => setLengthRaw(e.target.value)}
            className="block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="cell-width-m" className="mb-1 block text-sm font-medium text-slate-900">
            Lățime spațiu (m)
          </label>
          <input
            id="cell-width-m"
            type="text"
            inputMode="decimal"
            value={widthRaw}
            onChange={(e) => setWidthRaw(e.target.value)}
            className="block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
          />
        </div>

        <div className="min-w-0">
          <span id="conveyor-dir-label" className="mb-1 block text-sm font-medium text-slate-900">
            Direcție transportor
          </span>
          <div
            role="group"
            aria-labelledby="conveyor-dir-label"
            className="grid grid-cols-3 gap-1.5"
          >
            {CONVEYOR_OPTIONS.map((dir) => {
              const active = conveyorDir === dir;
              return (
                <button
                  key={dir}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onConveyorDirChange(dir)}
                  className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-teal-700 bg-teal-50 text-teal-900'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {dir}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <span id="cell-count-label" className="mb-1 block text-sm font-medium text-slate-900">
            Număr celule UR20
          </span>
          <div
            role="group"
            aria-labelledby="cell-count-label"
            className="grid grid-cols-2 gap-1.5"
          >
            <button
              type="button"
              aria-pressed={cellCount === 1}
              onClick={() => onCellCountChange(1)}
              className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                cellCount === 1
                  ? 'border-teal-700 bg-teal-50 text-teal-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              1 celulă
            </button>
            <button
              type="button"
              aria-pressed={cellCount === 2}
              onClick={() => onCellCountChange(2)}
              className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                cellCount === 2
                  ? 'border-teal-700 bg-teal-50 text-teal-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              2 celule (PURATOS)
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-none flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            aria-pressed={viewMode === 'plan'}
            onClick={() => setViewMode((m) => (m === 'iso' ? 'plan' : 'iso'))}
            className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-lg border border-teal-700 bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {viewMode === 'iso' ? (
              <Layers size={18} className="shrink-0" aria-hidden="true" />
            ) : (
              <Eye size={18} className="shrink-0" aria-hidden="true" />
            )}
            <span>Vedere 3D izometrică / Vedere de sus (Plan 2D)</span>
          </button>
          <span className="inline-flex min-h-8 flex-none items-center self-start rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 sm:self-auto">
            Mod activ: {viewMode === 'iso' ? 'Vedere 3D izometrică' : 'Vedere de sus (Plan 2D)'}
          </span>
        </div>

        <div className="min-w-0 flex-none">
          <span id="sick-zone-label" className="mb-1 block text-xs font-medium text-slate-700">
            Simulare zone protecție SICK (3 scanere)
          </span>
          <div
            role="group"
            aria-labelledby="sick-zone-label"
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
          >
            {SICK_OPTIONS.map((opt) => {
              const active = sickZone === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSickZoneChange(opt.id)}
                  className={`inline-flex min-h-11 flex-none items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? opt.activeClass
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-slate-600">({opt.speedText})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!spaceEval.valid && spaceEval.warningMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-600 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-900"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">{spaceEval.warningMessage}</p>
            {!spaceEval.parseError && spaceEval.operatorCorridorM !== null ? (
              <p className="mt-1 text-xs text-red-800">
                Coridor operator estimat:{' '}
                {formatScaled(Math.round(spaceEval.operatorCorridorM * 10), 1, { min: 1, max: 1 })}{' '}
                m (recomandat ≥ 0,9 m pentru schimbul paleților și amplasarea separatoarelor).
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div ref={containerRef} className="min-w-0 w-full">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          aria-label="Previzualizare interactivă celulă de paletizare UR20"
          className="block w-full max-w-full rounded-lg border border-slate-200 bg-slate-50"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
            <ShieldAlert size={15} className="shrink-0 text-teal-700" aria-hidden="true" />
            <span>
              2 × Europalet (1,2 m × 0,8 m) • {synced.bucketLabel} ({synced.bucketsPerPallet}{' '}
              găleți/palet)
            </span>
          </span>
          <span>Cicluri: {synced.rateLabel} (~{cycleSecStr} s/găleată)</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" /> Verde: liber
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Galben: reducere
            viteză
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" /> Roșu: oprire
            protecție
          </span>
        </div>
      </div>
    </div>
  );
}
