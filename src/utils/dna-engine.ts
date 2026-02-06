"use client";

import { LampshadeParams, LampshadeType, SilhouetteType } from './geometry-generator';

// Fixed order of types and silhouettes for index-based packing
const TYPES: LampshadeType[] = [
  'ribbed_drum', 'spiral_twist', 'voronoi', 'wave_shell', 'geometric_poly', 
  'lattice', 'origami', 'perlin_noise', 'slotted', 'double_wall',
  'organic_cell', 'bricks', 'petal_bloom', 'faceted_gem',
  'honeycomb', 'diamond_mesh', 'knurled', 'wave_rings',
  'triangular_lattice', 'square_grid', 'radial_spokes', 'chevron_mesh',
  'spiral_ribs', 'voronoi_wire', 'star_mesh', 'organic_mesh',
  'woven_basket', 'bubble_foam', 'parametric_fins', 'spiral_stairs',
  'diamond_plate', 'knurled_v2', 'radial_fins', 'cellular_automata',
  'voronoi_v2', 'spiral_mesh', 'diamond_lattice', 'honeycomb_v2',
  'crystal_lattice', 'organic_veins', 'geometric_tiles', 'spiral_vortex',
  'ribbed_conic', 'fractal_tree', 'geometric_weave', 'parametric_waves',
  'scalloped_edge', 'twisted_column', 'organic_coral', 'geometric_stars',
  'ribbed_spiral', 'faceted_poly', 'wave_shell_v2', 'voronoi_v3',
  'spiral_stairs_v2', 'diamond_plate_v2'
];

const SILHOUETTES: SilhouetteType[] = [
  'straight', 'hourglass', 'bell', 'convex', 'concave', 
  'tapered', 'bulbous', 'flared', 'waisted', 'asymmetric', 
  'teardrop', 'diamond', 'stepped', 'wavy',
  'ovoid', 'scalloped', 'conic_stepped', 'twisted_profile', 'fluted',
  'onion', 'pagoda', 'egg', 'barrel', 'spindle', 'chalice', 'urn',
  'pagoda_v2', 'lotus', 'diamond_v2', 'stepped_v2'
];

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Encodes a Uint8Array to a Base62 string
 */
function encodeBase62(bytes: Uint8Array): string {
  let res = "";
  for (let i = 0; i < bytes.length; i++) {
    res += BASE62[bytes[i] % 62];
    // We use a simple mapping for the "seed" look, 
    // for true large-integer base62 we'd need BigInt, 
    // but this is sufficient for a unique short string.
  }
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decodes a Base62-ish (Base64URL) string back to Uint8Array
 */
function decodeBase62(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Generates a super-short "Seed" string from parameters
 */
export const generateLampDNA = (params: LampshadeParams): string => {
  try {
    // We pack the most important 24 parameters into a binary buffer
    // Using 2 bytes (Uint16) per value for high precision in a small space
    const buffer = new ArrayBuffer(48); 
    const view = new DataView(buffer);
    
    view.setUint8(0, Math.max(0, TYPES.indexOf(params.type)));
    view.setUint8(1, Math.max(0, SILHOUETTES.indexOf(params.silhouette)));
    view.setUint16(2, Math.round(params.height * 100));
    view.setUint16(4, Math.round(params.topRadius * 100));
    view.setUint16(6, Math.round(params.bottomRadius * 100));
    view.setUint16(8, Math.round(params.thickness * 1000));
    view.setUint16(10, params.segments);
    view.setUint32(12, Math.floor(params.seed % 4294967295));
    view.setUint16(16, Math.round((params.twistAngle || 0) * 10));
    view.setUint16(18, Math.round((params.patternScale || 0) * 100));
    view.setUint16(20, Math.round((params.patternDepth || 0) * 1000));
    view.setUint16(22, Math.round((params.patternRotation || 0) * 10));
    view.setUint16(24, Math.round((params.noiseStrength || 0) * 1000));
    view.setUint16(26, Math.round((params.noiseScale || 0) * 1000));
    view.setUint16(28, Math.round((params.ribCount || 0)));
    view.setUint16(30, Math.round((params.ribDepth || 0) * 1000));
    view.setUint16(32, Math.round((params.gridDensity || 0) * 10));
    view.setUint16(34, Math.round((params.fitterDiameter || 0) * 10));
    view.setUint16(36, Math.round((params.fitterHeight || 0) * 10));
    view.setUint16(38, Math.round((params.rimThickness || 0) * 1000));
    view.setUint16(40, Math.round((params.rimHeight || 0) * 1000));
    view.setUint16(42, Math.round((params.gamma || 1.0) * 100));
    view.setUint16(44, Math.round((params.internalRibs || 0)));
    view.setUint16(46, Math.round((params.spokeCount || 4)));

    return encodeBase62(new Uint8Array(buffer));
  } catch (e) {
    console.error("Seed generation failed", e);
    return "";
  }
};

/**
 * Parses a "Seed" string back into parameters
 */
export const parseLampDNA = (input: string): LampshadeParams | null => {
  if (!input) return null;

  try {
    let dna = input.trim();
    if (dna.includes('?dna=')) dna = dna.split('?dna=')[1];
    dna = dna.split('&')[0];

    // If it looks like JSON (legacy), use old parser logic
    if (dna.startsWith('ey')) {
      const json = JSON.parse(atob(dna));
      return json as LampshadeParams;
    }

    // Binary Seed Parsing
    const bytes = decodeBase62(dna);
    if (bytes.length < 48) return null;
    const view = new DataView(bytes.buffer);

    return {
      type: TYPES[view.getUint8(0)] || 'ribbed_drum',
      silhouette: SILHOUETTES[view.getUint8(1)] || 'straight',
      height: view.getUint16(2) / 100,
      topRadius: view.getUint16(4) / 100,
      bottomRadius: view.getUint16(6) / 100,
      thickness: view.getUint16(8) / 1000,
      segments: view.getUint16(10),
      seed: view.getUint32(12),
      twistAngle: view.getUint16(16) / 10,
      patternScale: view.getUint16(18) / 100,
      patternDepth: view.getUint16(20) / 1000,
      patternRotation: view.getUint16(22) / 10,
      noiseStrength: view.getUint16(24) / 1000,
      noiseScale: view.getUint16(26) / 1000,
      ribCount: view.getUint16(28),
      ribDepth: view.getUint16(30) / 1000,
      gridDensity: view.getUint16(32) / 10,
      fitterType: 'spider', // Default
      fitterDiameter: view.getUint16(34) / 10,
      fitterOuterDiameter: 36,
      fitterRingHeight: 10,
      fitterHeight: view.getUint16(36) / 10,
      spokeThickness: 5,
      spokeWidth: 10,
      spokeCount: view.getUint16(46),
      rimThickness: view.getUint16(38) / 1000,
      rimHeight: view.getUint16(40) / 1000,
      internalRibs: view.getUint16(44),
      internalRibDepth: 0.5,
      gamma: 1.0
    } as LampshadeParams;
  } catch (e) {
    console.error("Seed parsing failed", e);
    return null;
  }
};