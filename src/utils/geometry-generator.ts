import * as THREE from 'three';

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
  | 'double_wall';

export interface LampshadeParams {
  type: LampshadeType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  
  // Type-specific params
  ribCount?: number;
  ribDepth?: number;
  twistAngle?: number;
  cellCount?: number;
  seed?: number;
  amplitude?: number;
  frequency?: number;
  sides?: number;
  gridDensity?: number;
  strutThickness?: number;
  foldCount?: number;
  foldDepth?: number;
  noiseScale?: number;
  noiseStrength?: number;
  slotCount?: number;
  slotWidth?: number;
  gapDistance?: number;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, thickness } = params;
  let geometry: THREE.BufferGeometry;

  switch (type) {
    case 'ribbed_drum': {
      const count = params.ribCount || 20;
      const depth = params.ribDepth || 0.5;
      const points = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const rBase = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(rBase, y));
      }
      geometry = new THREE.LatheGeometry(points, segments);
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
      const points = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(r, y));
      }
      geometry = new THREE.LatheGeometry(points, segments);
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
      const points = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(r, y));
      }
      geometry = new THREE.LatheGeometry(points, folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = pos.getY(i);
        const angle = Math.atan2(z, x);
        const foldIdx = Math.round((angle / (Math.PI * 2)) * folds * 2);
        const offset = foldIdx % 2 === 0 ? depth : -depth;
        const r = Math.sqrt(x * x + z * z) + offset;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'geometric_poly': {
      const sides = params.sides || 6;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 10, true);
      break;
    }

    case 'wave_shell': {
      const amp = params.amplitude || 1;
      const freq = params.frequency || 5;
      const points = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const rBase = topRadius + (bottomRadius - topRadius) * t;
        const wave = Math.sin(t * Math.PI * freq) * amp;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(rBase + wave, y));
      }
      geometry = new THREE.LatheGeometry(points, segments);
      break;
    }

    case 'perlin_noise': {
      // Simple noise simulation using sine combinations
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 40, true);
      const pos = geometry.attributes.position;
      const strength = params.noiseStrength || 1;
      const scale = params.noiseScale || 0.5;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const noise = (Math.sin(angle * 5 * scale) + Math.cos(y * 2 * scale)) * strength;
        const r = Math.sqrt(x * x + z * z) + noise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'slotted': {
      const slots = params.slotCount || 16;
      const width = params.slotWidth || 0.5;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      // Visualizing slots via wireframe or custom logic is complex for STL, 
      // so we'll create a "slotted" profile
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const slotFactor = Math.abs(Math.sin(angle * slots / 2)) < width ? 0.9 : 1.1;
        pos.setX(i, x * slotFactor);
        pos.setZ(i, z * slotFactor);
      }
      break;
    }

    case 'voronoi': {
      // Pseudo-voronoi using cellular noise approximation
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 30, true);
      const pos = geometry.attributes.position;
      const cells = params.cellCount || 10;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const cellNoise = Math.pow(Math.abs(Math.sin(angle * cells) * Math.cos(y * cells * 0.5)), 0.5) * 0.5;
        const r = Math.sqrt(x * x + z * z) + cellNoise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'lattice': {
      const density = params.gridDensity || 10;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 20, true);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const lattice = (Math.sin(angle * density) * Math.sin(y * density)) * 0.2;
        const r = Math.sqrt(x * x + z * z) + lattice;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'double_wall': {
      const gap = params.gapDistance || 1;
      // Create two cylinders
      const outer = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      const inner = new THREE.CylinderGeometry(topRadius - gap, bottomRadius - gap, height, segments, 1, true);
      geometry = THREE.BufferGeometryUtils ? (THREE as any).BufferGeometryUtils.mergeGeometries([outer, inner]) : outer;
      break;
    }

    default:
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments);
  }

  geometry.computeVertexNormals();
  return geometry;
}