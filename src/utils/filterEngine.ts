import { FilterId } from '../types/photobooth';

export function getFilterCssString(filterId?: FilterId): string {
  switch (filterId) {
    case 'bw':
      return 'grayscale(100%) contrast(115%) brightness(105%)';
    case 'vintage-grain':
      return 'sepia(28%) contrast(110%) brightness(102%) saturate(120%) hue-rotate(-5deg)';
    case 'warm-retro':
      return 'sepia(42%) saturate(145%) contrast(105%) brightness(102%)';
    case 'tokyo-pastel':
      return 'saturate(85%) brightness(115%) contrast(92%) hue-rotate(5deg)';
    case 'high-contrast':
      return 'contrast(140%) brightness(95%) saturate(130%)';
    case 'cyber-pink':
      return 'saturate(160%) hue-rotate(320deg) brightness(108%) contrast(110%)';
    case 'nostalgia-sepia':
      return 'sepia(85%) contrast(95%) brightness(92%)';
    case 'normal':
    default:
      return 'none';
  }
}

/**
 * Apply canvas filter and film grain procedurally
 */
export function applyCanvasFilter(
  ctx: CanvasRenderingContext2D,
  filterId: FilterId | undefined,
  width: number,
  height: number
) {
  // If the browser supports ctx.filter, set it before drawing
  // For grain, we overlay a subtle random grain layer
  if (!filterId || filterId === 'normal') return;

  if (filterId === 'vintage-grain' || filterId === 'nostalgia-sepia') {
    // Generate subtle film grain
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 120;
    grainCanvas.height = 120;
    const gCtx = grainCanvas.getContext('2d');
    if (gCtx) {
      const imgData = gCtx.createImageData(120, 120);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 50;
        data[i] = 128 + noise;
        data[i + 1] = 128 + noise;
        data[i + 2] = 128 + noise;
        data[i + 3] = 30; // subtle alpha
      }
      gCtx.putImageData(imgData, 0, 0);
      const pattern = ctx.createPattern(grainCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    }
    ctx.restore();
  }
}
