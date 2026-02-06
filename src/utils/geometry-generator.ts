import * as THREE from 'three';
import { mergeBufferGeometries as mergeGeometries, mergeVertices } from 'three-stdlib';

export type LampshadeType = 
  | 'plain_wall' | 'ribbed_drum' | 'spiral_twist' | 'voronoi' | 'wave_shell' | 'geometric_poly' 
  | 'lattice' | 'origami' | 'perlin_noise' | 'slotted' | 'double_wall'
  | 'organic_cell' | 'bricks' | 'petal_bloom' | 'faceted_gem'
  | 'honeycomb' | 'diamond_mesh' | 'knurled' | 'wave_rings'
  | 'triangular_lattice' | 'square_grid' | 'radial_spokes' | 'chevron_mesh'
  | 'spiral_ribs' | 'voronoi_wire' | 'star_mesh' | 'organic_mesh'
  | 'woven_basket' | 'bubble_foam' | 'parametric_fins' | 'spiral_stairs'
  | 'diamond_plate' | 'knurled_v2' | 'radial_fins' | 'cellular_automata'
  | 'voronoi_v2' | 'spiral_mesh' | 'diamond_lattice' | 'honeycomb_v2'
  | 'crystal_lattice' | 'organic_veins' | 'geometric_tiles' | 'spiral_vortex'
  | 'ribbed_conic' | 'fractal_tree' | 'geometric_weave' | 'parametric_waves'
  | 'scalloped_edge' | 'twisted_column' | 'organic_coral' | 'geometric_stars'
  | 'ribbed_spiral' | 'faceted_poly' | 'wave_shell_v2' | 'voronoi_v3'
  | 'spiral_stairs_v2' | 'diamond_plate_v2';

export type SilhouetteType = 
  | 'straight' | 'hourglass' | 'bell' | 'convex' | 'concave' 
  | 'tapered' | 'bulbous' | 'flared' | 'waisted' | 'asymmetric' 
  | 'trumpet' | 'teardrop' | 'diamond' | 'stepped' | 'wavy'
  | 'ovoid' | 'scalloped' | 'conic_stepped' | 'twisted_profile' | 'fluted'
  | 'onion' | 'pagoda' | 'egg' | 'barrel' | 'spindle' | 'chalice' | 'urn'
  | 'pagoda_v2' | 'lotus' | 'diamond_v2' | 'stepped_v2';

export type FitterType = 'none' | 'spider' | 'uno';

export interface LampshadeParams {
  type: LampshadeType;
  silhouette: SilhouetteType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  seed: number;
  
  // Structure
  internalRibs: number;
  ribThickness: number;
  rimThickness?: number;
  rimHeight?: number;
  internalRibDepth?: number;
  
  // Fitter params
  fitterType: FitterType;
  fitterDiameter: number; 
  fitterOuterDiameter: number; 
  fitterRingHeight: number; 
  fitterHeight: number;  
  spokeThickness: number; 
  spokeWidth: number;     
  spokeCount?: number;    
  
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
  noiseFrequency?: number;
  slotCount?: number;
  slotWidth?: number;
  gapDistance?: number;
  patternScale?: number;
  patternDepth?: number;
  patternRotation?: number;
  
  // Performance & Printing
  lowDetail?: boolean;
  supportFreeMode?: boolean;

  // Multi-Part Splitting
  splitSegments?: number; 
  activePart?: number;    
  jointType?: 'none' | 'tab';
}

/**
 * Enforces CAD constraints to ensure printability and physical validity.
 */
export function enforceConstraints(params: LampshadeParams): LampshadeParams {
  const p = { ...params };
  p.thickness = Math.max(0.12, p.thickness);
  p.bottomRadius = Math.max(4, p.bottomRadius);
  p.topRadius = Math.max(2, p.topRadius);
  
  const fitterY = -p.height / 2 + p.fitterHeight;
  const shadeRadiusAtFitter = getRadiusAtHeight(fitterY, p);
  const maxFitterRadius = (shadeRadiusAtFitter * 10) - 5;
  p.fitterDiameter = Math.min(p.fitterDiameter, maxFitterRadius * 2);
  p.fitterHeight = Math.min(p.height - 1, Math.max(0.5, p.fitterHeight));

  const maxDepth = Math.min(p.topRadius, p.bottomRadius) * 0.4;
  if (p.patternDepth !== undefined) p.patternDepth = Math.min(p.patternDepth, maxDepth);
  if (p.ribDepth !== undefined) p.ribDepth = Math.min(p.ribDepth, maxDepth);
  if (p.noiseStrength !== undefined) p.noiseStrength = Math.min(p.noiseStrength, maxDepth);

  if (p.internalRibs > 0) {
    p.ribThickness = Math.max(0.2, p.ribThickness);
    p.internalRibDepth = Math.max(0.2, p.internalRibDepth || 0.5);
  }

  return p;
}

