// Pure geometry, form synchronization, deterministic space verification,
// 2-link UR20 arm kinematics, and 3D isometric / 2D plan projection.
// Safe to import in Node (Vitest) and browser environments.

import { LIGHT_BUCKET_MAX_MILLI } from './constants';
import { formatScaled, parseMilli } from './numbers';

export type ConveyorDirection = 'stânga' | 'dreapta' | 'spate';
export type ViewMode = 'iso' | 'plan';
export type SickZoneState = 'free' | 'slow' | 'stop';
export type CellCount = 1 | 2;

export interface SyncedLineParams {
  bucketKg: number;
  bucketMilli: number;
  bucketLabel: string;
  bucketsPerPallet: 100 | 44;
  isLightBucket: boolean;
  bucketSynced: boolean;
  ratePerMin: number;
  rateMilli: number;
  rateLabel: string;
  cycleSeconds: number;
  rateSynced: boolean;
  anySynced: boolean;
  allSynced: boolean;
}

export interface SpaceEvaluation {
  valid: boolean;
  parseError: boolean;
  lengthM: number | null;
  widthM: number | null;
  minLengthM: number;
  minWidthM: number;
  cellCount: CellCount;
  operatorCorridorM: number | null;
  corridorBlocked: boolean;
  lateralClearanceM: number | null;
  sideCollision: boolean;
  warningMessage: string | null;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ViewportTransform {
  centerX: number;
  centerY: number;
  pxPerMeter: number;
}

export interface Ur20ArmPose {
  cycleIndex: number;
  phase: number;
  targetPallet: 1 | 2;
  speedFactor: number;
  holdingBucket: boolean;
  gripperOpen: boolean;
  /** Normalized blend from pick (0) to target pallet (1). */
  swingT: number;
  /** Effector Z height in meters above floor. */
  effectorZ: number;
  /** Conveyor bucket slide phase in [0, 1). */
  conveyorPhase: number;
}

export interface CellConfig {
  lengthM: number;
  widthM: number;
  conveyorDir: ConveyorDirection;
  cellCount: CellCount;
  viewMode: ViewMode;
  sickZone: SickZoneState;
  bucketKg: number;
  ratePerMin: number;
  isLightBucket: boolean;
  bucketsPerPallet: 100 | 44;
  hasCollision: boolean;
}

export interface PalletSpec {
  id: 1 | 2;
  centerX: number;
  centerY: number;
  widthM: number;
  depthM: number;
  label: string;
}

export interface SingleCellGeometry {
  cellIndex: 0 | 1;
  centerX: number;
  pedestal: Point2D;
  pallets: [PalletSpec, PalletSpec];
  conveyorStart: Point2D;
  conveyorEnd: Point2D;
  conveyorWidthM: number;
  pickPoint: Point2D;
  effector: Point3D;
  elbow: Point2D;
  targetPallet: 1 | 2;
  holdingBucket: boolean;
  gripperOpen: boolean;
}

export interface CellSceneGeometry {
  cells: SingleCellGeometry[];
  corridorRect: { xMin: number; xMax: number; yMin: number; yMax: number };
  envelopeRect: { xMin: number; xMax: number; yMin: number; yMax: number };
  roomRect: { xMin: number; xMax: number; yMin: number; yMax: number };
}

export const DEFAULT_SPACE_LENGTH = '4,5';
export const DEFAULT_SPACE_WIDTH = '3,8';

export const MIN_SINGLE_LENGTH_M = 3.8;
export const MIN_SINGLE_WIDTH_M = 3.2;
export const MIN_DUAL_WIDTH_M = 6.0;
export const EUROPALLET_DEPTH_M = 1.2;
export const EUROPALLET_WIDTH_M = 0.8;

const DEFAULT_BUCKET_MILLI = 13_000;
const DEFAULT_RATE_MILLI = 6_500;
const EQUIPMENT_DEPTH_M = 2.9;
const MIN_CORRIDOR_M = 0.9;
const CELL_PITCH_M = 2.8;
const ARM_L1_M = 0.95;
const ARM_L2_M = 0.80;

export const SPACE_WARNING_SINGLE =
  'Spațiu sub minimul orientativ ~3,8 m × 3,2 m — necesită evaluare la fața locului';
export const SPACE_WARNING_DUAL =
  'Spațiu sub minimul orientativ ~3,8 m × 6,0 m pentru 2 celule (față de ~3,8 m × 3,2 m / celulă) — necesită evaluare la fața locului';

/** Parses bucket weight & line cadence from the evaluation form with safe fallbacks. */
export function syncLineToCellParams(
  bucketKgRaw: string,
  ratePerMinRaw: string,
): SyncedLineParams {
  const parsedBucket = parseMilli(bucketKgRaw);
  const bucketValid = parsedBucket !== null && parsedBucket >= 500 && parsedBucket <= 30_000;
  const bucketMilli = bucketValid ? parsedBucket : DEFAULT_BUCKET_MILLI;
  const bucketKg = bucketMilli / 1000;
  const isLightBucket = bucketMilli <= LIGHT_BUCKET_MAX_MILLI;
  const bucketsPerPallet: 100 | 44 = isLightBucket ? 100 : 44;

  const parsedRate = parseMilli(ratePerMinRaw);
  const rateValid = parsedRate !== null && parsedRate >= 100 && parsedRate <= 20_000;
  const rateMilli = rateValid ? parsedRate : DEFAULT_RATE_MILLI;
  const ratePerMin = rateMilli / 1000;
  const cycleSeconds = 60 / ratePerMin;

  return {
    bucketKg,
    bucketMilli,
    bucketLabel: `${formatScaled(bucketMilli, 3, { min: 0, max: 1 })} kg`,
    bucketsPerPallet,
    isLightBucket,
    bucketSynced: bucketValid,
    ratePerMin,
    rateMilli,
    rateLabel: `${formatScaled(rateMilli, 3, { min: 0, max: 1 })} găleți/min`,
    cycleSeconds,
    rateSynced: rateValid,
    anySynced: bucketValid || rateValid,
    allSynced: bucketValid && rateValid,
  };
}

/** Deterministic space check against 1-cell (~3,8 m x 3,2 m) or 2-cell (~3,8 m x 6,0 m) minima. */
export function evaluateCellSpace(
  lengthRaw: string,
  widthRaw: string,
  cellCount: CellCount,
): SpaceEvaluation {
  const minLengthM = MIN_SINGLE_LENGTH_M;
  const minWidthM = cellCount === 1 ? MIN_SINGLE_WIDTH_M : MIN_DUAL_WIDTH_M;

  const lMilli = parseMilli(lengthRaw);
  const wMilli = parseMilli(widthRaw);
  const lengthM = lMilli !== null && lMilli > 0 && lMilli <= 50_000 ? lMilli / 1000 : null;
  const widthM = wMilli !== null && wMilli > 0 && wMilli <= 50_000 ? wMilli / 1000 : null;

  if (lengthM === null || widthM === null) {
    return {
      valid: false,
      parseError: true,
      lengthM,
      widthM,
      minLengthM,
      minWidthM,
      cellCount,
      operatorCorridorM: null,
      corridorBlocked: true,
      lateralClearanceM: null,
      sideCollision: true,
      warningMessage: 'Introdu dimensiuni pozitive în metri (ex. 4,5 × 3,8 m) pentru verificare.',
    };
  }

  const operatorCorridorM = Number((lengthM - EQUIPMENT_DEPTH_M).toFixed(3));
  const corridorBlocked = operatorCorridorM < MIN_CORRIDOR_M;
  const equipmentWidthM = cellCount === 1 ? 2.4 : 5.2;
  const lateralClearanceM = Number(((widthM - equipmentWidthM) / 2).toFixed(3));
  const sideCollision = lateralClearanceM < 0.4;
  const fits = lengthM >= minLengthM && widthM >= minWidthM;
  const valid = fits && !corridorBlocked && !sideCollision;

  return {
    valid,
    parseError: false,
    lengthM,
    widthM,
    minLengthM,
    minWidthM,
    cellCount,
    operatorCorridorM,
    corridorBlocked,
    lateralClearanceM,
    sideCollision,
    warningMessage: valid ? null : cellCount === 1 ? SPACE_WARNING_SINGLE : SPACE_WARNING_DUAL,
  };
}

export function sickSpeedFactor(sickZone: SickZoneState): number {
  if (sickZone === 'free') return 1;
  if (sickZone === 'slow') return 0.4;
  return 0;
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Computes UR20 pick-and-place kinematics alternating Pallet 1 and Pallet 2. */
export function computeUr20ArmPose(
  timeSec: number,
  ratePerMin: number,
  sickZone: SickZoneState,
): Ur20ArmPose {
  const safeRate = Math.max(0.1, Number.isFinite(ratePerMin) ? ratePerMin : 6.5);
  const safeTime = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  const speedFactor = sickSpeedFactor(sickZone);
  const cycleSec = 60 / safeRate;
  const effectiveTime = safeTime * speedFactor;
  const totalCycles = effectiveTime / cycleSec;
  const cycleIndex = Math.floor(totalCycles);
  const phase = totalCycles - cycleIndex;
  const targetPallet: 1 | 2 = cycleIndex % 2 === 0 ? 1 : 2;

  let holdingBucket = false;
  let gripperOpen = true;
  let swingT = 0;
  let effectorZ = 0.95;

  if (phase < 0.2) {
    const t = phase / 0.2;
    swingT = 0;
    effectorZ = lerp(0.95, 0.56, smoothstep(t));
    holdingBucket = false;
    gripperOpen = true;
  } else if (phase < 0.35) {
    const t = (phase - 0.2) / 0.15;
    swingT = 0;
    effectorZ = lerp(0.56, 1.05, smoothstep(t));
    holdingBucket = true;
    gripperOpen = false;
  } else if (phase < 0.65) {
    const t = (phase - 0.35) / 0.3;
    swingT = smoothstep(t);
    effectorZ = 1.05 + 0.14 * Math.sin(Math.PI * t);
    holdingBucket = true;
    gripperOpen = false;
  } else if (phase < 0.8) {
    const t = (phase - 0.65) / 0.15;
    swingT = 1;
    effectorZ = lerp(1.05, 0.62, smoothstep(t));
    holdingBucket = t < 0.65;
    gripperOpen = t >= 0.65;
  } else {
    const t = (phase - 0.8) / 0.2;
    swingT = 1 - smoothstep(t);
    effectorZ = lerp(0.62, 0.95, smoothstep(t));
    holdingBucket = false;
    gripperOpen = true;
  }

  return {
    cycleIndex,
    phase,
    targetPallet,
    speedFactor,
    holdingBucket,
    gripperOpen,
    swingT,
    effectorZ,
    conveyorPhase: (effectiveTime / Math.max(1.2, cycleSec)) % 1,
  };
}

/** 2-link planar inverse kinematics for a natural elbow bend within UR20 reach. */
export function solveTwoLinkIK(
  base: Point2D,
  target: Point2D,
  flipBend: boolean,
): Point2D {
  const dx = target.x - base.x;
  const dy = target.y - base.y;
  const distRaw = Math.hypot(dx, dy);
  const maxReach = ARM_L1_M + ARM_L2_M - 0.04;
  const minReach = Math.abs(ARM_L1_M - ARM_L2_M) + 0.06;
  const dist = Math.max(minReach, Math.min(maxReach, distRaw));

  const baseAngle = Math.atan2(dy, dx);
  const cosA = (ARM_L1_M * ARM_L1_M + dist * dist - ARM_L2_M * ARM_L2_M) / (2 * ARM_L1_M * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosA));
  const offsetAngle = Math.acos(clampedCos) * (flipBend ? -1 : 1);
  const shoulderAngle = baseAngle + offsetAngle;

  return {
    x: base.x + ARM_L1_M * Math.cos(shoulderAngle),
    y: base.y + ARM_L1_M * Math.sin(shoulderAngle),
  };
}

/** Builds meter-space coordinates for 1 or 2 UR20 cells, conveyor, pallets, and corridor. */
export function buildCellSceneGeometry(
  config: CellConfig,
  pose: Ur20ArmPose,
): CellSceneGeometry {
  const cellCenters =
    config.cellCount === 1 ? [0] : [-CELL_PITCH_M / 2, CELL_PITCH_M / 2];

  const cells: SingleCellGeometry[] = cellCenters.map((cx, idx) => {
    const pedestal: Point2D = { x: cx, y: -0.55 };
    const pallet1: PalletSpec = {
      id: 1,
      centerX: cx - 0.58,
      centerY: 0.35,
      widthM: EUROPALLET_WIDTH_M,
      depthM: EUROPALLET_DEPTH_M,
      label: 'Palet 1 (1,2×0,8 m)',
    };
    const pallet2: PalletSpec = {
      id: 2,
      centerX: cx + 0.58,
      centerY: 0.35,
      widthM: EUROPALLET_WIDTH_M,
      depthM: EUROPALLET_DEPTH_M,
      label: 'Palet 2 (1,2×0,8 m)',
    };

    let conveyorStart: Point2D;
    let conveyorEnd: Point2D;
    let pickPoint: Point2D;

    if (config.conveyorDir === 'spate') {
      conveyorStart = { x: cx, y: -1.85 };
      conveyorEnd = { x: cx, y: -1.02 };
      pickPoint = { x: cx, y: -1.14 };
    } else if (config.conveyorDir === 'stânga') {
      conveyorStart = { x: cx - 1.48, y: -0.88 };
      conveyorEnd = { x: cx - 0.62, y: -0.88 };
      pickPoint = { x: cx - 0.74, y: -0.88 };
    } else {
      conveyorStart = { x: cx + 1.48, y: -0.88 };
      conveyorEnd = { x: cx + 0.62, y: -0.88 };
      pickPoint = { x: cx + 0.74, y: -0.88 };
    }

    const activePallet = pose.targetPallet === 1 ? pallet1 : pallet2;
    const placePoint: Point2D = {
      x: activePallet.centerX,
      y: activePallet.centerY - 0.08,
    };

    // Interpolate planar effector path from conveyor pickPoint to active pallet placePoint.
    const effX = lerp(pickPoint.x, placePoint.x, pose.swingT);
    const effY = lerp(pickPoint.y, placePoint.y, pose.swingT);
    const effector: Point3D = { x: effX, y: effY, z: pose.effectorZ };
    const elbow = solveTwoLinkIK(pedestal, { x: effX, y: effY }, pose.targetPallet === 2);

    return {
      cellIndex: idx as 0 | 1,
      centerX: cx,
      pedestal,
      pallets: [pallet1, pallet2],
      conveyorStart,
      conveyorEnd,
      conveyorWidthM: 0.44,
      pickPoint,
      effector,
      elbow,
      targetPallet: pose.targetPallet,
      holdingBucket: pose.holdingBucket,
      gripperOpen: pose.gripperOpen,
    };
  });

  const minWidthM = config.cellCount === 1 ? MIN_SINGLE_WIDTH_M : MIN_DUAL_WIDTH_M;
  const halfRoomW = config.widthM / 2;
  const halfRoomL = config.lengthM / 2;

  return {
    cells,
    corridorRect: {
      xMin: -minWidthM / 2 + 0.15,
      xMax: minWidthM / 2 - 0.15,
      yMin: 1.04,
      yMax: 1.88,
    },
    envelopeRect: {
      xMin: -minWidthM / 2,
      xMax: minWidthM / 2,
      yMin: -1.9,
      yMax: 1.9,
    },
    roomRect: {
      xMin: -halfRoomW,
      xMax: halfRoomW,
      yMin: -halfRoomL,
      yMax: halfRoomL,
    },
  };
}

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

/** Projects 3D meter coordinates onto 2D canvas pixels for isometric or top-down plan view. */
export function projectPoint(
  p: Point3D,
  viewMode: ViewMode,
  vp: ViewportTransform,
): Point2D {
  if (viewMode === 'plan') {
    return {
      x: vp.centerX + p.x * vp.pxPerMeter,
      y: vp.centerY + p.y * vp.pxPerMeter,
    };
  }
  return {
    x: vp.centerX + (p.x - p.y) * COS30 * vp.pxPerMeter,
    y: vp.centerY + (p.x + p.y) * SIN30 * vp.pxPerMeter - p.z * vp.pxPerMeter,
  };
}
