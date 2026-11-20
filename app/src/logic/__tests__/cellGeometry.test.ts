import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  buildCellSceneGeometry,
  computeUr20ArmPose,
  evaluateCellSpace,
  projectPoint,
  SPACE_WARNING_SINGLE,
  syncLineToCellParams,
} from '../cellGeometry';
import { DEMO_ERRORS, DEMO_NORMAL } from '../constants';

describe('evaluateCellSpace', () => {
  it('accepts default 4,5 x 3,8 m and exact boundary 3.8 x 3.2 m for 1 cell', () => {
    const def = evaluateCellSpace('4,5', '3,8', 1);
    expect(def.valid).toBe(true);
    expect(def.parseError).toBe(false);
    expect(def.warningMessage).toBeNull();
    expect(def.operatorCorridorM).toBeCloseTo(1.6, 2);

    const exact = evaluateCellSpace('3.8', '3.2', 1);
    expect(exact.valid).toBe(true);
    expect(exact.corridorBlocked).toBe(false);
    expect(exact.sideCollision).toBe(false);
  });

  it('rejects undersized 2,5 x 2,5 m space with exact verbatim Romanian warning', () => {
    const res = evaluateCellSpace('2,5', '2,5', 1);
    expect(res.valid).toBe(false);
    expect(res.parseError).toBe(false);
    expect(res.corridorBlocked).toBe(true);
    expect(res.warningMessage).toBe(
      'Spațiu sub minimul orientativ ~3,8 m × 3,2 m — necesită evaluare la fața locului',
    );
    expect(res.warningMessage).toBe(SPACE_WARNING_SINGLE);
  });

  it('scales minimum footprint for 2 PURATOS cells (~3,8 m x 6,0 m)', () => {
    const singleOkTooSmallForTwo = evaluateCellSpace('4,5', '3,8', 2);
    expect(singleOkTooSmallForTwo.valid).toBe(false);
    expect(singleOkTooSmallForTwo.minWidthM).toBe(6.0);
    expect(singleOkTooSmallForTwo.warningMessage).toContain('~3,8 m × 3,2 m / celulă');

    const dualOk = evaluateCellSpace('3,8', '6,0', 2);
    expect(dualOk.valid).toBe(true);
    expect(dualOk.warningMessage).toBeNull();
  });

  it('handles empty or invalid dimensions safely without throwing', () => {
    const empty = evaluateCellSpace('', '3,8', 1);
    expect(empty.valid).toBe(false);
    expect(empty.parseError).toBe(true);

    const bad = evaluateCellSpace('abc', '-2', 1);
    expect(bad.valid).toBe(false);
    expect(bad.parseError).toBe(true);
  });

  it('property: any positive space below minimum width or length never validates as valid', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.5, max: 3.75, noNaN: true }),
        fc.double({ min: 0.5, max: 10, noNaN: true }),
        fc.constantFrom<1 | 2>(1, 2),
        (l, w, cells) => {
          const ev = evaluateCellSpace(l.toFixed(2), w.toFixed(2), cells);
          expect(ev.valid).toBe(false);
          expect(ev.warningMessage).not.toBeNull();
        },
      ),
    );
  });
});

describe('syncLineToCellParams', () => {
  it('syncs DEMO_NORMAL (13 kg, 6,5/min, 44 buckets/pallet)', () => {
    const synced = syncLineToCellParams(DEMO_NORMAL.bucketKg, DEMO_NORMAL.ratePerMin);
    expect(synced.bucketKg).toBe(13);
    expect(synced.bucketsPerPallet).toBe(44);
    expect(synced.isLightBucket).toBe(false);
    expect(synced.ratePerMin).toBe(6.5);
    expect(synced.allSynced).toBe(true);
  });

  it('switches to 100 buckets/pallet for 5 kg light buckets', () => {
    const synced = syncLineToCellParams('5', '8,6');
    expect(synced.bucketKg).toBe(5);
    expect(synced.bucketsPerPallet).toBe(100);
    expect(synced.isLightBucket).toBe(true);
    expect(synced.ratePerMin).toBe(8.6);
    expect(synced.allSynced).toBe(true);
  });

  it('falls back safely when DEMO_ERRORS clears ratePerMin', () => {
    const synced = syncLineToCellParams(DEMO_ERRORS.bucketKg, DEMO_ERRORS.ratePerMin);
    expect(synced.bucketSynced).toBe(true);
    expect(synced.bucketKg).toBe(18);
    expect(synced.rateSynced).toBe(false);
    expect(synced.ratePerMin).toBe(6.5);
    expect(synced.allSynced).toBe(false);
  });
});