export function repairGeometry(geometry: THREE.BufferGeometry, tolerance: number = 0.001): THREE.BufferGeometry {
  let repaired = mergeVertices(geometry, tolerance);
  repaired.computeVertexNormals();
  repaired.computeBoundingBox();
  repaired.computeBoundingSphere();
  return repaired;
}

function pseudoNoise(x: number, y: number, z: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return n - Math.floor(n);
}

export function getRadiusAtHeight(y: number, params: LampshadeParams): number {
  const { height, topRadius, bottomRadius, silhouette } = params;
  const t = (y + height / 2) / height;
  let r = bottomRadius + (topRadius - bottomRadius) * t;
  
  switch (silhouette) {
    case 'pagoda_v2': r *= 1 + (Math.sin(t * Math.PI * 4) * 0.1 + Math.pow(1 - t, 1.5) * 0.6); break;
    case 'lotus': r *= 1 + Math.pow(Math.sin(t * Math.PI * 0.5), 0.5) * 0.8 * (1 - t); break;
    case 'diamond_v2': r *= 1 - Math.abs(t - 0.5) * 1.2; break;
    case 'stepped_v2': r *= 1 + Math.floor(t * 12) * 0.03; break;
    case 'onion': r *= 1 + Math.sin(t * Math.PI * 0.8) * 0.7; break;
    case 'pagoda': r *= 1 + (Math.sin(t * Math.PI * 3) * 0.15 + (1 - t) * 0.4); break;
    case 'egg': r *= 1 + Math.sin(t * Math.PI) * 0.35; break;
    case 'barrel': r *= 1 + Math.sin(t * Math.PI) * 0.25; break;
    case 'spindle': r *= 1 + Math.sin(t * Math.PI) * 0.6 * (1 - Math.abs(t - 0.5) * 2); break;
    case 'chalice': r *= 1 + Math.pow(t - 0.5, 2) * 2.0; break;
    case 'urn': r *= 1 + Math.sin(t * Math.PI * 1.2) * 0.5; break;
    case 'hourglass': r *= 1 + Math.pow(Math.sin(t * Math.PI), 2) * -0.3; break;
    case 'bell': r *= 1 + Math.pow(1 - t, 2) * 0.4; break;
    case 'convex': r *= 1 + Math.sin(t * Math.PI) * 0.2; break;
    case 'concave': r *= 1 + Math.sin(t * Math.PI) * -0.2; break;
    case 'tapered': r *= 1 + (1 - t) * 0.5; break;
    case 'bulbous': r *= 1 + Math.sin(t * Math.PI) * 0.5; break;
    case 'flared': r *= 1 + Math.pow(t, 3) * 0.8; break;
    case 'waisted': r *= 1 + Math.pow(Math.sin(t * Math.PI), 4) * -0.4; break;
    case 'asymmetric': r *= 1 + Math.sin(t * Math.PI * 0.5) * 0.3; break;
    case 'trumpet': r *= 1 + Math.pow(t, 4) * 1.5; break;
    case 'teardrop': r *= 1 + Math.sin(t * Math.PI * 0.8) * 0.6; break;
    case 'diamond': r *= 1 - Math.abs(t - 0.5) * 0.8; break;
    case 'stepped': r *= 1 + Math.floor(t * 5) * 0.1; break;
    case 'wavy': r *= 1 + Math.sin(t * Math.PI * 6) * 0.1; break;
    case 'ovoid': r *= 1 + Math.sin(t * Math.PI) * 0.4; break;
    case 'scalloped': r *= 1 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.15; break;
    case 'conic_stepped': r *= 1 + Math.floor(t * 8) * 0.05; break;
    case 'twisted_profile': r *= 1 + Math.sin(t * Math.PI * 2 + (params.seed % 10)) * 0.2; break;
    case 'fluted': r *= 1 + Math.pow(Math.sin(t * Math.PI * 0.5), 0.5) * 0.3; break;
  }

  return Math.max(0.5, r);
}

