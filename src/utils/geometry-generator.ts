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
  
  // Global Generative Parameters
  seed: number;
  density: number;      // 1 - 100
  smoothness: number;   // 1 - 100 (maps to segments)
  diffusion: number;    // 1 - 100 (maps to hole size/depth)
  
  // Legacy/Specific overrides (optional)
  twistAngle?: number;
  sides?: number;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, seed, density, smoothness, diffusion } = params;
  
  // Map smoothness to segments (24 to 256)
  const segments = Math.floor(24 + (smoothness / 100) * 232);
  
  let geometry: THREE.BufferGeometry;

  // Helper for seeded random
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  switch (type) {
    case 'ribbed_drum': {
      const ribCount = Math.floor(4 + (density / 100) * 60);
      const ribDepth = (diffusion / 100) * 2;
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
        const rib = 1 + Math.sin(angle * ribCount + seed) * (ribDepth / (topRadius + bottomRadius));
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
        const angle = normY * twist + seed;
        const newX = x * Math.cos(angle) - z * Math.sin(angle);
        const newZ = x * Math.sin(angle) + z * Math.cos(angle);
        pos.setXYZ(i, newX, y, newZ);
      }
      break;
    }

    case 'origami': {
      const folds = Math.floor(6 + (density / 100) * 40);
      const depth = (diffusion / 100) * 3;
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
        const angle = Math.atan2(z, x);
        const foldIdx = Math.round(((angle + seed) / (Math.PI * 2)) * folds * 2);
        const offset = foldIdx % 2 === 0 ? depth : -depth;
        const r = Math.sqrt(x * x + z * z) + offset;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'geometric_poly': {
      const sides = params.sides || Math.floor(3 + (density / 100) * 12);
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, true);
      break;
    }

    case 'wave_shell': {
      const amp = (diffusion / 100) * 4;
      const freq = 2 + (density / 100) * 15;
      const points = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const rBase = topRadius + (bottomRadius - topRadius) * t;
        const wave = Math.sin(t * Math.PI * freq + seed) * amp;
        const y = -height / 2 + height * t;
        points.push(new THREE.Vector2(rBase + wave, y));
      }
      geometry = new THREE.LatheGeometry(points, segments);
      break;
    }

    case 'perlin_noise': {
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 40, true);
      const pos = geometry.attributes.position;
      const strength = (diffusion / 100) * 3;
      const scale = 0.1 + (density / 100) * 2;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const noise = (Math.sin(angle * 5 * scale + seed) + Math.cos(y * 2 * scale + seed)) * strength;
        const r = Math.sqrt(x * x + z * z) + noise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'slotted': {
      const slots = Math.floor(8 + (density / 100) * 64);
      const slotWidth = 0.05 + (diffusion / 100) * 0.4;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const slotFactor = Math.abs(Math.sin(angle * slots / 2 + seed)) < slotWidth ? 0.8 : 1.2;
        pos.setX(i, x * slotFactor);
        pos.setZ(i, z * slotFactor);
      }
      break;
    }

    case 'voronoi': {
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 30, true);
      const pos = geometry.attributes.position;
      const cells = Math.floor(5 + (density / 100) * 40);
      const holeSize = (diffusion / 100) * 1.5;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const cellNoise = Math.pow(Math.abs(Math.sin(angle * cells + seed) * Math.cos(y * cells * 0.5 + seed)), 0.5) * holeSize;
        const r = Math.sqrt(x * x + z * z) + cellNoise;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'lattice': {
      const gridDensity = Math.floor(5 + (density / 100) * 30);
      const latticeStrength = (diffusion / 100) * 0.8;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 20, true);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const angle = Math.atan2(z, x);
        const lattice = (Math.sin(angle * gridDensity + seed) * Math.sin(y * gridDensity + seed)) * latticeStrength;
        const r = Math.sqrt(x * x + z * z) + lattice;
        pos.setX(i, r * Math.cos(angle));
        pos.setZ(i, r * Math.sin(angle));
      }
      break;
    }

    case 'double_wall': {
      const gap = 0.2 + (diffusion / 100) * 2;
      const outer = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      const inner = new THREE.CylinderGeometry(topRadius - gap, bottomRadius - gap, height, segments, 1, true);
      
      // Simple merge if BufferGeometryUtils isn't available, otherwise just return outer for now
      geometry = outer; 
      break;
    }

    default:
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments);
  }

  geometry.computeVertexNormals();
  return geometry;
}