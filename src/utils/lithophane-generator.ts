import * as THREE from 'three';

export type LithophaneType = 'flat' | 'circle' | 'heart' | 'badge' | 'curved' | 'cylinder';
export type MappingMode = 'linear' | 'exponential' | 'logarithmic';

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
  gamma: number; 
  mappingMode: MappingMode; 
  smoothing: number;
  hasHole: boolean;
  holeSize: number;
  hasBorder: boolean;
  borderThickness: number;
  borderHeight: number;
  text?: string;
  textSize?: number;
  textY?: number;
}

export function generateLithophaneGeometry(imageData: ImageData, params: LithophaneParams): THREE.BufferGeometry {
  const { width, height, minThickness, maxThickness, resolution, type, inverted, brightness, contrast, gamma, mappingMode, smoothing, hasHole, holeSize, hasBorder, borderThickness, borderHeight, curveRadius } = params;
  const widthMm = width * 10;
  const heightMm = height * 10;
  const aspect = imageData.width / imageData.height;
  const gridX = Math.floor(resolution * aspect);
  const gridY = resolution;
  
  const processedData = smoothing > 0 ? applySmoothing(imageData, smoothing) : imageData.data;
  const vertices: number[] = [];
  const indices: number[] = [];
  const validPoints: boolean[] = [];

  const isInside = (u: number, v: number) => {
    const x = u - 0.5; const y = v - 0.5;
    if (hasHole) {
      const distToHole = Math.sqrt(Math.pow(x - 0, 2) + Math.pow(y - 0.4, 2));
      if (distToHole < (holeSize / 100)) return false; 
    }
    switch (type) {
      case 'circle': return (x * x + y * y) <= 0.25;
      case 'heart': const hX = x * 2.2; const hY = y * 2.2 + 0.2; return Math.pow(hX * hX + hY * hY - 1, 3) - hX * hX * Math.pow(hY, 3) <= 0;
      case 'badge': return Math.abs(x) <= 0.4 && (y <= 0.4 && y >= -0.5 + Math.abs(x));
      default: return true;
    }
  };

  const getInterpolatedVal = (u: number, v: number) => {
    const x = u * (imageData.width - 1);
    const y = (1 - v) * (imageData.height - 1);
    const x1 = Math.floor(x); const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, imageData.width - 1); const y2 = Math.min(y1 + 1, imageData.height - 1);
    const dx = x - x1; const dy = y - y1;

    const getPixelGray = (px: number, py: number) => {
      const idx = (py * imageData.width + px) * 4;
      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const process = (val: number) => {
        let v = cFactor * (val + brightness - 128) + 128;
        v = Math.min(255, Math.max(0, v)) / 255;
        return Math.pow(v, 1 / gamma);
      };
      const gray = (process(processedData[idx]) * 0.299 + process(processedData[idx+1]) * 0.587 + process(processedData[idx+2]) * 0.114);
      return inverted ? gray : 1 - gray;
    };

    return (getPixelGray(x1, y1) * (1 - dx) * (1 - dy)) + (getPixelGray(x2, y1) * dx * (1 - dy)) + (getPixelGray(x1, y2) * (1 - dx) * dy) + (getPixelGray(x2, y2) * dx * dy);
  };

  const getPosition = (u: number, v: number, thickness: number) => {
    const x = (u - 0.5) * widthMm; const y = (v - 0.5) * heightMm;
    if (type === 'curved') {
      const radius = curveRadius * 10; const angle = x / radius;
      return { x: Math.sin(angle) * (radius + thickness), y, z: Math.cos(angle) * (radius + thickness) - radius };
    } else if (type === 'cylinder') {
      const radius = widthMm / (2 * Math.PI); const angle = u * Math.PI * 2;
      return { x: Math.sin(angle) * (radius + thickness), y, z: Math.cos(angle) * (radius + thickness) };
    }
    return { x, y, z: thickness };
  };

  // Front vertices
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const u = i / (gridX - 1); const v = j / (gridY - 1);
      const inside = isInside(u, v);
      validPoints.push(inside || (hasBorder && !inside));
      let thickness = 0;
      if (inside) {
        let bVal = getInterpolatedVal(u, v);
        if (mappingMode === 'exponential') bVal = (Math.exp(bVal) - 1) / (Math.E - 1);
        else if (mappingMode === 'logarithmic') bVal = Math.log(1 + bVal * (Math.E - 1));
        thickness = minThickness + bVal * (maxThickness - minThickness);
      } else if (hasBorder) thickness = borderHeight;
      const pos = getPosition(u, v, thickness);
      vertices.push(pos.x, pos.y, pos.z);
    }
  }

  // Back vertices
  const backOffset = vertices.length / 3;
  for (let j = 0; j < gridY; j++) {
    for (let i = 0; i < gridX; i++) {
      const pos = getPosition(i / (gridX - 1), j / (gridY - 1), 0);
      vertices.push(pos.x, pos.y, pos.z);
    }
  }

  // Faces and side walls
  for (let j = 0; j < gridY - 1; j++) {
    for (let i = 0; i < gridX; i++) {
      const nextI = (i + 1) % gridX;
      if (type !== 'cylinder' && i === gridX - 1) continue;

      const a = j * gridX + i;
      const b = j * gridX + nextI;
      const c = (j + 1) * gridX + i;
      const d = (j + 1) * gridX + nextI;

      const quadValid = validPoints[a] && validPoints[b] && validPoints[c] && validPoints[d];

      if (quadValid) {
        // Front face (CCW)
        indices.push(a, c, b);
        indices.push(b, c, d);

        // Back face (CW relative to front, CCW from back)
        indices.push(a + backOffset, b + backOffset, c + backOffset);
        indices.push(b + backOffset, d + backOffset, c + backOffset);

        // Side walls (Edge detection)
        
        // Bottom edge (AB)
        const abNeighborValid = j > 0 && validPoints[(j-1)*gridX + i] && validPoints[(j-1)*gridX + nextI];
        if (j === 0 || !abNeighborValid) {
          indices.push(a, b, a + backOffset);
          indices.push(b, b + backOffset, a + backOffset);
        }

        // Top edge (CD)
        const cdNeighborValid = j < gridY - 2 && validPoints[(j+2)*gridX + i] && validPoints[(j+2)*gridX + nextI];
        if (j === gridY - 2 || !cdNeighborValid) {
          indices.push(c, c + backOffset, d);
          indices.push(d, c + backOffset, d + backOffset);
        }

        // Left edge (AC)
        if (type !== 'cylinder') {
          const acNeighborValid = i > 0 && validPoints[j*gridX + i - 1] && validPoints[(j+1)*gridX + i - 1];
          if (i === 0 || !acNeighborValid) {
            indices.push(a, a + backOffset, c);
            indices.push(c, a + backOffset, c + backOffset);
          }
        }

        // Right edge (BD)
        if (type !== 'cylinder') {
          const bdNeighborValid = i < gridX - 2 && validPoints[j*gridX + i + 1] && validPoints[(j+1)*gridX + i + 1];
          if (i === gridX - 1 || !bdNeighborValid) {
            indices.push(b, d, b + backOffset);
            indices.push(d, d + backOffset, b + backOffset);
          }
        }
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
  const width = imageData.width; const height = imageData.height;
  const r = Math.floor(radius);
  if (r <= 0) return data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let ky = -r; ky <= r; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky));
        for (let kx = -r; kx <= r; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const idx = (py * width + px) * 4;
          rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2]; count++;
        }
      }
      const outIdx = (y * width + x) * 4;
      data[outIdx] = rSum / count; data[outIdx + 1] = gSum / count; data[outIdx + 2] = bSum / count;
    }
  }
  return data;
}