function getDisplacementAt(angle: number, y: number, params: LampshadeParams): number {
  const { type, seed, height, patternRotation = 0 } = params;
  const normY = (y + height / 2) / height;
  const rotatedAngle = angle + (patternRotation * Math.PI / 180) * normY;

  let disp = 0;
  switch (type) {
    case 'plain_wall': disp = 0; break;
    case 'voronoi_v3': {
      const cells = params.cellCount || 30;
      const strength = params.noiseStrength || 1.2;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < cells; i++) {
        const a = pseudoNoise(i, 1, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(1, i, 0, seed) - 0.5) * height;
        const r = getRadiusAtHeight(h, params);
        points.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
      }
      const v = new THREE.Vector3(Math.cos(rotatedAngle) * getRadiusAtHeight(y, params), y, Math.sin(rotatedAngle) * getRadiusAtHeight(y, params));
      let minDist = Infinity;
      points.forEach(p => {
        const d = v.distanceTo(p);
        if (d < minDist) minDist = d;
      });
      disp = Math.sin(minDist * 5) * strength * 0.5;
      break;
    }
    case 'spiral_stairs_v2': {
      const steps = params.ribCount || 16;
      const depth = params.ribDepth || 1.0;
      const stepIndex = Math.floor((rotatedAngle / (Math.PI * 2)) * steps + normY * steps * 2);
      disp = (stepIndex % 3 === 0) ? depth : 0;
      break;
    }
    case 'diamond_plate_v2': {
      const scale = params.patternScale || 20;
      const depth = params.patternDepth || 0.4;
      const a = Math.sin(rotatedAngle * scale);
      const b = Math.sin(normY * scale * 3);
      disp = (Math.abs(a) > 0.7 && Math.abs(b) > 0.7) ? depth * Math.sin(rotatedAngle * 5) : 0;
      break;
    }
    case 'organic_coral': {
      const scale = params.noiseScale || 1.5;
      const strength = params.noiseStrength || 1.0;
      const n = pseudoNoise(Math.cos(rotatedAngle) * scale, y * scale, Math.sin(rotatedAngle) * scale, seed);
      disp = n > 0.6 ? (n - 0.6) * strength * 4 : 0;
      break;
    }
    case 'geometric_stars': {
      const count = params.ribCount || 6;
      const depth = params.ribDepth || 0.8;
      disp = Math.abs(Math.sin(rotatedAngle * count)) * depth;
      break;
    }
    case 'ribbed_spiral': {
      const count = params.ribCount || 12;
      const twist = (params.twistAngle || 180) * (Math.PI / 180);
      disp = Math.sin(rotatedAngle * count + normY * twist) * (params.ribDepth || 0.5);
      break;
    }
    case 'faceted_poly': {
      const sides = params.sides || 8;
      const strength = params.noiseStrength || 0.5;
      const step = (Math.PI * 2) / sides;
      const localAngle = Math.floor(rotatedAngle / step) * step;
      disp = pseudoNoise(Math.cos(localAngle), y, Math.sin(localAngle), seed) * strength;
      break;
    }
    case 'wave_shell_v2': {
      const freq = params.frequency || 12;
      const amp = params.amplitude || 0.8;
      disp = Math.sin(rotatedAngle * freq) * Math.cos(normY * freq * 0.5) * amp;
      break;
    }
    case 'ribbed_drum': disp = Math.sin(rotatedAngle * (params.ribCount || 24)) * (params.ribDepth || 0.4); break;
    case 'ribbed_conic': disp = Math.sin(rotatedAngle * (params.ribCount || 24)) * (params.ribDepth || 0.4) * normY; break;
    case 'spiral_ribs': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      disp = Math.sin(rotatedAngle * (params.ribCount || 24) + normY * twist) * (params.ribDepth || 0.4);
      break;
    }
    case 'spiral_vortex': {
      const twist = (params.twistAngle || 720) * (Math.PI / 180);
      disp = Math.sin(rotatedAngle * 5 + normY * twist) * (params.ribDepth || 0.8);
      break;
    }
    case 'wave_shell': disp = Math.sin(rotatedAngle * (params.frequency || 5) + normY * Math.PI * 2) * (params.amplitude || 1); break;
    case 'wave_rings': disp = Math.sin(normY * (params.frequency || 10) * Math.PI) * (params.amplitude || 0.5); break;
    case 'knurled': {
      const scale = params.patternScale || 10;
      const depth = params.patternDepth || 0.3;
      disp = (Math.sin(rotatedAngle * scale + normY * scale) * Math.sin(rotatedAngle * scale - normY * scale)) * depth;
      break;
    }
    case 'knurled_v2': {
      const scale = params.patternScale || 15;
      const depth = params.patternDepth || 0.4;
      const a = Math.sin(rotatedAngle * scale + normY * scale);
      const b = Math.sin(rotatedAngle * scale - normY * scale);
      disp = (Math.pow(a, 3) * Math.pow(b, 3)) * depth;
      break;
    }
    case 'bubble_foam': {
      const scale = params.patternScale || 10;
      const depth = params.patternDepth || 0.5;
      disp = (Math.sin(rotatedAngle * scale) * Math.cos(normY * scale * 2) + Math.sin(normY * scale) * Math.cos(rotatedAngle * scale * 2)) * depth;
      break;
    }
    case 'diamond_plate': {
      const scale = params.patternScale || 15;
      const depth = params.patternDepth || 0.3;
      const a = Math.sin(rotatedAngle * scale);
      const b = Math.sin(normY * scale * 2);
      disp = (Math.abs(a) > 0.8 && Math.abs(b) > 0.8) ? depth : 0;
      break;
    }
    case 'geometric_tiles': {
      const scale = params.patternScale || 12;
      const depth = params.patternDepth || 0.4;
      const a = Math.floor(rotatedAngle * scale);
      const b = Math.floor(normY * scale);
      disp = ((a + b) % 2 === 0) ? depth : -depth;
      break;
    }
    case 'cellular_automata': {
      const scale = params.patternScale || 20;
      const depth = params.patternDepth || 0.5;
      const x = Math.floor(rotatedAngle * scale);
      const yIdx = Math.floor(normY * scale);
      disp = (pseudoNoise(x, yIdx, 0, seed) > 0.6) ? depth : 0;
      break;
    }
    case 'spiral_stairs': {
      const steps = params.ribCount || 12;
      const depth = params.ribDepth || 0.8;
      const stepIndex = Math.floor((rotatedAngle / (Math.PI * 2)) * steps + normY * steps);
      disp = (stepIndex % 2 === 0) ? depth : 0;
      break;
    }
    case 'petal_bloom': {
      const petals = params.ribCount || 8;
      const bloom = normY * 2;
      disp = Math.abs(Math.sin(rotatedAngle * petals / 2)) * bloom;
      break;
    }
    case 'faceted_gem': disp = pseudoNoise(Math.cos(rotatedAngle), y, Math.sin(rotatedAngle), seed) * (params.noiseStrength || 0.5); break;
    case 'organic_cell':
    case 'perlin_noise': {
      const scale = params.noiseScale || 0.5;
      const strength = params.noiseStrength || 0.5;
      const freq = params.noiseFrequency || 1.0;
      disp = (
        pseudoNoise(Math.cos(rotatedAngle) * scale * freq, y * scale * freq, Math.sin(rotatedAngle) * scale * freq, seed) * 0.6 +
        pseudoNoise(Math.cos(rotatedAngle) * scale * 2 * freq, y * scale * 2 * freq, Math.sin(rotatedAngle) * scale * 2 * freq, seed) * 0.4
      ) * strength;
      break;
    }
    case 'organic_veins': {
      const scale = params.noiseScale || 1.0;
      const strength = params.noiseStrength || 0.8;
      const n = pseudoNoise(Math.cos(rotatedAngle) * scale, y * scale, Math.sin(rotatedAngle) * scale, seed);
      disp = n > 0.7 ? (n - 0.7) * strength * 5 : 0;
      break;
    }
    case 'voronoi_v2': {
      const cells = params.cellCount || 20;
      const strength = params.noiseStrength || 1.0;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < cells; i++) {
        const a = pseudoNoise(i, 0, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(0, i, 0, seed) - 0.5) * height;
        const r = getRadiusAtHeight(h, params);
        points.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
      }
      const v = new THREE.Vector3(Math.cos(rotatedAngle) * getRadiusAtHeight(y, params), y, Math.sin(rotatedAngle) * getRadiusAtHeight(y, params));
      let minDist = Infinity;
      let secondMinDist = Infinity;
      points.forEach(p => {
        const d = v.distanceTo(p);
        if (d < minDist) { secondMinDist = minDist; minDist = d; } 
        else if (d < secondMinDist) { secondMinDist = d; }
      });
      disp = (secondMinDist - minDist) * strength * -0.5;
      break;
    }
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 0.8;
      const segmentIndex = Math.round((rotatedAngle / (Math.PI * 2)) * (folds * 2));
      disp = segmentIndex % 2 !== 0 ? -depth : 0;
      break;
    }
    case 'voronoi': {
      const cells = params.cellCount || 12;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < cells; i++) {
        const a = pseudoNoise(i, 0, 0, seed) * Math.PI * 2;
        const h = (pseudoNoise(0, i, 0, seed) - 0.5) * height;
        const r = getRadiusAtHeight(h, params);
        points.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
      }
      const v = new THREE.Vector3(Math.cos(rotatedAngle) * getRadiusAtHeight(y, params), y, Math.sin(rotatedAngle) * getRadiusAtHeight(y, params));
      let minDist = Infinity;
      points.forEach(p => {
        const d = v.distanceTo(p);
        if (d < minDist) minDist = d;
      });
      disp = -Math.exp(-minDist * 0.5) * 1.5;
      break;
    }
    case 'parametric_waves': {
      const freq = params.frequency || 8;
      const amp = params.amplitude || 0.6;
      disp = Math.sin(rotatedAngle * freq + normY * Math.PI * 4) * Math.cos(normY * freq) * amp;
      break;
    }
    case 'scalloped_edge': {
      const count = params.ribCount || 12;
      const depth = params.ribDepth || 0.5;
      disp = Math.abs(Math.sin(rotatedAngle * count)) * depth * normY;
      break;
    }
    case 'twisted_column': {
      const twist = (params.twistAngle || 180) * (Math.PI / 180);
      const count = params.ribCount || 6;
      disp = Math.sin(rotatedAngle * count + normY * twist) * (params.ribDepth || 0.8);
      break;
    }
  }

  return disp;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const p = enforceConstraints(params);
  const { type, height, bottomRadius, segments, thickness, lowDetail, splitSegments = 1, activePart = 0, jointType = 'none', supportFreeMode } = p;
  
  const detailFactor = lowDetail ? 0.5 : 1.0;
  const effectiveSegments = Math.max(12, Math.round(segments * detailFactor));
  const effectiveSteps = Math.max(20, Math.round(60 * detailFactor));

  const phiLength = (Math.PI * 2) / splitSegments;
  const phiStart = activePart * phiLength;

  const getClosedProfilePoints = (steps = effectiveSteps, customThickness?: number) => {
    const points = [];
    const tVal = customThickness || thickness;
    const dy = height / steps;
    
    let lastR = bottomRadius;
    const profileRadii: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const y = -height / 2 + height * (i / steps);
      let r = getRadiusAtHeight(y, p);
      if (supportFreeMode) {
        r = Math.max(lastR - dy, Math.min(lastR + dy, r));
      }
      profileRadii.push(r);
      lastR = r;
    }

    for (let i = 0; i <= steps; i++) {
      const y = -height / 2 + height * (i / steps);
      points.push(new THREE.Vector2(Math.max(0.1, profileRadii[i]), y));
    }
    for (let i = steps; i >= 0; i--) {
      const y = -height / 2 + height * (i / steps);
      points.push(new THREE.Vector2(Math.max(0.05, profileRadii[i] - tVal), y));
    }
    points.push(points[0].clone());
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const closedProfile = getClosedProfilePoints();

  const createStrut = (start: THREE.Vector3, end: THREE.Vector3, radius: number) => {
    const dist = start.distanceTo(end);
    const strut = new THREE.CylinderGeometry(radius, radius, dist, lowDetail ? 4 : 6);
    strut.translate(0, dist / 2, 0);
    strut.rotateX(Math.PI / 2);
    strut.lookAt(end.clone().sub(start));
    strut.translate(start.x, start.y, start.z);
    return strut;
  };

  const isAngleInPart = (angle: number) => {
    if (splitSegments <= 1) return true;
    let normalizedAngle = angle % (Math.PI * 2);
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    return normalizedAngle >= phiStart && normalizedAngle <= phiStart + phiLength;
  };

  const fallbackWall = new THREE.LatheGeometry(closedProfile, effectiveSegments, phiStart, phiLength);

  switch (type) {
    case 'bricks': {
      const scale = Math.round((p.patternScale || 12) * detailFactor);
      const geoms: THREE.BufferGeometry[] = [];
      const brickHeight = height / scale;
      const brickWidth = (Math.PI * 2) / scale;
      const brickThick = thickness;
      
      for (let j = 0; j < scale; j++) {
        const y = -height / 2 + j * brickHeight + brickHeight / 2;
        const offset = (j % 2 === 0) ? 0 : brickWidth / 2;
        for (let i = 0; i < scale; i++) {
          const angle = i * brickWidth + offset;
          if (!isAngleInPart(angle)) continue;
          
          const r = getRadiusAtHeight(y, p);
          // Create a brick as a small box segment
          const brick = new THREE.BoxGeometry(r * brickWidth * 0.9, brickHeight * 0.9, brickThick, 2, 2, 1);
          brick.translate(0, 0, r);
          brick.rotateY(angle);
          brick.translate(0, y, 0);
          geoms.push(brick);
        }
      }
      geometry = geoms.length > 0 ? mergeGeometries(geoms) : fallbackWall;
      break;
    }
    case 'fractal_tree': {
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      const levels = lowDetail ? 3 : 4;
      const generateBranch = (start: THREE.Vector3, dir: THREE.Vector3, length: number, level: number) => {
        if (level === 0) return;
        const end = start.clone().add(dir.clone().multiplyScalar(length));
        geoms.push(createStrut(start, end, strutRadius * (level / levels)));
        const count = lowDetail ? 2 : 3;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const newDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5);
          generateBranch(end, newDir, length * 0.7, level - 1);
        }
      };
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        if (!isAngleInPart(angle)) continue;
        const r = getRadiusAtHeight(-height / 2, p);
        const start = new THREE.Vector3(Math.cos(angle) * r, -height / 2, Math.sin(angle) * r);
        generateBranch(start, new THREE.Vector3(0, 1, 0), height / 3, levels);
      }
      geometry = geoms.length > 0 ? mergeGeometries(geoms) : fallbackWall;
      break;
    }
    case 'geometric_weave': {
      const density = Math.round((p.gridDensity || 15) * detailFactor);
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / effectiveSegments;
      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        for (let i = 0; i < effectiveSegments; i++) {
          const angle = i * aStep;
          if (!isAngleInPart(angle)) continue;
          const r = getRadiusAtHeight(y, p);
          const p1 = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
          if (j < density) {
            const ny = y + hStep;
            const nr = getRadiusAtHeight(ny, p);
            const pUp = new THREE.Vector3(Math.cos(angle + aStep * 0.5) * nr, ny, Math.sin(angle + aStep * 0.5) * nr);
            const pUpPrev = new THREE.Vector3(Math.cos(angle - aStep * 0.5) * nr, ny, Math.sin(angle - aStep * 0.5) * nr);
            geoms.push(createStrut(p1, pUp, strutRadius));
            geoms.push(createStrut(p1, pUpPrev, strutRadius));
          }
        }
      }
      geometry = geoms.length > 0 ? mergeGeometries(geoms) : fallbackWall;
      break;
    }
    case 'diamond_lattice':
    case 'spiral_mesh':
    case 'crystal_lattice': {
      const density = Math.round((p.gridDensity || 12) * detailFactor);
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 1.5;
      const hStep = height / density;
      const aStep = (Math.PI * 2) / effectiveSegments;
      const twist = (p.twistAngle || 360) * (Math.PI / 180);
      for (let j = 0; j <= density; j++) {
        const y = -height / 2 + j * hStep;
        const normY = j / density;
        for (let i = 0; i < effectiveSegments; i++) {
          const angle = i * aStep + normY * twist;
          if (!isAngleInPart(angle)) continue;
          const r = getRadiusAtHeight(y, p);
          const p1 = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
          if (j < density) {
            const ny = y + hStep;
            const nNormY = (j + 1) / density;
            const nr = getRadiusAtHeight(ny, p);
            const nAngle1 = i * aStep + nNormY * twist;
            const pUp1 = new THREE.Vector3(Math.cos(nAngle1) * nr, ny, Math.sin(nAngle1) * nr);
            geoms.push(createStrut(p1, pUp1, strutRadius));
            if (type === 'diamond_lattice' || type === 'crystal_lattice') {
              const nAngle2 = (i + 1) * aStep + nNormY * twist;
              const pUp2 = new THREE.Vector3(Math.cos(nAngle2) * nr, ny, Math.sin(nAngle2) * nr);
              geoms.push(createStrut(p1, pUp2, strutRadius));
            }
          }
        }
      }
      geometry = geoms.length > 0 ? mergeGeometries(geoms) : fallbackWall;
      break;
    }
    case 'plain_wall':
    case 'organic_coral':
    case 'geometric_stars':
    case 'ribbed_spiral':
    case 'faceted_poly':
    case 'wave_shell_v2':
    case 'faceted_gem':
    case 'knurled':
    case 'knurled_v2':
    case 'wave_rings':
    case 'petal_bloom':
    case 'organic_cell':
    case 'perlin_noise':
    case 'wave_shell':
    case 'voronoi':
    case 'voronoi_v2':
    case 'voronoi_v3':
    case 'origami':
    case 'ribbed_drum':
    case 'ribbed_conic':
    case 'spiral_ribs':
    case 'spiral_vortex':
    case 'bubble_foam':
    case 'diamond_plate':
    case 'diamond_plate_v2':
    case 'geometric_tiles':
    case 'spiral_stairs':
    case 'spiral_stairs_v2':
    case 'cellular_automata':
    case 'organic_veins':
    case 'parametric_waves':
    case 'scalloped_edge':
    case 'twisted_column': {
      const segs = type === 'origami' ? (p.foldCount || 12) * 2 : effectiveSegments;
      geometry = new THREE.LatheGeometry(closedProfile, segs, phiStart, phiLength);
      const pos = geometry.attributes.position;
      const dy = height / effectiveSteps;
      const profilePointsCount = closedProfile.length;

      for (let s = 0; s <= segs; s++) {
        let lastTotalR = -1;
        for (let j = 0; j <= effectiveSteps; j++) {
          const outerIdx = s * profilePointsCount + j;
          const innerIdx = s * profilePointsCount + (profilePointsCount - 1 - j);

          if (outerIdx >= pos.count || innerIdx >= pos.count) continue;

          const px = pos.getX(outerIdx);
          const py = pos.getY(outerIdx);
          const pz = pos.getZ(outerIdx);
          const angle = Math.atan2(pz, px);
          const baseR = Math.sqrt(px * px + pz * pz);
          
          let disp = getDisplacementAt(angle, py, p);
          let totalR = baseR + disp;

          if (supportFreeMode && lastTotalR !== -1) {
            totalR = Math.max(lastTotalR - dy, Math.min(lastTotalR + dy, totalR));
          }

          const outerFactor = totalR / baseR;
          pos.setX(outerIdx, px * outerFactor);
          pos.setZ(outerIdx, pz * outerFactor);

          const innerPx = pos.getX(innerIdx);
          const innerPz = pos.getZ(innerIdx);
          const innerBaseR = Math.sqrt(innerPx * innerPx + innerPz * innerPz);
          const innerTotalR = Math.max(0.05, totalR - thickness);
          const innerFactor = innerTotalR / innerBaseR;
          pos.setX(innerIdx, innerPx * innerFactor);
          pos.setZ(innerIdx, innerPz * innerFactor);

          lastTotalR = totalR;
        }
      }
      break;
    }
    case 'slotted': {
      const count = p.slotCount || 16;
      const finThick = p.slotWidth || thickness;
      const geoms: THREE.BufferGeometry[] = [];
      const coreScale = 0.8; 
      const coreProfile = getClosedProfilePoints(Math.round(40 * detailFactor), thickness);
      const coreGeom = new THREE.LatheGeometry(coreProfile, effectiveSegments, phiStart, phiLength);
      coreGeom.scale(coreScale, 1, coreScale); 
      geoms.push(coreGeom);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        if (!isAngleInPart(angle)) continue;
        const baseR = getRadiusAtHeight(0, p); 
        const finDepth = baseR * (1 - coreScale) + 0.5; 
        const finGeom = new THREE.BoxGeometry(finDepth, height, finThick, 1, Math.round(32 * detailFactor), 1);
        const pos = finGeom.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const r = getRadiusAtHeight(py, p);
          const px = pos.getX(j);
          if (px > 0) pos.setX(j, r);
          else pos.setX(j, r * coreScale + 0.01); 
        }
        finGeom.rotateY(angle);
        geoms.push(finGeom);
      }
      geometry = geoms.length > 0 ? mergeGeometries(geoms) : fallbackWall;
      break;
    }
    case 'double_wall': {
      const gap = p.gapDistance || 0.5;
      const outerGeom = new THREE.LatheGeometry(getClosedProfilePoints(effectiveSteps, thickness), effectiveSegments, phiStart, phiLength);
      const innerGeom = new THREE.LatheGeometry(getClosedProfilePoints(effectiveSteps, thickness), effectiveSegments, phiStart, phiLength);
      innerGeom.scale(1 - (gap / p.topRadius), 1, 1 - (gap / p.topRadius));
      geometry = mergeGeometries([outerGeom, innerGeom]);
      break;
    }
    case 'geometric_poly': {
      const sides = p.sides || 6;
      geometry = new THREE.LatheGeometry(closedProfile, sides, phiStart, phiLength);
      break;
    }
    case 'lattice': {
      const density = Math.round((p.gridDensity || 12) * detailFactor);
      const geoms: THREE.BufferGeometry[] = [];
      const strutRadius = thickness / 2;
      for (let i = 0; i < density; i++) {
        const angle = (i / density) * Math.PI * 2;
        if (!isAngleInPart(angle)) continue;
        const strut1 = new THREE.CylinderGeometry(strutRadius, strutRadius, height * 1.1, lowDetail ? 4 : 6, Math.round(32 * detailFactor));
        const pos1 = strut1.attributes.position;
        for (let j = 0; j < pos1.count; j++) {
          const py = pos1.getY(j);
          const t = (py + height / 2) / height;
          const r = getRadiusAtHeight(py, p);
          const twist = t * (Math.PI * 2 / density) * 2;
          const curAngle = angle + twist;
          pos1.setXYZ(j, Math.cos(curAngle) * r, py, Math.sin(curAngle) * r);
        }
        geoms.push(strut1);
        const strut2 = new THREE.CylinderGeometry(strutRadius, strutRadius, height * 1.1, lowDetail ? 4 : 6, Math.round(32 * detailFactor));
        const pos2 = strut2.attributes.position;
        for (let j = 0; j < pos2.count; j++) {
          const py = pos2.getY(j);
          const t = (py + height / 2) / height;
          const r = getRadiusAtHeight(py, p);
          const twist = -t * (Math.PI * 2 / density) * 2;
          const curAngle = angle + twist;
          pos2.setXYZ(j, Math.cos(curAngle) * r, py, Math.sin(curAngle) * r);
        }
        geoms.push(strut2);
      }
      geometry = geoms.length > 0 ? mergeGeometries(geoms) : fallbackWall;
      break;
    }
    case 'spiral_twist': {
      const twist = (p.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(closedProfile, effectiveSegments, phiStart, phiLength);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const py = pos.getY(i);
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const normY = (py + height / 2) / height;
        const angle = normY * twist;
        const newX = px * Math.cos(angle) - pz * Math.sin(angle);
        const newZ = px * Math.sin(angle) + pz * Math.cos(angle);
        pos.setXYZ(i, newX, py, newZ);
      }
      break;
    }
    default: geometry = fallbackWall;
  }

  if (p.rimThickness && p.rimThickness > 0) {
    const rimGeoms: THREE.BufferGeometry[] = [];
    const rimThick = p.rimThickness;
    const rimHeight = p.rimHeight || rimThick;
    const segs = type === 'geometric_poly' ? (p.sides || 6) : effectiveSegments;
    
    const topRadiusAtEdge = getRadiusAtHeight(height / 2, p);
    const topRimProfile = [
      new THREE.Vector2(topRadiusAtEdge - rimThick, height / 2),
      new THREE.Vector2(topRadiusAtEdge, height / 2),
      new THREE.Vector2(topRadiusAtEdge, height / 2 + rimHeight),
      new THREE.Vector2(topRadiusAtEdge - rimThick, height / 2 + rimHeight),
      new THREE.Vector2(topRadiusAtEdge - rimThick, height / 2)
    ];
    rimGeoms.push(new THREE.LatheGeometry(topRimProfile, segs, phiStart, phiLength));

    const bottomRadiusAtEdge = getRadiusAtHeight(-height / 2, p);
    const bottomRimProfile = [
      new THREE.Vector2(bottomRadiusAtEdge - rimThick, -height / 2),
      new THREE.Vector2(bottomRadiusAtEdge, -height / 2),
      new THREE.Vector2(bottomRadiusAtEdge, -height / 2 - rimHeight),
      new THREE.Vector2(bottomRadiusAtEdge - rimThick, -height / 2 - rimHeight),
      new THREE.Vector2(bottomRadiusAtEdge - rimThick, -height / 2)
    ];
    rimGeoms.push(new THREE.LatheGeometry(bottomRimProfile, segs, phiStart, phiLength));
    geometry = mergeGeometries([geometry, ...rimGeoms]);
  }

  if (p.internalRibs > 0) {
    const ribGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < p.internalRibs; i++) {
      const angle = (i / p.internalRibs) * Math.PI * 2;
      if (!isAngleInPart(angle)) continue;
      const ribWidth = p.ribThickness || 0.2;
      const ribDepth = p.internalRibDepth || 0.5;
      const rib = new THREE.BoxGeometry(ribWidth, height, ribDepth, 1, Math.round(32 * detailFactor), 1);
      const pos = rib.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const py = pos.getY(j);
        const r = getRadiusAtHeight(py, p) - thickness;
        const pz = pos.getZ(j);
        if (pz > 0) pos.setZ(j, r + 0.01); 
        else pos.setZ(j, r - ribDepth);
      }
      rib.rotateY(angle);
      ribGeoms.push(rib);
    }
    if (ribGeoms.length > 0) geometry = mergeGeometries([geometry, ...ribGeoms]);
  }

  if (p.fitterType !== 'none' && activePart === 0) {
    const fitterGeom = generateFitterGeometry(p);
    geometry = mergeGeometries([geometry, fitterGeom]);
  }
  
  geometry.computeVertexNormals();
  return repairGeometry(geometry);
}

function generateFitterGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { fitterType, fitterDiameter, fitterOuterDiameter, fitterRingHeight, fitterHeight, height, thickness, type, sides = 6, lowDetail } = params;
  const detailFactor = lowDetail ? 0.5 : 1.0;
  const geoms: THREE.BufferGeometry[] = [];
  
  const innerRadius = fitterDiameter / 20; 
  const outerRadius = fitterOuterDiameter / 20;
  const ringHeightCm = fitterRingHeight / 10;
  const spokeThickCm = (params.spokeThickness || 5) / 10;
  const spokeYPos = -height / 2 + fitterHeight + spokeThickCm / 2;
  const ringYPos = -height / 2 + fitterHeight + ringHeightCm / 2;

  const ringProfile = [
    new THREE.Vector2(innerRadius, -ringHeightCm / 2),
    new THREE.Vector2(outerRadius, -ringHeightCm / 2),
    new THREE.Vector2(outerRadius, ringHeightCm / 2),
    new THREE.Vector2(innerRadius, ringHeightCm / 2),
    new THREE.Vector2(innerRadius, -ringHeightCm / 2)
  ];
  const ring = new THREE.LatheGeometry(ringProfile, Math.round(64 * detailFactor));
  ring.translate(0, ringYPos, 0);
  geoms.push(ring);

  const wallThicknessCm = thickness;
  const safetyMarginCm = 0.05; 
  const connectionOverlapCm = 0.2; 
  let spokeCount = params.spokeCount || 4;
  const fuseDepthCm = wallThicknessCm * 0.5;

  for (let i = 0; i < spokeCount; i++) {
    let angle = (i / spokeCount) * Math.PI * 2;
    if (type === 'geometric_poly') {
      const step = (Math.PI * 2) / sides;
      angle = Math.round(angle / step) * step;
    }
    
    const maxPossibleLength = (params.bottomRadius + params.topRadius) * 2;
    const spoke = new THREE.BoxGeometry(maxPossibleLength, spokeThickCm, (params.spokeWidth || 10) / 10, Math.round(60 * detailFactor), 1, 1);
    spoke.translate(outerRadius + maxPossibleLength / 2 - connectionOverlapCm, spokeYPos, 0);
    spoke.rotateY(angle);
    
    const pos = spoke.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const vx = pos.getX(j);
      const vy = pos.getY(j);
      const vz = pos.getZ(j);
      const currentR = Math.sqrt(vx * vx + vz * vz);
      const currentAngle = Math.atan2(vz, vx);
      
      let baseR = getRadiusAtHeight(vy, params);
      let disp = getDisplacementAt(currentAngle, vy, params);
      
      if (type === 'slotted') { baseR *= 0.8; disp = 0; } 
      else if (type === 'double_wall') { const gap = params.gapDistance || 0.5; baseR *= (1 - (gap / params.topRadius)); }
      
      const localOuterR = baseR + disp;
      const localInnerR = localOuterR - wallThicknessCm;
      const absoluteLimitR = localOuterR - safetyMarginCm;
      const targetFusionR = localInnerR + fuseDepthCm;
      const safeR = Math.min(targetFusionR, absoluteLimitR);
      
      if (currentR > outerRadius + 0.01) {
        const factor = safeR / currentR;
        if (factor < 1.0) { pos.setX(j, vx * factor); pos.setZ(j, vz * factor); }
      }
    }
    geoms.push(spoke);
  }
  return mergeGeometries(geoms);
}