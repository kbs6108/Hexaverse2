import type { Map as MLMap } from 'maplibre-gl';

/** Diagonal hatch used for disputed parcels — status is never colour-only. */
function hatch(colour: string, size = 12, stroke = 2): ImageData {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = colour;
  ctx.lineWidth = stroke;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 2);
  ctx.lineTo(size / 2, -size / 2);
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.moveTo(size / 2, size * 1.5);
  ctx.lineTo(size * 1.5, size / 2);
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

/** Radar-style ring icon for satellite change alerts. */
function alertIcon(colour: string, size = 40): ImageData {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.strokeStyle = colour;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(r, r, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = colour;
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.font = `bold ${Math.round(size * 0.42)}px "IBM Plex Sans", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', r, r + 1);
  return ctx.getImageData(0, 0, size, size);
}

export const IMG = { hatchBrick: 'hatch-brick', hatchViolet: 'hatch-violet', alert: 'alert-icon' } as const;

/** Idempotent: safe to call on every style load (basemap switch clears images). */
export function ensureImages(map: MLMap) {
  if (!map.hasImage(IMG.hatchBrick)) map.addImage(IMG.hatchBrick, hatch('#A63A2B'));
  if (!map.hasImage(IMG.hatchViolet)) map.addImage(IMG.hatchViolet, hatch('#6B4E9A'));
  if (!map.hasImage(IMG.alert)) map.addImage(IMG.alert, alertIcon('#A63A2B'), { pixelRatio: 2 });
}
