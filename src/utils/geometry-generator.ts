import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type LampshadeType = 
  | 'ribbed_drum' 
  | 'spiral_twist' 
  | 'voronoi' 
  | 'wave_shell' 
  | 'geometric_poly' 
  | 'lattice' 
  | 'origami' 
  | 'perlin_noise' 
  | 'slotted' 
  | 'double_wall'
  | 'lithophane';

export interface LampshadeParams {
  type: LampshadeType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  seed: number;
  
  // Type-specific params
  ribCount?: number;
  ribDepth?: number;
  twistAngle?: number;
  cellCount?: number;
  amplitude?: number;
  frequency?: number;
  sides?: number;
  gridDensity?: number;
  foldCount?: number;
  foldDepth?: number;
  noiseScale?: number;
  noiseStrength?: number;
  slotCount?: number;
  slotWidth?: number;
  gapDistance?: number;
  
  // Lithophane specific params
  imageData?: ImageData | null;
  lithoResolution?: number;
  maxThickness?: number;
  minThickness?: number;
  baseWidth?: number;
  overhangAngle?: number;
  ledgeDiameter?: number;
  ledgeHeight?: number;
  cylinderDiameter?: number;
  cylinderThickness?: number;
  spokeThickness?: number;
  spokeDepth?: number;
  halfWaves?: number;
  waveSize?: number;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, seed } = params;
  let geometry: THREE.BufferGeometry;

  // Base profile for Lathe-based shapes (open ended)
  const getProfile = (steps = 50) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = topRadius + (bottomRadius - topRadius) * t;
      const y = -height / 2 + height * t;
      points.push(new THREE.Vector2(r, y));
    }
    return points;
  };

  switch (type) {
    case 'ribbed_drum': {
      const count = params.ribCount || 20;
      const depth = params.ribDepth || 0.5;
      geometry = new THREE.LatheGeometry(getProfile(), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const rib = 1 + Math.sin(angle * count) * (depth / (topRadius + bottomRadius));
        pos.setX(i, x * rib);
        pos.setZ(i, z * rib);
      }
      break;
    }
    
    case 'spiral_twist': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(getProfile(), segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const normY = (y + height / 2) / height;
        const angle = normY * twist;
        const newX = x * Math.cos(angle) - z * Math.sin(angle);
        const newZ = x * Math.sin(angle) + z * Math.cos(angle);
        pos.setXYZ(i, newX, y, newZ);
      }
      break;
    }
    
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 1;
      geometry = new THREE.LatheGeometry(getProfile(20), folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const foldStep = (angle / (Math.PI * 2)) * folds * 2;
        const isPeak = Math.round(foldStep) % 2 === 0;
        const offset = isPeak ? depth : -depth;
        const r = Math.sqrt(x * x + z * z) + offset;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }
    
    case 'geometric_poly': {
      const sides = params.sides || 6;
      // Set openEnded to true for single-walled shell
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, true);
      break;
    }
    
    case 'wave_shell': {
      const amp = params.amplitude || 1;
      const freq = params.frequency || 5;
      const points = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const rBase = topRadius + (bottomRadius - topRadius) * t;
        const wave = Math.sin(t * Math.PI * freq + seed) * amp;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(rBase + wave, y));
      }
      geometry = new THREE.LatheGeometry(points, segments);
      break;
    }
    
    case 'perlin_noise': {
      // Set openEnded to true
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, Math.floor(segments/2), true);
      const pos = geometry.attributes.position;
      const strength = params.noiseStrength || 1;
      const scale = params.noiseScale || 0.5;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const noise = (
          Math.sin(angle * 7 * scale + seed) * 0.5 +
          Math.cos(y * 3 * scale - seed) * 0.5 +
          Math.sin((angle + y) * 5 * scale) * 0.2
        ) * strength;
        const r = Math.sqrt(x * x + z * z) + noise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }
    
    case 'voronoi': {
      const cells = params.cellCount || 12;
      // Set openEnded to true
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, Math.floor(segments/2), true);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const v = Math.abs(Math.sin(angle * cells + seed) * Math.cos(y * (cells/2) - seed));
        const cellNoise = Math.pow(v, 0.5) * 0.8;
        const r = Math.sqrt(x * x + z * z) + cellNoise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }
    
    case 'lattice': {
      const density = params.gridDensity || 10;
      // Set openEnded to true
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, Math.floor(segments/2), true);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const lattice = (Math.sin(angle * density) * Math.sin(y * density + seed)) * 0.3;
        const r = Math.sqrt(x * x + z * z) + lattice;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }
    
    case 'lithophane': {
      geometry = generateLithophaneLampshade(params);
      break;
    }
    
    case 'double_wall': {
      const gap = params.gapDistance || 1;
      // Both cylinders open ended
      const outer = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      const inner = new THREE.CylinderGeometry(topRadius - gap, bottomRadius - gap, height, segments, 1, true);
      geometry = BufferGeometryUtils.mergeGeometries([outer, inner]);
      break;
    }
    
    default:
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

