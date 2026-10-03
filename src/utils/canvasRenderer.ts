import { 
  FrameBorderConfig, 
  CaptionConfig, 
  DateStampConfig, 
  FilterId, 
  LayoutConfig, 
  PhotoSlotData, 
  StickerItem 
} from '../types/photobooth';
import { getFilterCssString, applyCanvasFilter } from './filterEngine';

export interface ExportOptions {
  layout: LayoutConfig;
  slots: PhotoSlotData[];
  globalFilter: FilterId;
  borderConfig: FrameBorderConfig;
  captionConfig: CaptionConfig;
  dateStampConfig: DateStampConfig;
  stickers: StickerItem[];
  dpi?: number; // default 300
}

/**
 * Loads an image from a URL or data URL and returns an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Helper to draw rounded rectangle
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Render complete photobooth composition to a high-resolution HTMLCanvasElement
 */
export async function renderPhotoboothToCanvas(options: ExportOptions): Promise<HTMLCanvasElement> {
  const {
    layout,
    slots,
    globalFilter,
    borderConfig,
    captionConfig,
    dateStampConfig,
    stickers,
    dpi = 300,
  } = options;

  // Base canvas dimensions at 300 DPI
  // For maximum crispness, we scale by 2x supersampling (600 effective DPI)
  const supersample = 2;
  const canvasWidth = Math.round(layout.exportWidthInches * dpi * supersample);
  const canvasHeight = Math.round(layout.exportHeightInches * dpi * supersample);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Scale factor relative to a base reference width of 400px (standard preview strip width)
  const referencePreviewWidth = 400;
  const scaleRatio = canvasWidth / referencePreviewWidth;

  // 1. Draw Background Frame
  ctx.fillStyle = borderConfig.customColor || borderConfig.color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Apply paper texture if selected
  if (borderConfig.texture === 'grain' || borderConfig.texture === 'matte') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 100;
    noiseCanvas.height = 100;
    const nCtx = noiseCanvas.getContext('2d');
    if (nCtx) {
      const imgData = nCtx.createImageData(100, 100);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.random() * 255;
        imgData.data[i] = val;
        imgData.data[i + 1] = val;
        imgData.data[i + 2] = val;
        imgData.data[i + 3] = borderConfig.texture === 'grain' ? 25 : 12;
      }
      nCtx.putImageData(imgData, 0, 0);
      const pattern = ctx.createPattern(noiseCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }
    ctx.restore();
  }

  // Calculate layout geometry
  const paddingX = borderConfig.width * scaleRatio;
  const gap = borderConfig.gap * scaleRatio;
  const cornerRadius = borderConfig.borderRadius * scaleRatio;

  // Extra footer space for Polaroid layout or text caption
  const footerExtraHeight = (layout.id === 'polaroid-single' ? 80 : 50) * scaleRatio;
  const availableContentWidth = canvasWidth - (paddingX * 2);
  const availableContentHeight = canvasHeight - (paddingX * 2) - (captionConfig.enabled || dateStampConfig.enabled || layout.id === 'polaroid-single' ? footerExtraHeight : 0);

  const cols = layout.columns;
  const rows = layout.rows;
  const slotWidth = (availableContentWidth - (gap * (cols - 1))) / cols;
  const slotHeight = layout.id === 'polaroid-single' 
    ? slotWidth / layout.slotAspectRatio 
    : (availableContentHeight - (gap * (rows - 1))) / rows;

  // Pre-load all slot images
  const loadedImages: (HTMLImageElement | null)[] = await Promise.all(
    slots.map(async (slot) => {
      if (!slot.imageSrc) return null;
      try {
        return await loadImage(slot.imageSrc);
      } catch (err) {
        console.warn('Failed to load image for slot', slot.id, err);
        return null;
      }
    })
  );

  // 2. Render each photo slot
  for (let index = 0; index < layout.slotsCount; index++) {
    const slot = slots[index];
    const img = loadedImages[index];

    const colIndex = index % cols;
    const rowIndex = Math.floor(index / cols);

    const slotX = paddingX + colIndex * (slotWidth + gap);
    const slotY = paddingX + rowIndex * (slotHeight + gap);

    // Save context for clipping path
    ctx.save();

    // Clip to rounded slot
    drawRoundedRect(ctx, slotX, slotY, slotWidth, slotHeight, cornerRadius);
    ctx.clip();

    // Slot placeholder background if empty
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(slotX, slotY, slotWidth, slotHeight);

    if (img) {
      // Determine effective filter for slot
      const effectiveFilter = slot?.slotFilter && slot.slotFilter !== 'normal' 
        ? slot.slotFilter 
        : globalFilter;

      // Draw image with transforms
      const t = slot.transform;

      // Base aspect cover sizing
      const imgAspect = img.width / img.height;
      const slotAspect = slotWidth / slotHeight;

      let drawW: number;
      let drawH: number;

      if (imgAspect > slotAspect) {
        // Image is wider than slot: match height, overflow width
        drawH = slotHeight;
        drawW = slotHeight * imgAspect;
      } else {
        // Image is taller than slot: match width, overflow height
        drawW = slotWidth;
        drawH = slotWidth / imgAspect;
      }

      // Apply zoom scale
      drawW *= t.scale;
      drawH *= t.scale;

      // Transform center coordinate
      const centerX = slotX + (slotWidth / 2) + (t.x * slotWidth);
      const centerY = slotY + (slotHeight / 2) + (t.y * slotHeight);

      ctx.save();
      ctx.translate(centerX, centerY);

      // Rotation
      if (t.rotation !== 0) {
        ctx.rotate((t.rotation * Math.PI) / 180);
      }

      // Horizontal flip
      if (t.flipH) {
        ctx.scale(-1, 1);
      }

      // Apply CSS-like filter in canvas
      const cssFilter = getFilterCssString(effectiveFilter);
      if (cssFilter && cssFilter !== 'none') {
        try {
          ctx.filter = cssFilter;
        } catch {
          // Fallback if browser canvas doesn't support filter syntax
        }
      }

      // Draw the image centered
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      // Apply procedural film grain if preset calls for it
      applyCanvasFilter(ctx, effectiveFilter, drawW, drawH);

      ctx.restore();
    }

    // Restore slot clip
    ctx.restore();

    // Optional slot border line
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1 * scaleRatio;
    drawRoundedRect(ctx, slotX, slotY, slotWidth, slotHeight, cornerRadius);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Render Footer (Caption and Date Stamp)
  const footerY = canvasHeight - (paddingX * 0.8) - ((layout.id === 'polaroid-single' ? 40 : 25) * scaleRatio);

  // Render Caption
  if (captionConfig.enabled && captionConfig.text.trim()) {
    ctx.save();
    const captionFontSize = Math.round(captionConfig.size * scaleRatio * 1.2);
    let fontFamily = 'Caveat, cursive';
    if (captionConfig.font === 'mono') fontFamily = "'Space Mono', monospace";
    if (captionConfig.font === 'display') fontFamily = "'DM Sans', sans-serif";
    if (captionConfig.font === 'playfair') fontFamily = "'Playfair Display', serif";

    ctx.font = `600 ${captionFontSize}px ${fontFamily}`;
    ctx.fillStyle = captionConfig.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captionConfig.text, canvasWidth / 2, footerY - (dateStampConfig.enabled ? 16 * scaleRatio : 0));
    ctx.restore();
  }

  // Render Date Stamp
  if (dateStampConfig.enabled && dateStampConfig.date) {
    ctx.save();
    const dateFontSize = Math.round(11 * scaleRatio);
    ctx.font = `700 ${dateFontSize}px 'Space Mono', monospace`;
    ctx.fillStyle = dateStampConfig.color;
    
    if (dateStampConfig.position === 'corner') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(dateStampConfig.date, canvasWidth - paddingX - 10 * scaleRatio, canvasHeight - paddingX / 2);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const dateY = captionConfig.enabled && captionConfig.text.trim()
        ? footerY + (16 * scaleRatio)
        : footerY;
      ctx.fillText(dateStampConfig.date, canvasWidth / 2, dateY);
    }
    ctx.restore();
  }

  // 4. Render Stickers
  if (stickers && stickers.length > 0) {
    for (const sticker of stickers) {
      ctx.save();
      const stickerX = (sticker.x / 100) * canvasWidth;
      const stickerY = (sticker.y / 100) * canvasHeight;
      const stickerFontSize = Math.round(28 * scaleRatio * sticker.scale);

      ctx.translate(stickerX, stickerY);
      if (sticker.rotation) {
        ctx.rotate((sticker.rotation * Math.PI) / 180);
      }

      ctx.font = `${stickerFontSize}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.emoji, 0, 0);
      ctx.restore();
    }
  }

  return canvas;
}

/**
 * Trigger browser download for canvas
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png', quality = 0.98) {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
