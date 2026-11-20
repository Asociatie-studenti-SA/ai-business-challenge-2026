// Pure Photo-Fit helpers: local synthetic industrial hall image generator,
// overlay transform clamping, aspect-ratio placement, and PNG composite export.
// Zero external network calls or external URLs.

import {
  buildCellSceneGeometry,
  computeUr20ArmPose,
  projectPoint,
  type CellConfig,
  type Ur20ArmPose,
} from './cellGeometry';
import { computeViewport, renderCellCanvas } from './cellRenderer';
import { formatScaled } from './numbers';

export interface PhotoOverlayTransform {
  /** Normalized horizontal center in [0.08, 0.92]. */
  xNorm: number;
  /** Normalized vertical center in [0.12, 0.92]. */
  yNorm: number;
  /** Scale multiplier in [0.35, 1.8]. */
  scale: number;
  /** Rotation angle in degrees [-180, 180]. */
  rotationDeg: number;
}

export const DEFAULT_PHOTO_TRANSFORM: Readonly<PhotoOverlayTransform> = Object.freeze({
  xNorm: 0.49,
  yNorm: 0.72,
  scale: 1.28,
  rotationDeg: 0,
});

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function clampPhotoTransform(t: PhotoOverlayTransform): PhotoOverlayTransform {
  return {
    xNorm: clamp(t.xNorm, 0.08, 0.92),
    yNorm: clamp(t.yNorm, 0.12, 0.92),
    scale: clamp(t.scale, 0.15, 4),
    rotationDeg: clamp(t.rotationDeg, -180, 180),
  };
}

export function computeContainRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
): Rect {
  if (
    !Number.isFinite(imgW) ||
    !Number.isFinite(imgH) ||
    !Number.isFinite(boxW) ||
    !Number.isFinite(boxH) ||
    imgW <= 0 ||
    imgH <= 0 ||
    boxW <= 0 ||
    boxH <= 0
  ) {
    return {
      x: 0,
      y: 0,
      w: Number.isFinite(boxW) ? Math.max(0, boxW) : 0,
      h: Number.isFinite(boxH) ? Math.max(0, boxH) : 0,
    };
  }
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return {
    x: (boxW - w) / 2,
    y: (boxH - h) / 2,
    w,
    h,
  };
}

