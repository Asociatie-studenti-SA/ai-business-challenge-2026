import { type ChangeEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, Move, RotateCcw, Upload } from 'lucide-react';
import demoHallPhoto from '../assets/demo-factory-hall.jpg';
import {
  computeUr20ArmPose,
  type CellConfig,
  type CellCount,
  type ConveyorDirection,
  type SickZoneState,
  type SyncedLineParams,
} from '../logic/cellGeometry';
import {
  clampPhotoTransform,
  createDemoHallDataUrl,
  DEFAULT_PHOTO_TRANSFORM,
  drawPhotoFitComposite,
  exportPhotoFitPng,
  type PhotoOverlayTransform,
} from '../logic/photoFit';
import { formatScaled } from '../logic/numbers';

export interface TabPhotoFitProps {
  isActive?: boolean;
  synced: SyncedLineParams;
  conveyorDir: ConveyorDirection;
  cellCount: CellCount;
  sickZone: SickZoneState;
}

export function TabPhotoFit({
  isActive = true,
  synced,
  conveyorDir,
  cellCount,
  sickZone,
}: TabPhotoFitProps) {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [photoLabel, setPhotoLabel] = useState<string | null>(null);
  const [transform, setTransform] = useState<PhotoOverlayTransform>({
    ...DEFAULT_PHOTO_TRANSFORM,
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    originXNorm: number;
    originYNorm: number;
  } | null>(null);

  const cellConfig: CellConfig = useMemo(
    () => ({
      lengthM: 4.5,
      widthM: cellCount === 1 ? 3.8 : 6.4,
      conveyorDir,
      cellCount,
      viewMode: 'iso',
      sickZone,
      bucketKg: synced.bucketKg,
      ratePerMin: synced.ratePerMin,
      isLightBucket: synced.isLightBucket,
      bucketsPerPallet: synced.bucketsPerPallet,
      hasCollision: false,
    }),
    [conveyorDir, cellCount, sickZone, synced],
  );

  const staticPose = useMemo(
    () => computeUr20ArmPose(0.45 * (60 / cellConfig.ratePerMin), cellConfig.ratePerMin, 'free'),
    [cellConfig.ratePerMin],
  );

  const loadDataUrl = (dataUrl: string, label: string) => {
    setErrorMsg(null);
    setStatusMsg(null);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setBgImage(img);
        setPhotoLabel(label);
        setTransform({ ...DEFAULT_PHOTO_TRANSFORM });
      } else {
        setErrorMsg('Imaginea selectată nu a putut fi decodată.');
      }
    };
    img.onerror = () => {
      setErrorMsg('Fișierul selectat nu este o imagine validă.');
    };
    img.src = dataUrl;
  };

  const handleLoadDemoHall = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    loadDataUrl(demoHallPhoto || createDemoHallDataUrl(), 'Hală producție alimentară demo (sintetică)');
  };

  // Auto-load the realistic synthetic factory hall on first visit to Tab 2 for instant visual WOW
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (isActive && !bgImage && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      loadDataUrl(demoHallPhoto || createDemoHallDataUrl(), 'Hală producție alimentară demo (sintetică)');
    }
  }, [isActive, bgImage]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setErrorMsg('Selectează un fișier imagine (JPG, PNG, WebP).');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        loadDataUrl(reader.result, file.name);
      } else {
        setErrorMsg('Citirea imaginii a eșuat.');
      }
    };
    reader.onerror = () => setErrorMsg('Citirea fișierului local a eșuat.');
    reader.readAsDataURL(file);
    input.value = '';
  };

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const rect = stage.getBoundingClientRect();
      const cssW = Math.max(260, Math.floor(rect.width || 640));
      const aspect =
        bgImage && bgImage.naturalWidth > 0 && bgImage.naturalHeight > 0
          ? bgImage.naturalHeight / bgImage.naturalWidth
          : 9 / 16;
      const cssH = Math.max(220, Math.min(540, Math.round(cssW * aspect)));
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
      drawPhotoFitComposite(
        ctx,
        cssW,
        cssH,
        bgImage,
        bgImage?.naturalWidth ?? 0,
        bgImage?.naturalHeight ?? 0,
        transform,
        cellConfig,
        staticPose,
      );
      ctx.restore();
    };

    draw();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(draw);
      ro.observe(stage);
    }
    return () => ro?.disconnect();
  }, [isActive, bgImage, transform, cellConfig, staticPose]);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!bgImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originXNorm: transform.xNorm,
      originYNorm: transform.yNorm,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !drag.active || drag.pointerId !== e.pointerId || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxNorm = (e.clientX - drag.startX) / rect.width;
    const dyNorm = (e.clientY - drag.startY) / rect.height;
    setTransform((prev) =>
      clampPhotoTransform({
        ...prev,
        xNorm: drag.originXNorm + dxNorm,
        yNorm: drag.originYNorm + dyNorm,
      }),
    );
  };

  const onPointerEnd = (e: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleExportPng = async () => {
    if (!bgImage) {
      setErrorMsg('Încarcă mai întâi o poză a halei sau apasă „Încarcă poză hală demo”.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setExporting(true);
    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    try {
      const blob = await exportPhotoFitPng(bgImage, transform, cellConfig, staticPose);
      url = URL.createObjectURL(blob);
      anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'schita-ur20-photofit.png';
      anchor.rel = 'noopener';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setStatusMsg('Schița PNG a fost generată și descărcată.');
    } catch {
      setErrorMsg('Exportul PNG nu a putut fi finalizat în acest browser.');
    } finally {
      setExporting(false);
      try {
        anchor?.remove();
      } catch {
        /* ignore */
      }
      if (url !== null) {
        const toRevoke = url;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(toRevoke);
          } catch {
            /* ignore */
          }
        }, 5000);
      }
    }
  };

  const scalePct = Math.round(transform.scale * 100);
  const rotLabel = `${Math.round(transform.rotationDeg)}°`;
  const bucketStr = formatScaled(Math.round(cellConfig.bucketKg * 10), 1, { min: 0, max: 1 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <button
          type="button"
          onClick={handleLoadDemoHall}
          className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-lg border border-teal-700 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100"
        >
          <Camera size={18} className="shrink-0" aria-hidden="true" />
          <span>Încarcă poză hală demo</span>
        </button>

        <div className="min-w-0 flex-none sm:flex-1">
          <label
            htmlFor="hall-photo-upload"
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900"
          >
            <Upload size={16} className="shrink-0 text-teal-700" aria-hidden="true" />
            <span>Încarcă poza halei (camera sau fișier local)</span>
          </label>
          <input
            ref={fileInputRef}
            id="hall-photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 file:mr-3 file:min-h-8 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200"
          />
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={handleExportPng}
          className="inline-flex min-h-11 flex-none items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          <Download size={18} className="shrink-0" aria-hidden="true" />
          <span>{exporting ? 'Se generează PNG...' : 'Descarcă schița (.png)'}</span>
        </button>
      </div>

      {errorMsg ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-600 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
        >
          {errorMsg}
        </p>
      ) : null}

      {statusMsg ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-teal-700 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900"
        >
          {statusMsg}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-900">
            <label htmlFor="photofit-scale">Scară</label>
            <span className="tabular-nums text-teal-800">{scalePct}%</span>
          </div>
          <input
            id="photofit-scale"
            type="range"
            min={0.35}
            max={1.8}
            step={0.05}
            value={transform.scale}
            onChange={(e) =>
              setTransform((prev) =>
                clampPhotoTransform({ ...prev, scale: Number(e.target.value) }),
              )
            }
            className="block min-h-11 w-full cursor-pointer accent-teal-700"
          />
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-900">
            <label htmlFor="photofit-rotation">Rotație</label>
            <span className="tabular-nums text-teal-800">{rotLabel}</span>
          </div>
          <input
            id="photofit-rotation"
            type="range"
            min={-180}
            max={180}
            step={1}
            value={transform.rotationDeg}
            onChange={(e) =>
              setTransform((prev) =>
                clampPhotoTransform({ ...prev, rotationDeg: Number(e.target.value) }),
              )
            }
            className="block min-h-11 w-full cursor-pointer accent-teal-700"
          />
        </div>
      </div>

      <div ref={stageRef} className="relative min-w-0 w-full">
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          aria-label="Zonă interactivă Photo-Fit pentru poziționarea celulei UR20 pe poza halei"
          className="block w-full max-w-full cursor-grab rounded-lg border border-slate-300 bg-slate-900 active:cursor-grabbing"
        />

        {!bgImage ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-sm rounded-lg border border-slate-700 bg-slate-900/85 px-4 py-3 text-slate-100">
              <p className="text-sm font-semibold">
                Încarcă poza halei sau apasă „Încarcă poză hală demo”
              </p>
              <p className="mt-1 text-xs text-slate-300">
                După încărcare, trage celula UR20 cu mouse-ul sau degetul și ajustează Scară și
                Rotație.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <Move size={15} className="shrink-0 text-teal-700" aria-hidden="true" />
          <span>
            {photoLabel
              ? `Fundal activ: ${photoLabel} • Overlay: ${cellCount} ${
                  cellCount === 1 ? 'celulă' : 'celule'
                }, găleată ${bucketStr} kg`
              : 'Trage cu mouse-ul sau degetul pentru poziționarea celulei peste pardoseala halei.'}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setTransform({ ...DEFAULT_PHOTO_TRANSFORM })}
          className="inline-flex min-h-11 flex-none items-center justify-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 sm:self-auto"
        >
          <RotateCcw size={14} className="shrink-0" aria-hidden="true" />
          <span>Resetează poziția</span>
        </button>
      </div>
    </div>
  );
}
