import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CellVisualizerSection } from '../../components/CellVisualizerSection';
import { TabVisualizer3D } from '../../components/TabVisualizer3D';
import { syncLineToCellParams } from '../cellGeometry';

describe('Visualizer component markup (SSR)', () => {
  it('renders CellVisualizerSection synced with form inputs and 3D/2D view toggle', () => {
    const html = renderToStaticMarkup(
      createElement(CellVisualizerSection, {
        bucketKgRaw: '13',
        ratePerMinRaw: '6,5',
        demoResetTick: 0,
      }),
    );
    expect(html).toContain('Previzualizare 3D / Plan 2D celulă UR20');
    expect(html).toContain('13 kg (44/palet)');
    expect(html).toContain('6,5 găleți/min');
    expect(html).toContain('Vedere 3D izometrică / Vedere de sus (Plan 2D)');
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
});
