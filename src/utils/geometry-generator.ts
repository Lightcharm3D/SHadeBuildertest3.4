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
  | 'double_wall';

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

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, silhouette, height, topRadius, bottomRadius, segments, seed, thickness } = params;
  
  const getProfilePoints = (steps = 60) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let r = topRadius + (bottomRadius - topRadius) * t;
      const y = -height / 2 + height * t;
      
      // Apply silhouette curves
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
      points.push(new THREE.Vector2(r, y));
    }
    return points;
  };

  let geometry: THREE.BufferGeometry;
  const profile = getProfilePoints();

  switch (type) {
    case 'ribbed_drum': {
      const count = params.ribCount || 20;
      const depth = params.ribDepth || 0.5;
      geometry = new THREE.LatheGeometry(profile, segments);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const pz = pos.getZ(i);
        const angle = Math.atan2(pz, px);
        const r = Math.sqrt(px * px + pz * pz);
        const rib = 1 + Math.sin(angle * count) * (depth / r);
        pos.setX(i, px * rib);
        pos.setZ(i, pz * rib);
      }
      break;
    }
    
    case 'spiral_twist': {
      const twist = (params.twistAngle || 360) * (Math.PI / 180);
      geometry = new THREE.LatheGeometry(profile, segments);
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

    case 'geometric_poly': {
      const sides = params.sides || 6;
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides, 1, true);
      break;
    }

    case 'lattice': {
      const density = params.gridDensity || 12;
      const geoms: THREE.BufferGeometry[] = [];
      for (let i = 0; i < density; i++) {
        const angle = (i / density) * Math.PI * 2;
        const strut = new THREE.CylinderGeometry(thickness, thickness, height, 6);
        const midR = (topRadius + bottomRadius) / 2;
        strut.rotateX(Math.atan2(bottomRadius - topRadius, height));
        strut.translate(midR * Math.cos(angle), 0, midR * Math.sin(angle));
        strut.rotateY(angle);
        geoms.push(strut);
      }
      const ringCount = Math.floor(height / 2);
      for (let i = 0; i <= ringCount; i++) {
        const t = i / ringCount;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        const ring = new THREE.TorusGeometry(r, thickness, 6, segments);
        ring.rotateX(Math.PI / 2);
        ring.translate(0, y, 0);
        geoms.push(ring);
      }
      geometry = BufferGeometryUtils.mergeGeometries(geoms);
      break;
    }
    
    default:
      geometry = new THREE.LatheGeometry(profile, segments);
  }

  // Add Internal Reinforcement Ribs
  if (params.internalRibs > 0) {
    const ribGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < params.internalRibs; i++) {
      const angle = (i / params.internalRibs) * Math.PI * 2;
      const ribWidth = params.ribThickness || 0.2;
      const ribDepth = 0.5; // 5mm deep
      const rib = new THREE.BoxGeometry(ribWidth, height, ribDepth);
      const midR = (topRadius + bottomRadius) / 2 - ribDepth / 2;
      rib.translate(0, 0, midR);
      rib.rotateY(angle);
      ribGeoms.push(rib);
    }
    const ribsMerged = BufferGeometryUtils.mergeGeometries(ribGeoms);
    geometry = BufferGeometryUtils.mergeGeometries([geometry, ribsMerged]);
  }

  // Add Fitter
  if (params.fitterType !== 'none') {
    const fitterGeom = generateFitterGeometry(params);
    geometry = BufferGeometryUtils.mergeGeometries([geometry, fitterGeom]);
  }
  
  geometry.computeVertexNormals();
  return geometry;
}

function generateFitterGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { fitterType, fitterDiameter, fitterHeight, topRadius, height } = params;
  const geoms: THREE.BufferGeometry[] = [];
  const fitterRadius = fitterDiameter / 20; 
  const yPos = height / 2 - fitterHeight;
  
  const ring = new THREE.TorusGeometry(fitterRadius, 0.15, 8, 32);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, yPos, 0);
  geoms.push(ring);
  
  const spokeCount = fitterType === 'spider' ? 3 : 4;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spokeLength = topRadius - fitterRadius;
    const spoke = new THREE.BoxGeometry(spokeLength, 0.15, 0.3);
    spoke.translate(fitterRadius + spokeLength / 2, yPos, 0);
    spoke.rotateY(angle);
    geoms.push(spoke);
  }
  
  return BufferGeometryUtils.mergeGeometries(geoms);
}