/** Draws a clean synthetic industrial food-grade production hall bay on Canvas 2D. */
export function renderDemoHallToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const horizonY = height * 0.42;
  const vanishX = width * 0.5;

  // Ceiling & upper walls
  const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  wallGrad.addColorStop(0, '#cbd5e1');
  wallGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, width, horizonY);

  // Perspective roof trusses & LED skylights
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 6; i++) {
    const xTop = (i / 6) * width;
    ctx.beginPath();
    ctx.moveTo(xTop, 0);
    ctx.lineTo(vanishX + (xTop - vanishX) * 0.34, horizonY);
    ctx.stroke();
  }
  for (let row = 0; row < 3; row++) {
    const t = 0.25 + row * 0.26;
    const y = horizonY * t;
    const w = width * (0.28 + t * 0.45);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(vanishX - w * 0.42, y - 6, w * 0.22, 10);
    ctx.fillRect(vanishX + w * 0.2, y - 6, w * 0.22, 10);
  }

  // Back wall & industrial dock shutter
  const backW = width * 0.34;
  const backH = horizonY * 0.56;
  const backX = vanishX - backW / 2;
  const backY = horizonY - backH;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(backX, backY, backW, backH);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(backX, backY, backW, backH);

  // Dock door on back wall
  const doorW = backW * 0.36;
  const doorH = backH * 0.72;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(vanishX - doorW / 2, horizonY - doorH, doorW, doorH);
  ctx.strokeStyle = '#475569';
  for (let s = 1; s < 6; s++) {
    const sy = horizonY - (doorH * s) / 6;
    ctx.beginPath();
    ctx.moveTo(vanishX - doorW / 2, sy);
    ctx.lineTo(vanishX + doorW / 2, sy);
    ctx.stroke();
  }

  // Left & right warehouse racking silhouettes
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(0, horizonY * 0.15);
  ctx.lineTo(backX, backY + 12);
  ctx.lineTo(backX, horizonY);
  ctx.lineTo(0, horizonY);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width, horizonY * 0.15);
  ctx.lineTo(backX + backW, backY + 12);
  ctx.lineTo(backX + backW, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.closePath();
  ctx.fill();

  // Epoxy industrial floor
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  floorGrad.addColorStop(0, '#94a3b8');
  floorGrad.addColorStop(0.3, '#cbd5e1');
  floorGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Perspective concrete expansion joints
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
  ctx.lineWidth = 1.5;
  for (let i = -5; i <= 5; i++) {
    const bottomX = vanishX + i * (width * 0.16);
    const topX = vanishX + i * (backW * 0.16);
    ctx.beginPath();
    ctx.moveTo(topX, horizonY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }
  for (let r = 1; r <= 5; r++) {
    const t = Math.pow(r / 5, 1.5);
    const y = horizonY + (height - horizonY) * t;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Yellow safety bay markings on epoxy floor
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(vanishX - backW * 0.45, horizonY + 14);
  ctx.lineTo(width * 0.14, height - 18);
  ctx.moveTo(vanishX + backW * 0.45, horizonY + 14);
  ctx.lineTo(width * 0.86, height - 18);
  ctx.stroke();

  // Subtle top corner label
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(16, 16, 250, 28);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Hală producție demo (sintetică)', 26, 34);
}

// --- Pure-JS minimal PNG encoder (zero external network, works in Node & browser) ---
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function uint32BE(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  out.set(uint32BE(data.length), 0);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  out.set(uint32BE(crc32(out.subarray(4, 8 + data.length))), 8 + data.length);
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out += chars[(n >> 18) & 63];
    out += chars[(n >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[n & 63] : '=';
  }
  return out;
}

function encodeFallbackHallPng(): string {
  const w = 160;
  const h = 90;
  const rowSize = 1 + w * 3;
  const raw = new Uint8Array(rowSize * h);
  for (let y = 0; y < h; y++) {
    const base = y * rowSize;
    raw[base] = 0;
    const isFloor = y >= 38;
    for (let x = 0; x < w; x++) {
      const p = base + 1 + x * 3;
      if (!isFloor) {
        raw[p] = 226;
        raw[p + 1] = 232;
        raw[p + 2] = 240;
      } else {
        const isStripe = Math.abs(x - 24) < 2 || Math.abs(x - 136) < 2;
        raw[p] = isStripe ? 234 : 203;
        raw[p + 1] = isStripe ? 179 : 213;
        raw[p + 2] = isStripe ? 8 : 225;
      }
    }
  }

  // Uncompressed zlib wrapper (single stored block <= 65535 bytes: 160*3+1=481 * 90 = 43290)
  const zlib = new Uint8Array(2 + 5 + raw.length + 4);
  zlib[0] = 0x78;
  zlib[1] = 0x01;
  zlib[2] = 0x01; // final stored block
  zlib[3] = raw.length & 0xff;
  zlib[4] = (raw.length >>> 8) & 0xff;
  zlib[5] = ~raw.length & 0xff;
  zlib[6] = (~raw.length >>> 8) & 0xff;
  zlib.set(raw, 7);
  zlib.set(uint32BE(adler32(raw)), 7 + raw.length);

  const ihdr = new Uint8Array(13);
  ihdr.set(uint32BE(w), 0);
  ihdr.set(uint32BE(h), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const c1 = pngChunk('IHDR', ihdr);
  const c2 = pngChunk('IDAT', zlib);
  const c3 = pngChunk('IEND', new Uint8Array(0));
  const png = new Uint8Array(sig.length + c1.length + c2.length + c3.length);
  png.set(sig, 0);
  png.set(c1, sig.length);
  png.set(c2, sig.length + c1.length);
  png.set(c3, sig.length + c1.length + c2.length);
  return `data:image/png;base64,${bytesToBase64(png)}`;
}

/** Generates a 100% local synthetic industrial hall data URL (zero external URLs). */
export function createDemoHallDataUrl(): string {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      renderDemoHallToCanvas(ctx, 1280, 720);
      return canvas.toDataURL('image/png');
    }
  }
  return encodeFallbackHallPng();
}

/** Draws Photo-Fit stage (background photo + transformed transparent UR20 cell overlay). */
export function drawPhotoFitComposite(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgImage: CanvasImageSource | null,
  bgNaturalWidth: number,
  bgNaturalHeight: number,
  transform: PhotoOverlayTransform,
  config: CellConfig,
  pose: Ur20ArmPose,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  if (bgImage && bgNaturalWidth > 0 && bgNaturalHeight > 0) {
    const rect = computeContainRect(bgNaturalWidth, bgNaturalHeight, width, height);
    ctx.drawImage(bgImage, rect.x, rect.y, rect.w, rect.h);
  }

  const clamped = clampPhotoTransform(transform);
  const { w: overlayW, h: overlayH } = overlayBox(width, height);

  ctx.save();
  ctx.translate(clamped.xNorm * width, clamped.yNorm * height);
  ctx.rotate((clamped.rotationDeg * Math.PI) / 180);
  ctx.scale(clamped.scale, clamped.scale);
  ctx.translate(-overlayW / 2, -overlayH / 2);

  renderCellCanvas(ctx, overlayW, overlayH, config, pose, {
    transparentBg: true,
    showDimensions: false,
  });
  drawReachRings(ctx, overlayW, overlayH, config, pose);

  ctx.restore();
}

/** Exports composite Photo-Fit PNG Blob for download (`Descarcă schița (.png)`). */
export async function exportPhotoFitPng(
  bgImage: HTMLImageElement | null,
  transform: PhotoOverlayTransform,
  config: CellConfig,
  pose?: Ur20ArmPose,
): Promise<Blob> {
  if (!bgImage || bgImage.naturalWidth <= 0 || bgImage.naturalHeight <= 0) {
    throw new Error('Imaginea halei nu este încărcată.');
  }

  const maxSide = 1280;
  const scaleOut = Math.min(1, maxSide / Math.max(bgImage.naturalWidth, bgImage.naturalHeight));
  const outW = Math.max(320, Math.round(bgImage.naturalWidth * scaleOut));
  const outH = Math.max(240, Math.round(bgImage.naturalHeight * scaleOut));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contextul grafic 2D nu este disponibil.');

  const activePose = pose ?? computeUr20ArmPose(0.45 * (60 / config.ratePerMin), config.ratePerMin, config.sickZone);
  drawPhotoFitComposite(
    ctx,
    outW,
    outH,
    bgImage,
    bgImage.naturalWidth,
    bgImage.naturalHeight,
    transform,
    config,
    activePose,
  );

  // Subtle engineering footer stamp
  const bucketStr = formatScaled(Math.round(config.bucketKg * 10), 1, { min: 0, max: 1 });
  const rateStr = formatScaled(Math.round(config.ratePerMin * 10), 1, { min: 0, max: 1 });
  const stamp = `PaletCheck UR20 Photo-Fit • ${config.cellCount} ${
    config.cellCount === 1 ? 'celulă' : 'celule'
  } • Găleată ${bucketStr} kg • ${rateStr} găleți/min`;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fillRect(0, outH - 30, outW, 30);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(stamp, 14, outH - 15, outW - 28);
  ctx.restore();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob && blob.size > 0) resolve(blob);
      else reject(new Error('Generarea fișierului PNG a eșuat.'));
    }, 'image/png');
  });
}

