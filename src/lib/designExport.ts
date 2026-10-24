import { CustomLayer, PrintableArea } from './types';
import { loadImage } from './bgRemoval';

/**
 * MORICO STYLE - Studio Design & DTG Print Renderer
 * Renders high-resolution transparent print files and composite garment mockups.
 */

export interface ExportDesignResult {
  designImageUrl: string;   // Transparent high-res PNG for DTG fabric printer
  previewMockupUrl: string; // Visual composite mockup showing garment + design
}

/**
 * Render pure print layers with full alpha transparency at high resolution (1200x1500)
 */
export async function renderPrintDesign(
  layers: CustomLayer[],
  _printableArea?: PrintableArea,
  canvasWidth = 1200,
  canvasHeight = 1500
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (const layer of layers) {
    ctx.save();

    const cx = (layer.x / 100) * canvasWidth;
    const cy = (layer.y / 100) * canvasHeight;
    const scale = layer.scale || 1;
    const rotationRad = ((layer.rotation || 0) * Math.PI) / 180;

    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.scale(scale, scale);

    if (layer.type === 'monogram') {
      // Luxury MC Emblem
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = layer.color || '#111110';
      ctx.font = 'bold 120px "Cormorant Garamond", serif';
      ctx.fillText('MC', 0, -20);

      ctx.font = '500 24px "Cormorant Garamond", serif';
      ctx.fillText('MORICO STYLE', 0, 50);

      ctx.font = '400 16px "Cormorant Garamond", serif';
      ctx.fillText('ATELIER 2026', 0, 80);
    } else if (layer.type === 'text') {
      // Typography layer
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = layer.color || '#111110';
      const fontSize = (layer.fontSize || 24) * 3; // scaled for 1200x1500 canvas
      const fontFamily = layer.fontFamily?.includes('serif')
        ? '"Cormorant Garamond", serif'
        : '"Vazirmatn", sans-serif';
      ctx.font = `500 ${fontSize}px ${fontFamily}`;
      ctx.fillText(layer.content, 0, 0);
    } else if (layer.type === 'image' && layer.content) {
      try {
        const img = await loadImage(layer.content);
        const w = (layer.width || 350);
        const h = (layer.height || (w * (img.naturalHeight / (img.naturalWidth || 1))));
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } catch (e) {
        console.warn('Failed to render print layer image', e);
      }
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Render visual composite mockup showing garment silhouette, chosen color, and design
 */
export async function renderMockupComposite(
  garmentImageUrl: string,
  garmentColorHex: string,
  layers: CustomLayer[],
  canvasWidth = 600,
  canvasHeight = 750
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return garmentImageUrl;

  // 1. Background fill based on color
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Garment background tint container
  if (garmentColorHex && garmentColorHex !== '#FFFFFF') {
    ctx.fillStyle = garmentColorHex;
    ctx.fillRect(60, 60, canvasWidth - 120, canvasHeight - 120);
  }

  // 3. Garment base mockup image
  try {
    const garmentImg = await loadImage(garmentImageUrl);
    ctx.drawImage(garmentImg, 0, 0, canvasWidth, canvasHeight);
  } catch (e) {
    console.warn('Could not load base mockup image', e);
  }

  // 4. Render design layers on top of garment
  for (const layer of layers) {
    ctx.save();

    const cx = (layer.x / 100) * canvasWidth;
    const cy = (layer.y / 100) * canvasHeight;
    const scale = layer.scale || 1;
    const rotationRad = ((layer.rotation || 0) * Math.PI) / 180;

    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.scale(scale, scale);

    if (layer.type === 'monogram') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = garmentColorHex === '#111110' ? '#FFFFFF' : '#111110';
      ctx.font = 'bold 48px "Cormorant Garamond", serif';
      ctx.fillText('MC', 0, -8);

      ctx.font = '500 11px "Cormorant Garamond", serif';
      ctx.fillText('MORICO STYLE', 0, 20);
    } else if (layer.type === 'text') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle =
        garmentColorHex === '#111110' && (!layer.color || layer.color === '#111110')
          ? '#FFFFFF'
          : layer.color || '#111110';
      const fontSize = layer.fontSize || 22;
      const fontFamily = layer.fontFamily?.includes('serif')
        ? '"Cormorant Garamond", serif'
        : '"Vazirmatn", sans-serif';
      ctx.font = `500 ${fontSize}px ${fontFamily}`;
      ctx.fillText(layer.content, 0, 0);
    } else if (layer.type === 'image' && layer.content) {
      try {
        const img = await loadImage(layer.content);
        const w = (layer.width || 140);
        const h = (layer.height || (w * (img.naturalHeight / (img.naturalWidth || 1))));
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } catch (e) {
        console.warn('Failed to composite layer image', e);
      }
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
