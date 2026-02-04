import * as THREE from 'three';

export type LithophaneType = 'flat' | 'circle' | 'heart' | 'badge' | 'curved' | 'cylinder';

export interface LithophaneParams {
  type: LithophaneType;
  width: number;
  height: number;
  minThickness: number;
  maxThickness: number;
  baseThickness: number;
  curveRadius: number;
  resolution: number;
  inverted: boolean;
  brightness: number;
  contrast: number;
  smoothing: number;
  hasHole: boolean;
  holeSize: number;
  holeX: number;
  holeY: number;
}

export function generateLithophaneGeometry(
  imageData: ImageData,
  params: LithophaneParams
): THREE.BufferGeometry {
  const { 
    width, height, minThickness, maxThickness, baseThickness, 
    resolution, type, curveRadius, inverted,
    brightness, contrast, smoothing, hasHole, holeSize, holeX, holeY
  } = params;
  
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const validPoints: boolean[] = [];

  const processedData = smoothing > 0 ? applySmoothing(imageData, smoothing) : imageData.data;

  // Shape boundary check
  const isInside = (u: number, v: number) => {
    const x = u - 0.5;
    const y = v - 0.5;

    // Keyring hole check (Adjustable position)
    if (hasHole) {
      const hX = (holeX / 100) - 0.5;
      const hY = (holeY / 100) - 0.5;
      const distToHole = Math.sqrt(Math.pow(x - hX, 2) + Math.pow(y - hY, 2));
      // holeSize is in mm, width/height in cm. Convert to normalized space.
      const normalizedHoleRadius = (holeSize / 10) / Math.max(width, height) / 2;
      if (distToHole < normalizedHoleRadius) return false; 
    }

    switch (type) {
      case 'circle':
        return (x * x + y * y) <= 0.25;
      case 'heart':
        // Heart curve: (x^2 + y^2 - 1)^3 - x^2 * y^3 = 0
        const heartX = x * 2.2;
        const heartY = y * 2.2 + 0.2;
        return Math.pow(heartX * heartX + heartY * heartY - 1, 3) - heartX * heartX * Math.pow(heartY, 3) <= 0;
      case 'badge':
        return Math.abs(x) <= 0.4 && (y <= 0.4 && y >= -0.5 + Math.abs(x));
      default:
        return true;
    }
  };

  const getInterpolatedVal = (u: number, v: number) => {
    const x = u * (imageData.width - 1);
    const y = (1 - v) * (imageData.height - 1);
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, imageData.width - 1);
    const y2 = Math.min(y1 + 1, imageData.height - 1);
    const dx = x - x1;
    const dy = y - y1;
    
    const getPixelGray = (px: number, py: number) => {
      const idx = (py * imageData.width + px) * 4;
      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const process = (val: number) => Math.min(255, Math.max(0, cFactor * (val + brightness - 128) + 128));
      const gray = (process(processedData[idx]) * 0.299 + process(processedData[idx+1]) * 0.587 + process(processedData[idx+2]) * 0.114) / 255;
      return inverted ? gray : 1 - gray;
    };

    return (getPixelGray(x1, y1) * (1 - dx) * (1 - dy)) +
           (getPixelGray(x2, y1) * dx * (1 - dy)) +
           (getPixelGray(x1, y2) * (1 - dx) * dy) +
           (getPixelGray(x2, y2) * dx * dy);
  };

  // 1. Generate Vertices
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      const inside = isInside(u, v);
      validPoints.push(inside);

      const bVal = inside ? getInterpolatedVal(u, v) : 0;
      const thickness = baseThickness + minThickness + bVal * (maxThickness - minThickness);
      
      const xPos = (u - 0.5) * width;
      const yPos = (v - 0.5) * height;

      // Front
      vertices.push(xPos, yPos, thickness);
    }
  }

  const backOffset = vertices.length / 3;
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1);
      const v = j / (gridY - 1);
      const xPos = (u - 0.5) * width;
      const yPos = (v - 0.5) * height;
      // Back
      vertices.push(xPos, yPos, 0);
    }
  }

  // 2. Generate Indices
  for (let j = 0; j < gridY - 1; j++) {
    for (let i = 0; i < gridX - 1; i++) {
      const a = j * gridX + i;
      const b = j * gridX + (i + 1);
      const c = (j + 1) * gridX + i;
      const d = (j + 1) * gridX + (i + 1);

      if (validPoints[a] && validPoints[b] && validPoints[c] && validPoints[d]) {
        indices.push(a, c, b);
        indices.push(b, c, d);
        indices.push(a + backOffset, b + backOffset, c + backOffset);
        indices.push(b + backOffset, d + backOffset, c + backOffset);
      }
    }
  }

  // 3. Side Walls (Edge Detection)
  const addSide = (idx1: number, idx2: number, idx3: number, idx4: number) => {
    indices.push(idx1, idx2, idx3);
    indices.push(idx2, idx4, idx3);
  };

  for (let j = 0; j < gridY - 1; j++) {
    for (let i = 0; i < gridX - 1; i++) {
      const a = j * gridX + i;
      const b = j * gridX + (i + 1);
      const c = (j + 1) * gridX + i;
      const d = (j + 1) * gridX + (i + 1);

      // Check horizontal edges
      if (validPoints[a] !== validPoints[c]) {
        if (validPoints[a]) addSide(a, c, a + backOffset, c + backOffset);
        else addSide(c, a, c + backOffset, a + backOffset);
      }
      if (validPoints[b] !== validPoints[d]) {
        if (validPoints[b]) addSide(d, b, d + backOffset, b + backOffset);
        else addSide(b, d, b + backOffset, d + backOffset);
      }
      // Check vertical edges
      if (validPoints[a] !== validPoints[b]) {
        if (validPoints[a]) addSide(b, a, b + backOffset, a + backOffset);
        else addSide(a, b, a + backOffset, b + backOffset);
      }
      if (validPoints[c] !== validPoints[d]) {
        if (validPoints[c]) addSide(c, d, c + backOffset, d + backOffset);
        else addSide(d, c, d + backOffset, c + backOffset);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

function applySmoothing(imageData: ImageData, radius: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  const r = Math.floor(radius);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let ky = -r; ky <= r; ky++) {
          for (let kx = -r; kx <= r; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (py * width + px) * 4;
            rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2];
            count++;
          }
        }
        const outIdx = (y * width + x) * 4;
        data[outIdx] = rSum / count; data[outIdx + 1] = gSum / count; data[outIdx + 2] = bSum / count;
      }
    }
  }
  return data;
}

export function getImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}