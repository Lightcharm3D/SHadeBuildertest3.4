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
  | 'organic_cell';

export type SilhouetteType = 'straight' | 'hourglass' | 'bell' | 'convex' | 'concave';
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
  
  // Fitter params
  fitterType: FitterType;
  fitterDiameter: number;
  fitterHeight: number; 
  
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
}

function pseudoNoise(x: number, y: number, z: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function getRadiusAtHeight(y: number, params: LampshadeParams): number {
  const { height, topRadius, bottomRadius, silhouette } = params;
  const t = (y + height / 2) / height;
  let r = topRadius + (bottomRadius - topRadius) * t;
  
  switch (silhouette) {
    case 'hourglass':
      r *= 1 + Math.pow(Math.sin(t * Math.PI), 2) * -0.3;
      break;
    case 'bell':
      r *= 1 + Math.pow(1 - t, 2) * 0.4;
      break;
    case 'convex':
      r *= 1 + Math.sin(t * Math.PI) * 0.2;
      break;
    case 'concave':
      r *= 1 + Math.sin(t * Math.PI) * -0.2;
      break;
  }
  return r;
}

// Helper to get displacement at a specific point for fitter calculations
function getDisplacementAt(angle: number, y: number, params: LampshadeParams): number {
  const { type, seed, height } = params;
  const normY = (y + height / 2) / height;
  const rBase = getRadiusAtHeight(y, params);

  switch (type) {
    case 'ribbed_drum':
      return Math.sin(angle * (params.ribCount || 20)) * (params.ribDepth || 0.5);
    case 'wave_shell':
      return Math.sin(angle * (params.frequency || 8) + normY * Math.PI * 2) * (params.amplitude || 0.5);
    case 'organic_cell':
    case 'perlin_noise': {
      const scale = params.noiseScale || 1.5;
      const strength = params.noiseStrength || 0.4;
      return (
        pseudoNoise(Math.cos(angle) * scale, y * scale, Math.sin(angle) * scale, seed) * 0.6 +
        pseudoNoise(Math.cos(angle) * scale * 2, y * scale * 2, Math.sin(angle) * scale * 2, seed) * 0.4
      ) * strength;
    }
    case 'origami': {
      const folds = params.foldCount || 12;
      const depth = params.foldDepth || 0.8;
      const segmentIndex = Math.round((angle / (Math.PI * 2)) * (folds * 2));
      return segmentIndex % 2 !== 0 ? -depth : 0;
    }
    case 'spiral_twist':
      return 0; // Twist doesn't change radius
    default:
      return 0;
  }
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, seed, thickness } = params;
  
  const getClosedProfilePoints = (steps = 60, customThickness?: number) => {
    const points = [];
    const tVal = customThickness || thickness;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -height / 2 + height * t;
      points.push(new THREE.Vector2(Math.max(0.1, getRadiusAtHeight(y, params)), y));
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const y = -height / 2 + height * t;
      points.push(new THREE.Vector2(Math.max(0.05, getRadiusAtHeight(y, params) - tVal), y));
    }
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const closedProfile = getClosedProfilePoints();

  switch (type) {
    case 'organic_cell':
    case 'perlin_noise':
    case 'wave_shell':
    case 'ribbed_drum': {
      geometry = new THREE.LatheGeometry(closedProfile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const r = Math.sqrt(px * px + pz * pz);
        const disp = getDisplacementAt(angle, py, params);
        const factor = (r + disp) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'slotted': {
      const count = params.slotCount || 16;
      const geoms: THREE.BufferGeometry[] = [];
      const coreOffset = 0.8; 
      
      const coreProfile = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const y = -height / 2 + height * t;
        coreProfile.push(new THREE.Vector2(getRadiusAtHeight(y, params) - coreOffset, y));
      }
      for (let i = 40; i >= 0; i--) {
        const t = i / 40;
        const y = -height / 2 + height * t;
        coreProfile.push(new THREE.Vector2(getRadiusAtHeight(y, params) - coreOffset - thickness, y));
      }
      geoms.push(new THREE.LatheGeometry(coreProfile, segments));

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const finDepth = coreOffset + 0.5; 
        // Use high height segments so fins follow silhouette curvature
        const finGeom = new THREE.BoxGeometry(finDepth, height, thickness, 1, 32, 1);
        const pos = finGeom.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const py = pos.getY(j);
          const r = getRadiusAtHeight(py, params);
          const px = pos.getX(j);
          // Align fin to core with slight overlap for manifold geometry
          if (px > 0) pos.setX(j, r);
          else pos.setX(j, r - finDepth + 0.01); 
        }
        finGeom.rotateY(angle);
        geoms.push(finGeom);
      }

      const ringTop = new THREE.TorusGeometry(topRadius - thickness/2, thickness, 8, segments);
      ringTop.rotateX(Math.PI / 2);
      ringTop.translate(0, height / 2, 0);
      geoms.push(ringTop);

      const ringBottom = new THREE.TorusGeometry(bottomRadius - thickness/2, thickness, 8, segments);
      ringBottom.rotateX(Math.PI / 2);
      ringBottom.translate(0, -height / 2, 0);
      geoms.push(ringBottom);

      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }

    case 'origami': {
      const folds = params.foldCount || 12;
      geometry = new THREE.LatheGeometry(closedProfile, folds * 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const r = Math.sqrt(px * px + pz * pz);
        const disp = getDisplacementAt(angle, py, params);
        const factor = (r + disp) / r;
        pos.setX(i, px * factor);
        pos.setZ(i, pz * factor);
      }
      break;
    }

    case 'spiral_twist': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(closedProfile, segments);
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
    
    default:
      geometry = new THREE.LatheGeometry(closedProfile, segments);
  }

  if (params.internalRibs > 0) {
    const ribGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < params.internalRibs; i++) {
      const angle = (i / params.internalRibs) * Math.PI * 2;
      const ribWidth = params.ribThickness || 0.2;
      const ribDepth = 0.5;
      const rib = new THREE.BoxGeometry(ribWidth, height, ribDepth, 1, 32, 1);
      const pos = rib.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const py = pos.getY(j);
        const r = getRadiusAtHeight(py, params) - thickness;
        const pz = pos.getZ(j);
        if (pz > 0) pos.setZ(j, r);
        else pos.setZ(j, r - ribDepth);
      }
      rib.rotateY(angle);
      ribGeoms.push(rib);
    }
    geometry = BufferGeometryUtils.mergeGeometries([geometry, ...ribGeoms]);
  }

  if (params.fitterType !== 'none') {
    const fitterGeom = generateFitterGeometry(params);
    geometry = BufferGeometryUtils.mergeGeometries([geometry, fitterGeom]);
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

function generateFitterGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { fitterType, fitterDiameter, fitterHeight, height, thickness } = params;
  const geoms: THREE.BufferGeometry[] = [];
  const fitterRadius = fitterDiameter / 20; 
  const yPos = height / 2 - fitterHeight;
  const baseRadius = getRadiusAtHeight(yPos, params);
  
  const ring = new THREE.TorusGeometry(fitterRadius, 0.15, 8, 32);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, yPos, 0);
  geoms.push(ring);
  
  const spokeCount = fitterType === 'spider' ? 3 : 4;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const disp = getDisplacementAt(angle, yPos, params);
    const targetRadius = baseRadius + disp - thickness - 0.05;
    const spokeLength = Math.max(0.1, targetRadius - fitterRadius);
    
    const spoke = new THREE.BoxGeometry(spokeLength, 0.15, 0.3);
    spoke.translate(fitterRadius + spokeLength / 2, yPos, 0);
    spoke.rotateY(angle);
    geoms.push(spoke);
  }
  
  return BufferGeometryUtils.mergeGeometries(geoms);
}