export const UR20_REACH_M = 1.75;
/** Buckets are placed inside the pallet, not on its outer corner. */
export const PLACE_INSET_M = 0.15;

export function overlayBox(width: number, height: number): { w: number; h: number } {
  const base = Math.min(width, height) * 0.72;
  return { w: base, h: base * 0.78 };
}

export interface CalibPoint {
  x: number;
  y: number;
}

/** Real-scale overlay from 2 taps on a floor edge of known length (CSS px of the stage). */
export function calibrateTransform(
  p1: CalibPoint,
  p2: CalibPoint,
  refLengthM: number,
  stageW: number,
  stageH: number,
  config: CellConfig,
  prev: PhotoOverlayTransform,
): (PhotoOverlayTransform & { fittedToFrame?: boolean }) | null {
  const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (!(refLengthM > 0) || distPx < 10 || stageW <= 0 || stageH <= 0) return null;
  const { w, h } = overlayBox(stageW, stageH);
  const vp = computeViewport(w, h, config, true);
  const realScale = distPx / refLengthM / vp.pxPerMeter;
  // Keep the whole cell inside the photo: cap the scale and keep the center away from the edges.
  const maxScale = Math.min((stageW * 0.96) / w, (stageH * 0.96) / h);
  const scale = Math.min(realScale, maxScale);
  const halfW = Math.min(0.5, (w * scale) / 2 / stageW);
  const halfH = Math.min(0.5, (h * scale) / 2 / stageH);
  const t = clampPhotoTransform({
    ...prev,
    scale,
    xNorm: clamp((p1.x + p2.x) / 2 / stageW, halfW, 1 - halfW),
    yNorm: clamp((p1.y + p2.y) / 2 / stageH - halfH * 0.35, halfH, 1 - halfH),
  });
  return { ...t, fittedToFrame: realScale > maxScale };
}

/** True when the real-scale cell was bigger than the photo frame and was shrunk to fit. */
export function wasFittedToFrame(t: PhotoOverlayTransform | null): boolean {
  return Boolean(t && (t as PhotoOverlayTransform & { fittedToFrame?: boolean }).fittedToFrame);
}

/** Largest distance from a UR20 base to a bucket place point (meters). */
export function maxPlaceReachM(config: CellConfig, pose: Ur20ArmPose): number {
  const scene = buildCellSceneGeometry(config, pose);
  let maxD = 0;
  for (const cell of scene.cells) {
    for (const pal of cell.pallets) {
      const hx = pal.widthM / 2 - PLACE_INSET_M;
      const hy = pal.depthM / 2 - PLACE_INSET_M;
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          const d = Math.hypot(
            pal.centerX + sx * hx - cell.pedestal.x,
            pal.centerY + sy * hy - cell.pedestal.y,
          );
          if (d > maxD) maxD = d;
        }
      }
    }
  }
  return maxD;
}

/** Dashed 1,75 m reach ring on the floor around each UR20 base. */
export function drawReachRings(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: CellConfig,
  pose: Ur20ArmPose,
): void {
  const vp = computeViewport(w, h, config, true);
  const scene = buildCellSceneGeometry(config, pose);
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0f766e';
  for (const cell of scene.cells) {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const pt = projectPoint(
        {
          x: cell.pedestal.x + UR20_REACH_M * Math.cos(a),
          y: cell.pedestal.y + UR20_REACH_M * Math.sin(a),
          z: 0,
        },
        config.viewMode,
        vp,
      );
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