function generateLithophaneLampshade(params: LampshadeParams): THREE.BufferGeometry {
  const {
    height,
    topRadius,
    bottomRadius,
    imageData,
    lithoResolution = 0.25,
    maxThickness = 3.0,
    minThickness = 0.6,
    baseWidth = 5,
    overhangAngle = 45,
    ledgeDiameter = 27.6,
    ledgeHeight = 10,
    cylinderDiameter = 36,
    cylinderThickness = 2.5,
    spokeThickness = 5,
    spokeDepth = 10,
    halfWaves = 0,
    waveSize = -10,
    segments = 128
  } = params;

  if (!imageData) {
    // Return basic cylinder if no image data
    return new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
  }

  // Create cylinder geometry
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
  
  if (!geometry.attributes.position) return geometry;
  
  const positions = geometry.attributes.position;
  const uvs = [];
  
  // Generate UV coordinates for the cylinder
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // Convert to cylindrical coordinates for UV mapping
    const angle = Math.atan2(z, x);
    const u = (angle + Math.PI) / (2 * Math.PI);
    const v = (y + height / 2) / height;
    uvs.push(u, v);
  }
  
  // Apply lithophane effect based on image data
  const processedData = imageData.data;
  for (let i = 0; i < positions.count; i++) {
    const u = uvs[i * 2];
    const v = uvs[i * 2 + 1];
    
    // Get pixel value from image
    const x = Math.floor(u * (imageData.width - 1));
    const y = Math.floor((1 - v) * (imageData.height - 1));
    const idx = (y * imageData.width + x) * 4;
    
    // Calculate grayscale value
    const gray = (processedData[idx] * 0.299 + 
                  processedData[idx + 1] * 0.587 + 
                  processedData[idx + 2] * 0.114) / 255;
    
    // Invert for lithophane (darker areas are thicker)
    const thicknessFactor = 1 - gray;
    const thickness = minThickness + thicknessFactor * (maxThickness - minThickness);
    
    // Apply thickness as displacement along normal
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // Calculate normal direction (simplified)
    const length = Math.sqrt(x * x + z * z);
    if (length > 0) {
      const nx = x / length;
      const nz = z / length;
      
      // Displace along normal
      positions.setXYZ(
        i,
        x + nx * thickness,
        y,
        z + nz * thickness
      );
    }
  }
  
  // Add base and frame elements
  const additionalGeometries: THREE.BufferGeometry[] = [];
  
  // Add base
  if (baseWidth > 0) {
    const baseGeometry = new THREE.CylinderGeometry(
      bottomRadius, 
      bottomRadius + baseWidth * Math.tan(overhangAngle * Math.PI / 180), 
      baseWidth, 
      segments
    );
    baseGeometry.translate(0, -height / 2 - baseWidth / 2, 0);
    additionalGeometries.push(baseGeometry);
  }
  
  // Add clamp interface
  if (cylinderDiameter > 0 && ledgeDiameter > 0) {
    // Main cylinder
    const mainCylinder = new THREE.CylinderGeometry(
      cylinderDiameter / 2, 
      cylinderDiameter / 2, 
      ledgeHeight, 
      32
    );
    mainCylinder.translate(0, height / 2 + ledgeHeight / 2, 0);
    additionalGeometries.push(mainCylinder);
    
    // Ledge
    const ledge = new THREE.CylinderGeometry(
      ledgeDiameter / 2, 
      ledgeDiameter / 2, 
      cylinderThickness, 
      32
    );
    ledge.translate(0, height / 2 + ledgeHeight - cylinderThickness / 2, 0);
    additionalGeometries.push(ledge);
    
    // Spokes
    const spokeCount = 4;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spoke = new THREE.BoxGeometry(spokeThickness, spokeDepth, cylinderDiameter / 2);
      spoke.translate(
        (cylinderDiameter / 4) * Math.cos(angle),
        height / 2 + ledgeHeight / 2,
        (cylinderDiameter / 4) * Math.sin(angle)
      );
      additionalGeometries.push(spoke);
    }
  }
  
  if (additionalGeometries.length > 0) {
    additionalGeometries.unshift(geometry);
    return BufferGeometryUtils.mergeGeometries(additionalGeometries);
  }
  
  return geometry;
}