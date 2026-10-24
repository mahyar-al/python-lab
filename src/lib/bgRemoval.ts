/**
 * MORICO STYLE - Smart Background Removal Engine
 * High-fidelity client-side foreground segmentation with clean alpha channel,
 * perimeter sampling, flood-fill connectivity, and edge defringing.
 */

export interface BgRemovalOptions {
  tolerance?: number; // 0 - 100 (default: 25)
  feather?: number;   // Edge feathering radius in pixels (default: 1.5)
  preserveContainedHoles?: boolean; // Keep white/light text inside subject
}

/**
 * Automatically removes background from image and returns a transparent PNG dataUrl.
 */
export async function removeBackgroundAuto(
  imageSource: HTMLImageElement | string,
  options: BgRemovalOptions = {}
): Promise<{ dataUrl: string; width: number; height: number }> {
  const tolerance = options.tolerance ?? 28;
  const feather = options.feather ?? 1.5;

  // 1. Load image if string provided
  let img: HTMLImageElement;
  if (typeof imageSource === 'string') {
    img = await loadImage(imageSource);
  } else {
    img = imageSource;
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // 2. Draw to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 3. Sample background colors from perimeter borders
  const bgSamples: [number, number, number][] = [];
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 40));

  // Top and bottom borders
  for (let x = 0; x < width; x += sampleStep) {
    const topIdx = (x) * 4;
    const btmIdx = ((height - 1) * width + x) * 4;
    if (data[topIdx + 3] > 10) bgSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
    if (data[btmIdx + 3] > 10) bgSamples.push([data[btmIdx], data[btmIdx + 1], data[btmIdx + 2]]);
  }

  // Left and right borders
  for (let y = 0; y < height; y += sampleStep) {
    const leftIdx = (y * width) * 4;
    const rightIdx = (y * width + (width - 1)) * 4;
    if (data[leftIdx + 3] > 10) bgSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
    if (data[rightIdx + 3] > 10) bgSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
  }

  if (bgSamples.length === 0) {
    bgSamples.push([255, 255, 255]); // Fallback to white background
  }

  // Calculate average primary background color
  let sumR = 0, sumG = 0, sumB = 0;
  for (const s of bgSamples) {
    sumR += s[0];
    sumG += s[1];
    sumB += s[2];
  }
  const avgBg: [number, number, number] = [
    Math.round(sumR / bgSamples.length),
    Math.round(sumG / bgSamples.length),
    Math.round(sumB / bgSamples.length)
  ];

  // 4. Create connected background mask via flood-fill from edges
  // This is critical: only pixels connected to the borders are considered background,
  // preventing interior white text / graphics from being deleted!
  const isBackground = new Uint8Array(width * height); // 1 = bg, 0 = foreground
  const queue: number[] = [];

  const colorDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const maxDist = (tolerance / 100) * 441.67; // 441.67 is max RGB Euclidean distance (sqrt(255^2*3))

  const isBgCandidate = (idx: number) => {
    const px = idx * 4;
    const alpha = data[px + 3];
    if (alpha < 20) return true; // Already transparent
    const r = data[px], g = data[px + 1], b = data[px + 2];
    const dist = colorDist(r, g, b, avgBg[0], avgBg[1], avgBg[2]);
    return dist <= maxDist;
  };

  // Seed boundary edges into queue
  for (let x = 0; x < width; x++) {
    const top = x;
    const btm = (height - 1) * width + x;
    if (isBgCandidate(top) && !isBackground[top]) {
      isBackground[top] = 1;
      queue.push(top);
    }
    if (isBgCandidate(btm) && !isBackground[btm]) {
      isBackground[btm] = 1;
      queue.push(btm);
    }
  }

  for (let y = 0; y < height; y++) {
    const left = y * width;
    const right = y * width + (width - 1);
    if (isBgCandidate(left) && !isBackground[left]) {
      isBackground[left] = 1;
      queue.push(left);
    }
    if (isBgCandidate(right) && !isBackground[right]) {
      isBackground[right] = 1;
      queue.push(right);
    }
  }

  // BFS Flood-fill
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    // Check 4-connected neighbors
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1
    ];

    for (const n of neighbors) {
      if (n !== -1 && !isBackground[n] && isBgCandidate(n)) {
        isBackground[n] = 1;
        queue.push(n);
      }
    }
  }

  // 5. Apply Alpha channel with soft edge feathering
  for (let i = 0; i < width * height; i++) {
    const px = i * 4;
    if (isBackground[i]) {
      data[px + 3] = 0; // Transparent
    } else {
      // Check if neighboring pixel is background to feather
      const cx = i % width;
      const cy = Math.floor(i / width);
      let bgNeighborCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (isBackground[ny * width + nx]) bgNeighborCount++;
          }
        }
      }

      if (bgNeighborCount > 0 && feather > 0) {
        // Soft feathering factor
        const alphaRatio = 1 - (bgNeighborCount / 8) * 0.45;
        data[px + 3] = Math.round(data[px + 3] * alphaRatio);
      }
    }
  }

  // 6. Write back and return transparent PNG
  ctx.putImageData(imgData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  return {
    dataUrl,
    width,
    height
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}
