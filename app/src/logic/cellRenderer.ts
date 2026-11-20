// Unified Canvas 2D renderer for PaletCheck UR20:
// supports 2.5D Isometric ('iso'), 2D Top-Down Plan ('plan'), and transparent Photo-Fit overlay.
// Pure Canvas 2D vector drawing with industrial detailing & topmost non-overlapping HUD annotations.

import {
  buildCellSceneGeometry,
  projectPoint,
  type CellConfig,
  type CellSceneGeometry,
  type PalletSpec,
  type Point2D,
  type Point3D,
  type SickZoneState,
  type SingleCellGeometry,
  type SpaceEvaluation,
  type Ur20ArmPose,
  type ViewMode,
  type ViewportTransform,
} from './cellGeometry';
import { formatScaled } from './numbers';

export interface RenderCellOptions {
  transparentBg: boolean;
  spaceEval?: SpaceEvaluation;
  showDimensions?: boolean;
}

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

interface PendingLabel {
  x: number;
  y: number;
  text: string;
  bg: string;
  fg: string;
  border?: string;
  fontSize?: number;
  anchorX?: number;
  anchorY?: number;
}

function computeViewport(
  width: number,
  height: number,
  config: CellConfig,
  transparentBg: boolean,
): ViewportTransform {
  const spanW = Math.max(config.widthM, config.cellCount === 2 ? 6.6 : 4.2) + 1.3;
  const spanL = Math.max(config.lengthM, 4.2) + 1.4;

  if (config.viewMode === 'plan') {
    const px = Math.min((width * 0.82) / spanW, (height * 0.76) / spanL);
    return {
      centerX: width / 2,
      centerY: height * (transparentBg ? 0.5 : 0.48),
      pxPerMeter: Math.max(18, px),
    };
  }

  const isoW = (spanW + spanL) * 0.866;
  const isoH = (spanW + spanL) * 0.5 + 1.8;
  const px = Math.min((width * 0.88) / isoW, (height * 0.78) / isoH);
  return {
    centerX: width / 2,
    centerY: height * (transparentBg ? 0.54 : 0.49),
    pxPerMeter: Math.max(16, px),
  };
}

function p(
  x: number,
  y: number,
  z: number,
  mode: ViewMode,
  vp: ViewportTransform,
): Point2D {
  return projectPoint({ x, y, z }, mode, vp);
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  fill?: string,
  stroke?: string,
  lineWidth = 1.4,
  dash?: number[],
) {
  if (pts.length === 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloorShadow(
  ctx: CanvasRenderingContext2D,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  mode: ViewMode,
  vp: ViewportTransform,
  alpha = 0.14,
) {
  const pad = 0.06;
  const pts = [
    p(xMin - pad, yMin - pad, 0.002, mode, vp),
    p(xMax + pad, yMin - pad, 0.002, mode, vp),
    p(xMax + pad, yMax + pad, 0.002, mode, vp),
    p(xMin - pad, yMax + pad, 0.002, mode, vp),
  ];
  drawPolygon(ctx, pts, `rgba(15, 23, 42, ${alpha})`);
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  zBottom: number,
  zTop: number,
  mode: ViewMode,
  vp: ViewportTransform,
  colors: { top: string; left: string; right: string; stroke?: string },
) {
  const stroke = colors.stroke ?? '#334155';
  if (mode === 'plan') {
    const pts = [
      p(xMin, yMin, zTop, mode, vp),
      p(xMax, yMin, zTop, mode, vp),
      p(xMax, yMax, zTop, mode, vp),
      p(xMin, yMax, zTop, mode, vp),
    ];
    drawPolygon(ctx, pts, colors.top, stroke, 1.1);
    return;
  }

  const b01 = p(xMin, yMax, zBottom, mode, vp);
  const b11 = p(xMax, yMax, zBottom, mode, vp);
  const b10 = p(xMax, yMin, zBottom, mode, vp);

  const t00 = p(xMin, yMin, zTop, mode, vp);
  const t10 = p(xMax, yMin, zTop, mode, vp);
  const t11 = p(xMax, yMax, zTop, mode, vp);
  const t01 = p(xMin, yMax, zTop, mode, vp);

  drawPolygon(ctx, [b01, b11, t11, t01], colors.left, stroke, 0.95);
  drawPolygon(ctx, [b11, b10, t10, t11], colors.right, stroke, 0.95);
  drawPolygon(ctx, [t00, t10, t11, t01], colors.top, stroke, 1.05);
}

function drawCylinder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radiusM: number,
  zBottom: number,
  zTop: number,
  mode: ViewMode,
  vp: ViewportTransform,
  colors: { top: string; sideLight: string; sideDark: string; stroke: string },
) {
  if (mode === 'plan') {
    const c = p(cx, cy, zTop, mode, vp);
    const r = Math.max(2.5, radiusM * vp.pxPerMeter);
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = colors.top;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
    return;
  }

  const segs = 16;
  const topPts: Point2D[] = [];
  const botPts: Point2D[] = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const x = cx + Math.cos(a) * radiusM;
    const y = cy + Math.sin(a) * radiusM;
    topPts.push(p(x, y, zTop, mode, vp));
    botPts.push(p(x, y, zBottom, mode, vp));
  }

  let minIdx = 0;
  let maxIdx = 0;
  for (let i = 1; i < segs; i++) {
    if (botPts[i].x < botPts[minIdx].x) minIdx = i;
    if (botPts[i].x > botPts[maxIdx].x) maxIdx = i;
  }

  const frontBot: Point2D[] = [];
  const frontTop: Point2D[] = [];
  for (let i = 0; i <= segs; i++) {
    const idx = (minIdx + i) % segs;
    frontBot.push(botPts[idx]);
    frontTop.unshift(topPts[idx]);
    if (idx === maxIdx && i > 0) break;
  }

  const sideGrad = ctx.createLinearGradient(botPts[minIdx].x, 0, botPts[maxIdx].x, 0);
  sideGrad.addColorStop(0, colors.sideLight);
  sideGrad.addColorStop(0.55, '#ffffff');
  sideGrad.addColorStop(1, colors.sideDark);

  const hull =
    frontBot.length >= 2 && frontBot[1].y >= botPts[minIdx].y
      ? [...frontBot, ...frontTop]
      : [botPts[minIdx], botPts[maxIdx], topPts[maxIdx], topPts[minIdx]];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(hull[0].x, hull[0].y);
  for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
  ctx.closePath();
  ctx.fillStyle = sideGrad;
  ctx.fill();
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();

  drawPolygon(ctx, topPts, colors.top, colors.stroke, 1.0);
}

function drawCadBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: ViewMode,
  vp: ViewportTransform,
) {
  ctx.save();
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#f8fafc');
  bg.addColorStop(1, '#eef2f6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1;
  const step = 0.5;
  for (let x = -5; x <= 5; x += step) {
    const a = p(x, -5, 0, mode, vp);
    const b = p(x, 5, 0, mode, vp);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let y = -5; y <= 5; y += step) {
    const a = p(-5, y, 0, mode, vp);
    const b = p(5, y, 0, mode, vp);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoomBoundary(
  ctx: CanvasRenderingContext2D,
  scene: CellSceneGeometry,
  config: CellConfig,
  mode: ViewMode,
  vp: ViewportTransform,
  transparentBg: boolean,
) {
  const { roomRect, envelopeRect } = scene;
  const rPts = [
    p(roomRect.xMin, roomRect.yMin, 0, mode, vp),
    p(roomRect.xMax, roomRect.yMin, 0, mode, vp),
    p(roomRect.xMax, roomRect.yMax, 0, mode, vp),
    p(roomRect.xMin, roomRect.yMax, 0, mode, vp),
  ];

  if (transparentBg) {
    // Subtle grounding shadow + clean perimeter tape on real factory photo
    drawFloorShadow(ctx, envelopeRect.xMin, envelopeRect.xMax, envelopeRect.yMin, envelopeRect.yMax, mode, vp, 0.22);
    drawPolygon(
      ctx,
      rPts,
      'rgba(15, 118, 110, 0.09)',
      config.hasCollision ? '#dc2626' : '#0f766e',
      2,
      [7, 4],
    );
    return;
  }

  // Subtle floor slab shadow
  drawFloorShadow(ctx, roomRect.xMin, roomRect.xMax, roomRect.yMin, roomRect.yMax, mode, vp, 0.08);

  if (config.hasCollision) {
    const envPts = [
      p(envelopeRect.xMin, envelopeRect.yMin, 0, mode, vp),
      p(envelopeRect.xMax, envelopeRect.yMin, 0, mode, vp),
      p(envelopeRect.xMax, envelopeRect.yMax, 0, mode, vp),
      p(envelopeRect.xMin, envelopeRect.yMax, 0, mode, vp),
    ];
    drawPolygon(ctx, envPts, 'rgba(220, 38, 38, 0.08)', '#f59e0b', 1.5, [6, 4]);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(envPts[0].x, envPts[0].y);
    for (let i = 1; i < envPts.length; i++) ctx.lineTo(envPts[i].x, envPts[i].y);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.22)';
    ctx.lineWidth = 2;
    const minX = Math.min(...envPts.map((pt) => pt.x));
    const maxX = Math.max(...envPts.map((pt) => pt.x));
    const minY = Math.min(...envPts.map((pt) => pt.y));
    const maxY = Math.max(...envPts.map((pt) => pt.y));
    for (let d = minX - (maxY - minY); d < maxX + (maxY - minY); d += 12) {
      ctx.beginPath();
      ctx.moveTo(d, minY);
      ctx.lineTo(d + (maxY - minY), maxY);
      ctx.stroke();
    }
    ctx.restore();

    drawPolygon(ctx, rPts, 'rgba(220, 38, 38, 0.12)', '#dc2626', 2.4, [7, 5]);
  } else {
    drawPolygon(ctx, rPts, 'rgba(255, 255, 255, 0.85)', '#0f766e', 2.2);
  }
}

function drawSickZones(
  ctx: CanvasRenderingContext2D,
  scene: CellSceneGeometry,
  sickZone: SickZoneState,
  mode: ViewMode,
  vp: ViewportTransform,
  transparentBg: boolean,
) {
  const { envelopeRect } = scene;
  const pad = (m: number) => ({
    xMin: envelopeRect.xMin + m,
    xMax: envelopeRect.xMax - m,
    yMin: envelopeRect.yMin + m,
    yMax: envelopeRect.yMax - m,
  });

  const greenRect = {
    xMin: envelopeRect.xMin - 0.14,
    xMax: envelopeRect.xMax + 0.14,
    yMin: envelopeRect.yMin - 0.14,
    yMax: envelopeRect.yMax + 0.26,
  };
  const yellowRect = {
    xMin: envelopeRect.xMin + 0.08,
    xMax: envelopeRect.xMax - 0.08,
    yMin: envelopeRect.yMin + 0.05,
    yMax: 1.48,
  };
  const redRect = {
    ...pad(0.24),
    yMin: -1.78,
    yMax: 0.98,
  };

  const alphaScale = transparentBg ? 0.65 : 1;

  const drawZoneRect = (
    r: { xMin: number; xMax: number; yMin: number; yMax: number },
    fill: string,
    stroke: string,
    active: boolean,
  ) => {
    const pts = [
      p(r.xMin, r.yMin, 0.004, mode, vp),
      p(r.xMax, r.yMin, 0.004, mode, vp),
      p(r.xMax, r.yMax, 0.004, mode, vp),
      p(r.xMin, r.yMax, 0.004, mode, vp),
    ];
    drawPolygon(ctx, pts, fill, stroke, active ? 2.2 : 1.1, active ? undefined : [5, 4]);
  };

  drawZoneRect(
    greenRect,
    `rgba(22, 163, 74, ${(sickZone === 'free' ? 0.14 : 0.05) * alphaScale})`,
    sickZone === 'free' ? '#15803d' : '#4ade80',
    sickZone === 'free',
  );
  drawZoneRect(
    yellowRect,
    `rgba(217, 119, 6, ${(sickZone === 'slow' ? 0.22 : 0.08) * alphaScale})`,
    sickZone === 'slow' ? '#b45309' : '#f59e0b',
    sickZone === 'slow',
  );
  drawZoneRect(
    redRect,
    `rgba(220, 38, 38, ${(sickZone === 'stop' ? 0.22 : 0.07) * alphaScale})`,
    sickZone === 'stop' ? '#b91c1c' : '#f87171',
    sickZone === 'stop',
  );

  // 3 SICK safety laser scanner housings (yellow body + dark optical window)
  const midX = (envelopeRect.xMin + envelopeRect.xMax) / 2;
  const scanners: Point2D[] = [
    { x: envelopeRect.xMin + 0.18, y: 1.02 },
    { x: envelopeRect.xMax - 0.18, y: 1.02 },
    { x: midX, y: -1.76 },
  ];
  for (const s of scanners) {
    drawFloorShadow(ctx, s.x - 0.08, s.x + 0.08, s.y - 0.08, s.y + 0.08, mode, vp, 0.2);
    drawBox(ctx, s.x - 0.075, s.x + 0.075, s.y - 0.075, s.y + 0.075, 0, 0.14, mode, vp, {
      top: '#facc15',
      left: '#eab308',
      right: '#ca8a04',
      stroke: '#713f12',
    });
    drawBox(ctx, s.x - 0.065, s.x + 0.065, s.y - 0.065, s.y + 0.065, 0.14, 0.21, mode, vp, {
      top: '#1e293b',
      left: '#0f172a',
      right: '#020617',
      stroke: '#020617',
    });
  }
}

function drawCorridorFloor(
  ctx: CanvasRenderingContext2D,
  scene: CellSceneGeometry,
  mode: ViewMode,
  vp: ViewportTransform,
  transparentBg: boolean,
) {
  const { corridorRect } = scene;
  const pts = [
    p(corridorRect.xMin, corridorRect.yMin, 0.008, mode, vp),
    p(corridorRect.xMax, corridorRect.yMin, 0.008, mode, vp),
    p(corridorRect.xMax, corridorRect.yMax, 0.008, mode, vp),
    p(corridorRect.xMin, corridorRect.yMax, 0.008, mode, vp),
  ];
  drawPolygon(
    ctx,
    pts,
    transparentBg ? 'rgba(15, 118, 110, 0.08)' : 'rgba(15, 118, 110, 0.12)',
    '#0f766e',
    1.5,
    [6, 4],
  );
}

/** Stylized industrial operator silhouette drawn AFTER pallets so it never clips behind P1/P2. */
function drawOperatorFigure(
  ctx: CanvasRenderingContext2D,
  scene: CellSceneGeometry,
  sickZone: SickZoneState,
  mode: ViewMode,
  vp: ViewportTransform,
  transparentBg: boolean,
  labels: PendingLabel[],
) {
  if (transparentBg) return; // Keep Photo-Fit clean on top of the real factory photo

  const { envelopeRect } = scene;
  const midX = (envelopeRect.xMin + envelopeRect.xMax) / 2;
  // Position clearly in front corridor (centered) according to SICK zone state
  const opX = midX;
  const opY = sickZone === 'free' ? 1.88 : sickZone === 'slow' ? 1.38 : 0.96;

  const vestColor = sickZone === 'free' ? '#15803d' : sickZone === 'slow' ? '#d97706' : '#dc2626';
  const vestDark = sickZone === 'free' ? '#166534' : sickZone === 'slow' ? '#b45309' : '#991b1b';

  const foot = p(opX, opY, 0, mode, vp);

  if (mode === 'plan') {
    const r = Math.max(6, 0.18 * vp.pxPerMeter);
    ctx.save();
    ctx.beginPath();
    ctx.arc(foot.x, foot.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = `${vestColor}28`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(foot.x, foot.y, r, 0, Math.PI * 2);
    ctx.fillStyle = vestColor;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(foot.x, foot.y, r * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.restore();
  } else {
    // Ground halo ring
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y, 11, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = `${vestColor}33`;
    ctx.fill();
    ctx.strokeStyle = vestColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Boots & dark work pants
    drawCylinder(ctx, opX, opY, 0.09, 0.0, 0.42, mode, vp, {
      top: '#334155',
      sideLight: '#475569',
      sideDark: '#1e293b',
      stroke: '#0f172a',
    });
    // Hi-vis safety vest torso
    drawCylinder(ctx, opX, opY, 0.13, 0.42, 0.84, mode, vp, {
      top: vestColor,
      sideLight: vestColor,
      sideDark: vestDark,
      stroke: '#0f172a',
    });
    // White food-grade hairnet / hard-hat head
    const head = p(opX, opY, 0.98, mode, vp);
    const hr = Math.max(4.5, 0.095 * vp.pxPerMeter);
    ctx.save();
    ctx.beginPath();
    ctx.arc(head.x, head.y, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  labels.push({
    x: foot.x,
    y: foot.y + 15,
    text: 'Operator',
    bg: 'rgba(255, 255, 255, 0.92)',
    fg: vestDark,
    border: vestColor,
    fontSize: 9.5,
  });
}

function drawBucket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  zBottom: number,
  isLight: boolean,
  mode: ViewMode,
  vp: ViewportTransform,
) {
  const radius = isLight ? 0.112 : 0.15;
  const height = isLight ? 0.21 : 0.29;
  const lidColor = isLight ? '#0f766e' : '#d97706';

  drawCylinder(ctx, x, y, radius, zBottom, zBottom + height, mode, vp, {
    top: lidColor,
    sideLight: '#f8fafc',
    sideDark: '#cbd5e1',
    stroke: '#475569',
  });

  // Subtle rim highlight on lid
  if (mode === 'iso') {
    const lidCenter = p(x, y, zBottom + height, mode, vp);
    const rx = radius * vp.pxPerMeter * 0.72;
    const ry = rx * 0.52;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(lidCenter.x, lidCenter.y, Math.max(2, rx), Math.max(1.2, ry), 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawPalletAndBuckets(
  ctx: CanvasRenderingContext2D,
  pallet: PalletSpec,
  isLight: boolean,
  isTarget: boolean,
  mode: ViewMode,
  vp: ViewportTransform,
  labels: PendingLabel[],
) {
  const xMin = pallet.centerX - pallet.widthM / 2;
  const xMax = pallet.centerX + pallet.widthM / 2;
  const yMin = pallet.centerY - pallet.depthM / 2;
  const yMax = pallet.centerY + pallet.depthM / 2;

  // Ground shadow
  drawFloorShadow(ctx, xMin, xMax, yMin, yMax, mode, vp, 0.18);

  // Wooden EUR-pallet bottom stringers & top slatted deck (1.2m x 0.8m x 0.14m)
  drawBox(ctx, xMin, xMax, yMin, yMax, 0, 0.08, mode, vp, {
    top: '#a97b49',
    left: '#9a6e3e',
    right: '#7c552b',
    stroke: '#5c3d1e',
  });
  drawBox(ctx, xMin, xMax, yMin, yMax, 0.08, 0.14, mode, vp, {
    top: isTarget ? '#f6d88b' : '#dfbe89',
    left: '#c89e62',
    right: '#ae8348',
    stroke: isTarget ? '#0f766e' : '#6b4a26',
  });

  // Slatted top deck lines for timber realism
  ctx.save();
  ctx.strokeStyle = 'rgba(92, 61, 30, 0.35)';
  ctx.lineWidth = 1;
  for (let s = 1; s <= 4; s++) {
    const sy = yMin + ((yMax - yMin) * s) / 5;
    const a = p(xMin + 0.02, sy, 0.142, mode, vp);
    const b = p(xMax - 0.02, sy, 0.142, mode, vp);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();

  // Neat stacked buckets on pallet (back-to-front ordering: r=0..rows-1, c=0..cols-1)
  const cols = isLight ? 3 : 2;
  const rows = 3;
  const stepX = (pallet.widthM - 0.26) / Math.max(1, cols - 1);
  const stepY = (pallet.depthM - 0.36) / Math.max(1, rows - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isTarget && r === rows - 1 && c === cols - 1) continue;
      const bx = xMin + 0.13 + c * stepX;
      const by = yMin + 0.18 + r * stepY;
      drawBucket(ctx, bx, by, 0.14, isLight, mode, vp);
    }
  }

  // Queue P1 / P2 badge cleanly at the outer side/front edge of each pallet (zero overlap with buckets or operator!)
  const isP1 = pallet.id === 1;
  const badgePt = isP1
    ? p(xMin - 0.24, pallet.centerY - 0.12, 0.08, mode, vp)
    : p(xMax + 0.24, pallet.centerY + 0.12, 0.08, mode, vp);
  const anchorPt = isP1
    ? p(xMin, pallet.centerY - 0.05, 0.12, mode, vp)
    : p(xMax, pallet.centerY + 0.05, 0.12, mode, vp);
  labels.push({
    x: badgePt.x,
    y: badgePt.y,
    anchorX: anchorPt.x,
    anchorY: anchorPt.y,
    text: `P${pallet.id}`,
    bg: isTarget ? '#0f766e' : 'rgba(255, 255, 255, 0.94)',
    fg: isTarget ? '#ffffff' : '#0f172a',
    border: isTarget ? '#115e59' : '#94a3b8',
    fontSize: 10,
  });
}

function drawConveyor(
  ctx: CanvasRenderingContext2D,
  cell: SingleCellGeometry,
  config: CellConfig,
  pose: Ur20ArmPose,
  mode: ViewMode,
  vp: ViewportTransform,
  transparentBg: boolean,
  labels: PendingLabel[],
) {
  const { conveyorStart, conveyorEnd, conveyorWidthM } = cell;
  const hw = conveyorWidthM / 2;
  const xMin = Math.min(conveyorStart.x, conveyorEnd.x) - (config.conveyorDir === 'spate' ? hw : 0);
  const xMax = Math.max(conveyorStart.x, conveyorEnd.x) + (config.conveyorDir === 'spate' ? hw : 0);
  const yMin = Math.min(conveyorStart.y, conveyorEnd.y) - (config.conveyorDir !== 'spate' ? hw : 0);
  const yMax = Math.max(conveyorStart.y, conveyorEnd.y) + (config.conveyorDir !== 'spate' ? hw : 0);

  // Conveyor floor shadow
  drawFloorShadow(ctx, xMin, xMax, yMin, yMax, mode, vp, 0.15);

  // 4 stainless-steel support legs
  if (mode === 'iso') {
    const legCorners = [
      [xMin + 0.06, yMin + 0.06],
      [xMax - 0.06, yMin + 0.06],
      [xMin + 0.06, yMax - 0.06],
      [xMax - 0.06, yMax - 0.06],
    ];
    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.4;
    for (const [lx, ly] of legCorners) {
      const bot = p(lx, ly, 0, mode, vp);
      const top = p(lx, ly, 0.34, mode, vp);
      ctx.beginPath();
      ctx.moveTo(bot.x, bot.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Stainless steel conveyor chassis
  drawBox(ctx, xMin, xMax, yMin, yMax, 0.32, 0.44, mode, vp, {
    top: '#cbd5e1',
    left: '#94a3b8',
    right: '#64748b',
    stroke: '#334155',
  });

  // Metallic rollers across belt surface
  ctx.save();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
  ctx.lineWidth = 1.2;
  const rollerSteps = 6;
  for (let i = 1; i < rollerSteps; i++) {
    const t = i / rollerSteps;
    if (config.conveyorDir === 'spate') {
      const ry = yMin + (yMax - yMin) * t;
      const a = p(xMin + 0.04, ry, 0.445, mode, vp);
      const b = p(xMax - 0.04, ry, 0.445, mode, vp);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else {
      const rx = xMin + (xMax - xMin) * t;
      const a = p(rx, yMin + 0.04, 0.445, mode, vp);
      const b = p(rx, yMax - 0.04, 0.445, mode, vp);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Moving incoming buckets on conveyor
  for (let i = 0; i < 2; i++) {
    const t = (pose.conveyorPhase + i * 0.5) % 1;
    const bx = conveyorStart.x + (cell.pickPoint.x - conveyorStart.x) * t;
    const by = conveyorStart.y + (cell.pickPoint.y - conveyorStart.y) * t;
    drawBucket(ctx, bx, by, 0.44, config.isLightBucket, mode, vp);
  }

  // Twin-post steel arch + SICK 2D Vision camera mounted cleanly over conveyor
  const vx = (conveyorStart.x + conveyorEnd.x) / 2;
  const vy = (conveyorStart.y + conveyorEnd.y) / 2;
  if (mode === 'iso') {
    const postOffset = hw + 0.03;
    const p1x = config.conveyorDir === 'spate' ? vx - postOffset : vx;
    const p1y = config.conveyorDir === 'spate' ? vy : vy - postOffset;
    const p2x = config.conveyorDir === 'spate' ? vx + postOffset : vx;
    const p2y = config.conveyorDir === 'spate' ? vy : vy + postOffset;
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    const b1 = p(p1x, p1y, 0.44, mode, vp);
    const t1 = p(p1x, p1y, 0.96, mode, vp);
    const b2 = p(p2x, p2y, 0.44, mode, vp);
    const t2 = p(p2x, p2y, 0.96, mode, vp);
    ctx.beginPath();
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.stroke();

    // Subtle SICK 2D blue optical inspection beam cone
    const camPt = p(vx, vy, 0.92, mode, vp);
    const beltL = p(vx - 0.14, vy, 0.45, mode, vp);
    const beltR = p(vx + 0.14, vy, 0.45, mode, vp);
    ctx.fillStyle = 'rgba(2, 132, 199, 0.14)';
    ctx.beginPath();
    ctx.moveTo(camPt.x, camPt.y);
    ctx.lineTo(beltL.x, beltL.y);
    ctx.lineTo(beltR.x, beltR.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawBox(ctx, vx - 0.09, vx + 0.09, vy - 0.09, vy + 0.09, 0.9, 1.04, mode, vp, {
    top: '#0284c7',
    left: '#0369a1',
    right: '#075985',
    stroke: '#0f172a',
  });

  if (!transparentBg) {
    const camLbl = p(vx, vy, 1.24, mode, vp);
    labels.push({
      x: camLbl.x,
      y: camLbl.y,
      text: 'SICK 2D',
      bg: 'rgba(224, 242, 254, 0.94)',
      fg: '#075985',
      border: '#0284c7',
      fontSize: 9,
    });
  }
}

function drawUr20Arm(
  ctx: CanvasRenderingContext2D,
  cell: SingleCellGeometry,
  config: CellConfig,
  mode: ViewMode,
  vp: ViewportTransform,
  labels: PendingLabel[],
) {
  const { pedestal, elbow, effector, holdingBucket, gripperOpen } = cell;

  // Pedestal ground shadow + heavy floor baseplate flange
  drawFloorShadow(ctx, pedestal.x - 0.3, pedestal.x + 0.3, pedestal.y - 0.3, pedestal.y + 0.3, mode, vp, 0.22);
  drawBox(ctx, pedestal.x - 0.28, pedestal.x + 0.28, pedestal.y - 0.28, pedestal.y + 0.28, 0, 0.07, mode, vp, {
    top: '#475569',
    left: '#334155',
    right: '#1e293b',
    stroke: '#0f172a',
  });

  // Main UR20 dark steel riser column
  drawBox(ctx, pedestal.x - 0.2, pedestal.x + 0.2, pedestal.y - 0.2, pedestal.y + 0.2, 0.07, 0.72, mode, vp, {
    top: '#334155',
    left: '#1e293b',
    right: '#0f172a',
    stroke: '#020617',
  });

  // Live SICK status LED ring at top of pedestal
  const ledColor =
    config.sickZone === 'free' ? '#10b981' : config.sickZone === 'slow' ? '#f59e0b' : '#ef4444';
  drawBox(ctx, pedestal.x - 0.205, pedestal.x + 0.205, pedestal.y - 0.205, pedestal.y + 0.205, 0.68, 0.73, mode, vp, {
    top: ledColor,
    left: ledColor,
    right: ledColor,
    stroke: '#0f172a',
  });

  // Cylindrical UR20 turret base
  drawCylinder(ctx, pedestal.x, pedestal.y, 0.14, 0.73, 0.92, mode, vp, {
    top: '#cbd5e1',
    sideLight: '#e2e8f0',
    sideDark: '#64748b',
    stroke: '#0f172a',
  });

  // Articulated arm segments
  const shoulder: Point3D = { x: pedestal.x, y: pedestal.y, z: 0.95 };
  const elbow3D: Point3D = { x: elbow.x, y: elbow.y, z: 1.52 };
  const wrist3D: Point3D = { x: effector.x, y: effector.y, z: effector.z + 0.2 };
  const tip3D: Point3D = { x: effector.x, y: effector.y, z: effector.z };

  const sPt = p(shoulder.x, shoulder.y, shoulder.z, mode, vp);
  const ePt = p(elbow3D.x, elbow3D.y, elbow3D.z, mode, vp);
  const wPt = p(wrist3D.x, wrist3D.y, wrist3D.z, mode, vp);
  const tPt = p(tip3D.x, tip3D.y, tip3D.z, mode, vp);

  const linkWidth = Math.max(5, vp.pxPerMeter * 0.125);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dark metallic outline
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = linkWidth + 3;
  ctx.beginPath();
  ctx.moveTo(sPt.x, sPt.y);
  ctx.lineTo(ePt.x, ePt.y);
  ctx.lineTo(wPt.x, wPt.y);
  ctx.stroke();

  // Brushed aluminum body
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = linkWidth;
  ctx.beginPath();
  ctx.moveTo(sPt.x, sPt.y);
  ctx.lineTo(ePt.x, ePt.y);
  ctx.lineTo(wPt.x, wPt.y);
  ctx.stroke();

  // Top metallic highlight line
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = Math.max(1.5, linkWidth * 0.32);
  ctx.beginPath();
  ctx.moveTo(sPt.x - 1, sPt.y - 1);
  ctx.lineTo(ePt.x - 1, ePt.y - 1);
  ctx.lineTo(wPt.x - 1, wPt.y - 1);
  ctx.stroke();

  // Wrist down to custom pneumatic gripper
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = Math.max(3.5, linkWidth * 0.62);
  ctx.beginPath();
  ctx.moveTo(wPt.x, wPt.y);
  ctx.lineTo(tPt.x, tPt.y);
  ctx.stroke();

  // Signature UR cobalt-blue circular joint caps
  for (const jp of [sPt, ePt, wPt]) {
    const jr = Math.max(4.5, linkWidth * 0.68);
    ctx.beginPath();
    ctx.arc(jp.x, jp.y, jr, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(jp.x - jr * 0.25, jp.y - jr * 0.25, jr * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
  }

  // Pneumatic gripper crossbar + jaws
  const jawSpread = gripperOpen ? 8 : 5;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(tPt.x - jawSpread, tPt.y);
  ctx.lineTo(tPt.x + jawSpread, tPt.y);
  ctx.moveTo(tPt.x - jawSpread, tPt.y);
  ctx.lineTo(tPt.x - jawSpread, tPt.y + 4);
  ctx.moveTo(tPt.x + jawSpread, tPt.y);
  ctx.lineTo(tPt.x + jawSpread, tPt.y + 4);
  ctx.stroke();
  ctx.restore();

  // Carried bucket suspended below gripper
  if (holdingBucket) {
    drawBucket(
      ctx,
      effector.x,
      effector.y,
      Math.max(0.18, effector.z - 0.27),
      config.isLightBucket,
      mode,
      vp,
    );
  }

  // Queue crisp UR20 pedestal label on topmost layer
  const tagPos = p(pedestal.x, pedestal.y, 0.36, mode, vp);
  labels.push({
    x: tagPos.x,
    y: tagPos.y,
    text: 'UR20',
    bg: 'rgba(15, 23, 42, 0.9)',
    fg: '#ffffff',
    border: '#38bdf8',
    fontSize: 9.5,
  });
}

function drawTopmostAnnotations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  labels: PendingLabel[],
  transparentBg: boolean,
) {
  ctx.save();
  for (const lbl of labels) {
    const fs = lbl.fontSize ?? 10;
    ctx.font = `700 ${fs}px ${FONT_STACK}`;
    const tw = ctx.measureText(lbl.text).width;
    const padX = 6;
    const bw = tw + padX * 2;
    const bh = fs + 8;

    // Clamp pill cleanly inside canvas bounds
    const cx = Math.max(bw / 2 + 4, Math.min(width - bw / 2 - 4, lbl.x));
    const cy = Math.max(bh / 2 + 4, Math.min(height - bh / 2 - 4, lbl.y));

    if (lbl.anchorX !== undefined && lbl.anchorY !== undefined) {
      ctx.strokeStyle = lbl.border ?? '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lbl.anchorX, lbl.anchorY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    ctx.fillStyle = lbl.bg;
    ctx.beginPath();
    ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 4);
    ctx.fill();
    if (lbl.border) {
      ctx.strokeStyle = lbl.border;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = lbl.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lbl.text, cx, cy + 0.5);
  }

  // Fixed bottom corridor caption bar in Tab 1 (ZERO overlap with pallets/buckets at every viewport!)
  if (!transparentBg) {
    const caption = 'Coridor acces operator — schimb manual paleți & separatoare';
    ctx.font = `600 10.5px ${FONT_STACK}`;
    const tw = ctx.measureText(caption).width;
    const bw = Math.min(width - 16, tw + 20);
    const bx = (width - bw) / 2;
    const by = height - 28;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, 22, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(caption, width / 2, by + 11, bw - 12);
  }
  ctx.restore();
}

function drawDimensionsOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  config: CellConfig,
  spaceEval: SpaceEvaluation | undefined,
) {
  const lenStr = formatScaled(Math.round(config.lengthM * 10), 1, { min: 1, max: 1 });
  const widStr = formatScaled(Math.round(config.widthM * 10), 1, { min: 1, max: 1 });
  const minW = config.cellCount === 1 ? '3,2' : '6,0';

  ctx.save();
  ctx.font = `600 11px ${FONT_STACK}`;
  const pillText = `Spațiu: ${lenStr} m × ${widStr} m (min ~3,8 m × ${minW} m) • ${config.cellCount} ${
    config.cellCount === 1 ? 'celulă' : 'celule'
  }`;
  const padX = 10;
  const textW = ctx.measureText(pillText).width;
  const boxW = Math.min(width - 16, textW + padX * 2);
  ctx.fillStyle = spaceEval && !spaceEval.valid ? 'rgba(254, 226, 226, 0.96)' : 'rgba(255, 255, 255, 0.94)';
  ctx.strokeStyle = spaceEval && !spaceEval.valid ? '#dc2626' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(8, 8, boxW, 24, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = spaceEval && !spaceEval.valid ? '#991b1b' : '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, 16, 20, boxW - 16);
  ctx.restore();
}

/** Main Canvas 2D painter for Tab 1 live scene & Tab 2 transparent overlay. */
export function renderCellCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: CellConfig,
  pose: Ur20ArmPose,
  options: RenderCellOptions,
): void {
  const vp = computeViewport(width, height, config, options.transparentBg);
  const scene = buildCellSceneGeometry(config, pose);
  const pendingLabels: PendingLabel[] = [];

  if (!options.transparentBg) {
    drawCadBackground(ctx, width, height, config.viewMode, vp);
  }

  // Layer 1: Floor zones & SICK scanners
  drawRoomBoundary(ctx, scene, config, config.viewMode, vp, options.transparentBg);
  drawSickZones(ctx, scene, config.sickZone, config.viewMode, vp, options.transparentBg);
  drawCorridorFloor(ctx, scene, config.viewMode, vp, options.transparentBg);

  // Layer 2: Back-to-front 3D industrial equipment
  for (const cell of scene.cells) {
    drawConveyor(ctx, cell, config, pose, config.viewMode, vp, options.transparentBg, pendingLabels);
    drawPalletAndBuckets(
      ctx,
      cell.pallets[0],
      config.isLightBucket,
      cell.targetPallet === 1,
      config.viewMode,
      vp,
      pendingLabels,
    );
    drawPalletAndBuckets(
      ctx,
      cell.pallets[1],
      config.isLightBucket,
      cell.targetPallet === 2,
      config.viewMode,
      vp,
      pendingLabels,
    );
    drawUr20Arm(ctx, cell, config, config.viewMode, vp, pendingLabels);
  }

  // Layer 3: Stylized operator in front corridor (properly in front of pallets!)
  drawOperatorFigure(ctx, scene, config.sickZone, config.viewMode, vp, options.transparentBg, pendingLabels);

  // Layer 4: Topmost non-overlapping annotations & HUD
  drawTopmostAnnotations(ctx, width, height, pendingLabels, options.transparentBg);

  if (options.showDimensions && !options.transparentBg) {
    drawDimensionsOverlay(ctx, width, config, options.spaceEval);
  }
}