describe('computeUr20ArmPose & buildCellSceneGeometry', () => {
  it('alternates between pallet 1 and pallet 2 across consecutive cycles', () => {
    // At 6.0/min, cycle is 10s
    const c0 = computeUr20ArmPose(5, 6, 'free');
    const c1 = computeUr20ArmPose(15, 6, 'free');
    expect(c0.targetPallet).toBe(1);
    expect(c1.targetPallet).toBe(2);
  });

  it('slows down in SICK slow zone and freezes in SICK stop zone', () => {
    const slow = computeUr20ArmPose(5, 6, 'slow');
    expect(slow.speedFactor).toBe(0.4);
    expect(slow.phase).toBeCloseTo(0.2, 4);

    const stopA = computeUr20ArmPose(2, 6, 'stop');
    const stopB = computeUr20ArmPose(18, 6, 'stop');
    expect(stopA.speedFactor).toBe(0);
    expect(stopA.phase).toBe(0);
    expect(stopB.phase).toBe(0);
  });

  it('guards non-finite timeSec inputs safely across all SICK zones', () => {
    for (const badTime of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -5]) {
      for (const zone of ['free', 'slow', 'stop'] as const) {
        const pose = computeUr20ArmPose(badTime, 6.5, zone);
        expect(Number.isFinite(pose.cycleIndex)).toBe(true);
        expect(Number.isFinite(pose.phase)).toBe(true);
        expect(Number.isFinite(pose.swingT)).toBe(true);
        expect(Number.isFinite(pose.effectorZ)).toBe(true);
        expect(Number.isFinite(pose.conveyorPhase)).toBe(true);
        expect(pose.cycleIndex).toBe(0);
        expect(pose.phase).toBe(0);
      }
    }
  });

  it('builds 1 or 2 cells with 1.2 x 0.8 m Europallets and directional conveyors', () => {
    const pose = computeUr20ArmPose(4, 6.5, 'free');
    const sceneLeft = buildCellSceneGeometry(
      {
        lengthM: 4.5,
        widthM: 6.4,
        conveyorDir: 'stânga',
        cellCount: 2,
        viewMode: 'iso',
        sickZone: 'free',
        bucketKg: 13,
        ratePerMin: 6.5,
        isLightBucket: false,
        bucketsPerPallet: 44,
        hasCollision: false,
      },
      pose,
    );
    expect(sceneLeft.cells).toHaveLength(2);
    expect(sceneLeft.cells[0].pallets[0].depthM).toBe(1.2);
    expect(sceneLeft.cells[0].pallets[0].widthM).toBe(0.8);
    expect(sceneLeft.cells[0].conveyorStart.x).toBeLessThan(sceneLeft.cells[0].pedestal.x);

    const sceneRight = buildCellSceneGeometry(
      {
        lengthM: 4.5,
        widthM: 3.8,
        conveyorDir: 'dreapta',
        cellCount: 1,
        viewMode: 'plan',
        sickZone: 'free',
        bucketKg: 5,
        ratePerMin: 8.6,
        isLightBucket: true,
        bucketsPerPallet: 100,
        hasCollision: false,
      },
      pose,
    );
    expect(sceneRight.cells).toHaveLength(1);
    expect(sceneRight.cells[0].conveyorStart.x).toBeGreaterThan(sceneRight.cells[0].pedestal.x);
  });

  it('projects finite screen coordinates in both iso and plan modes', () => {
    const vp = { centerX: 320, centerY: 190, pxPerMeter: 50 };
    const pIso = projectPoint({ x: 1.2, y: -0.8, z: 0.7 }, 'iso', vp);
    const pPlan = projectPoint({ x: 1.2, y: -0.8, z: 0.7 }, 'plan', vp);
    expect(Number.isFinite(pIso.x) && Number.isFinite(pIso.y)).toBe(true);
    expect(pPlan.x).toBeCloseTo(380, 4);
    expect(pPlan.y).toBeCloseTo(150, 4);
  });
});
