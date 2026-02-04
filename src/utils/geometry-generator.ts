import * as THREE from 'three';

export type LampshadeType = 'drum' | 'dome' | 'spiral' | 'twisted' | 'wave' | 'ribbed' | 'lattice';

export interface LampshadeParams {
  type: LampshadeType;
  height: number;
  topRadius: number;
  bottomRadius: number;
  thickness: number;
  segments: number;
  twist: number;
  density: number;
  seed: number;
}

export function generateLampshadeGeometry(params: LampshadeParams): THREE.BufferGeometry {
  const { type, height, topRadius, bottomRadius, segments, twist, density, seed } = params;
  
  let geometry: THREE.BufferGeometry;

  switch (type) {
    case 'drum':
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments, 1, true);
      break;
    
    case 'dome':
      // Create a profile for a dome
      const domePoints = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const angle = t * Math.PI / 2;
        const r = bottomRadius * Math.cos(angle);
        const y = height * Math.sin(angle);
        domePoints.push(new THREE.Vector2(r, y));
      }
      geometry = new THREE.LatheGeometry(domePoints, segments);
      break;

    case 'spiral':
    case 'twisted':
      // Custom parametric geometry for twisted shapes
      const twistedPoints = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        twistedPoints.push(new THREE.Vector2(r, y));
      }
      geometry = new THREE.LatheGeometry(twistedPoints, segments);
      
      // Apply twist
      const position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);
        
        const normalizedY = (y + height / 2) / height;
        const angle = normalizedY * twist * (Math.PI / 180);
        
        const newX = x * Math.cos(angle) - z * Math.sin(angle);
        const newZ = x * Math.sin(angle) + z * Math.cos(angle);
        
        position.setXYZ(i, newX, y, newZ);
      }
      break;

    case 'wave':
      const wavePoints = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const rBase = topRadius + (bottomRadius - topRadius) * t;
        const wave = Math.sin(t * Math.PI * density + seed) * (rBase * 0.2);
        const r = rBase + wave;
        const y = -height / 2 + height * t;
        wavePoints.push(new THREE.Vector2(r, y));
      }
      geometry = new THREE.LatheGeometry(wavePoints, segments);
      break;

    case 'ribbed':
      const ribbedPoints = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const r = topRadius + (bottomRadius - topRadius) * t;
        const y = -height / 2 + height * t;
        ribbedPoints.push(new THREE.Vector2(r, y));
      }
      geometry = new THREE.LatheGeometry(ribbedPoints, segments);
      
      // Add ribs
      const ribPos = geometry.attributes.position;
      for (let i = 0; i < ribPos.count; i++) {
        const x = ribPos.getX(i);
        const y = ribPos.getY(i);
        const z = ribPos.getZ(i);
        
        const angle = Math.atan2(z, x);
        const ribFactor = 1 + Math.sin(angle * density) * 0.05;
        
        ribPos.setXYZ(i, x * ribFactor, y, z * ribFactor);
      }
      break;

    default:
      geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments);
  }

  geometry.computeVertexNormals();
  return geometry;
}