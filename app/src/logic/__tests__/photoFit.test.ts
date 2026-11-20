import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CellVisualizerSection } from '../../components/CellVisualizerSection';
import { TabPhotoFit } from '../../components/TabPhotoFit';
import { TabVisualizer3D } from '../../components/TabVisualizer3D';
import { syncLineToCellParams } from '../cellGeometry';
import {
  clampPhotoTransform,
  computeContainRect,
  createDemoHallDataUrl,
} from '../photoFit';

describe('photoFit helpers', () => {
  it('createDemoHallDataUrl generates a valid local PNG data URL with zero http URLs', () => {
    const url = createDemoHallDataUrl();
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    expect(url).not.toMatch(/https?:/i);
    const base64 = url.split(',')[1] ?? '';
    expect(base64.length).toBeGreaterThan(100);
  });

  it('clamps overlay transform coordinates, scale, and rotation safely', () => {
    const clamped = clampPhotoTransform({
      xNorm: -1,
      yNorm: 2.5,
      scale: 9,
      rotationDeg: -360,
    });
    expect(clamped).toEqual({
      xNorm: 0.08,
      yNorm: 0.92,
      scale: 4,
      rotationDeg: -180,
    });
  });

  it('computes centered contain rectangle preserving aspect ratio', () => {
    const r = computeContainRect(1280, 720, 640, 480);
    expect(r.w).toBeCloseTo(640, 4);
    expect(r.h).toBeCloseTo(360, 4);
    expect(r.x).toBeCloseTo(0, 4);
    expect(r.y).toBeCloseTo(60, 4);
  });

  it('guards computeContainRect against non-finite and non-positive dimensions', () => {
    const rNaN = computeContainRect(Number.NaN, 720, 640, 480);
    expect(rNaN).toEqual({ x: 0, y: 0, w: 640, h: 480 });

    const rInf = computeContainRect(1280, Number.POSITIVE_INFINITY, 640, 480);
    expect(rInf).toEqual({ x: 0, y: 0, w: 640, h: 480 });

    const rBadBox = computeContainRect(1280, 720, Number.NaN, -100);
    expect(rBadBox).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});

describe('Visualizer & PhotoFit component markup (SSR)', () => {
  it('renders CellVisualizerSection with both tab panels mounted, Tab 1 visible and Tab 2 hidden by default', () => {
    const html = renderToStaticMarkup(
      createElement(CellVisualizerSection, {
        bucketKgRaw: '13',
        ratePerMinRaw: '6,5',
        demoResetTick: 0,
      }),
    );
    expect(html).toContain('Previzualizare 3D / Izometrică');
    expect(html).toContain('Photo-Fit: Suprapunere pe Poza Halei');
    expect(html).toContain('id="tab-btn-3d"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('13 kg (44/palet)');
    expect(html).toContain('6,5 găleți/min');
    expect(html).toContain('Vedere 3D izometrică / Vedere de sus (Plan 2D)');

    // Both panels stay mounted; Tab 1 is visible (no hidden attr) and Tab 2 has hidden attr
    expect(html).toContain('id="tab-panel-3d"');
    expect(html).toContain('id="tab-panel-photofit"');
    expect(html).toMatch(/<div[^>]*id="tab-panel-3d"[^>]*>/);
    const panel3dTag = html.match(/<div[^>]*id="tab-panel-3d"[^>]*>/)?.[0] ?? '';
    const panelPhotoFitTag = html.match(/<div[^>]*id="tab-panel-photofit"[^>]*>/)?.[0] ?? '';
    expect(panel3dTag).not.toMatch(/\bhidden\b/);
    expect(panelPhotoFitTag).toMatch(/\bhidden\b/);
    expect(panel3dTag).not.toMatch(/\b(block|flex|grid)\b/);
    expect(panelPhotoFitTag).not.toMatch(/\b(block|flex|grid)\b/);
    expect(html).toContain('Încarcă poză hală demo');
  });

  it('renders TabVisualizer3D controls and SICK safety zones in Romanian', () => {
    const synced = syncLineToCellParams('5', '8,6');
    const html = renderToStaticMarkup(
      createElement(TabVisualizer3D, {
        synced,
        demoResetTick: 0,
        conveyorDir: 'spate',
        onConveyorDirChange: () => {},
        cellCount: 1,
        onCellCountChange: () => {},
        sickZone: 'free',
        onSickZoneChange: () => {},
      }),
    );
    expect(html).toContain('Lungime spațiu (m)');
    expect(html).toContain('Lățime spațiu (m)');
    expect(html).toContain('Direcție transportor');
    expect(html).toContain('stânga');
    expect(html).toContain('dreapta');
    expect(html).toContain('spate');
    expect(html).toContain('Liber (Verde)');
    expect(html).toContain('Reducere viteză (Galben)');
    expect(html).toContain('Oprire protecție (Roșu)');
    expect(html).toContain('5 kg (100 găleți/palet)');
  });

  it('renders TabPhotoFit controls, file input, sliders Scară & Rotație, and PNG export button', () => {
    const synced = syncLineToCellParams('13', '6,5');
    const html = renderToStaticMarkup(
      createElement(TabPhotoFit, {
        synced,
        conveyorDir: 'spate',
        cellCount: 1,
        sickZone: 'free',
      }),
    );
    expect(html).toContain('Încarcă poză hală demo');
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('Scară');
    expect(html).toContain('Rotație');
    expect(html).toContain('Descarcă schița (.png)');
  });
});

import { computeViewport } from '../cellRenderer';
import {
  calibrateTransform,
  DEFAULT_PHOTO_TRANSFORM as DEFAULT_T,
  maxPlaceReachM,
  overlayBox,
} from '../photoFit';
import { computeUr20ArmPose, type CellConfig } from '../cellGeometry';

const calibCfg: CellConfig = {
  lengthM: 4.5,
  widthM: 3.8,
  conveyorDir: 'spate',
  cellCount: 1,
  viewMode: 'iso',
  sickZone: 'free',
  bucketKg: 13,
  ratePerMin: 6.5,
  isLightBucket: false,
  bucketsPerPallet: 44,
  hasCollision: false,
};

describe('Photo-Fit real-scale calibration', () => {
  it('calibrates real scale from a 1,2 m europallet edge', () => {
    const t = calibrateTransform({ x: 100, y: 200 }, { x: 140, y: 200 }, 1.2, 800, 450, calibCfg, { ...DEFAULT_T });
    expect(t).not.toBeNull();
    const { w, h } = overlayBox(800, 450);
    const vp = computeViewport(w, h, calibCfg, true);
    expect(t!.scale * vp.pxPerMeter).toBeCloseTo(40 / 1.2, 5);
  });

  it('rejects calibration points closer than 10 px', () => {
    expect(calibrateTransform({ x: 5, y: 5 }, { x: 8, y: 9 }, 1.2, 800, 450, calibCfg, { ...DEFAULT_T })).toBeNull();
  });

  it('keeps bucket place points inside UR20 reach (1,75 m)', () => {
    const pose = computeUr20ArmPose(0, 6.5, 'free');
    expect(maxPlaceReachM(calibCfg, pose)).toBeLessThanOrEqual(1.75);
    expect(maxPlaceReachM({ ...calibCfg, cellCount: 2, widthM: 6.5 }, pose)).toBeLessThanOrEqual(1.75);
  });
});

describe('Photo-Fit keeps the cell inside the photo', () => {
  it('caps a too-large real scale so the whole cell fits the frame', () => {
    const t = calibrateTransform({ x: 100, y: 300 }, { x: 400, y: 300 }, 1.2, 800, 450, calibCfg, { ...DEFAULT_T });
    expect(t).not.toBeNull();
    const { w, h } = overlayBox(800, 450);
    expect(t!.scale * w).toBeLessThanOrEqual(800);
    expect(t!.scale * h).toBeLessThanOrEqual(450);
    expect(t!.fittedToFrame).toBe(true);
  });
});