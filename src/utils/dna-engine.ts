"use client";

import { LampshadeParams } from './geometry-generator';

// Mapping of long property names to single characters to save space
const KEY_MAP: Record<string, string> = {
  type: 'a', silhouette: 'b', height: 'c', topRadius: 'd', bottomRadius: 'e',
  thickness: 'f', segments: 'g', seed: 'h', internalRibs: 'i', ribThickness: 'j',
  rimThickness: 'k', rimHeight: 'l', internalRibDepth: 'm', fitterType: 'n',
  fitterDiameter: 'o', fitterOuterDiameter: 'p', fitterRingHeight: 'q',
  fitterHeight: 'r', spokeThickness: 's', spokeWidth: 't', spokeCount: 'u',
  ribCount: 'v', ribDepth: 'w', twistAngle: 'x', cellCount: 'y', amplitude: 'z',
  frequency: 'A', sides: 'B', gridDensity: 'C', foldCount: 'D', foldDepth: 'E',
  noiseScale: 'F', noiseStrength: 'G', noiseFrequency: 'H', slotCount: 'I',
  slotWidth: 'J', gapDistance: 'K', patternScale: 'L', patternDepth: 'M',
  patternRotation: 'N', lowDetail: 'O', splitSegments: 'P', activePart: 'Q',
  jointType: 'R'
};

// Reverse map for decoding
const REVERSE_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

/**
 * Serializes LampshadeParams into a compact 'Lamp DNA' string.
 */
export const generateLampDNA = (params: LampshadeParams): string => {
  try {
    const compact: any = {};
    
    // Map keys and round numbers to 3 decimal places to save space
    Object.entries(params).forEach(([key, value]) => {
      const shortKey = KEY_MAP[key];
      if (shortKey) {
        if (typeof value === 'number') {
          compact[shortKey] = Math.round(value * 1000) / 1000;
        } else {
          compact[shortKey] = value;
        }
      }
    });

    const jsonString = JSON.stringify(compact);
    return btoa(jsonString);
  } catch (e) {
    console.error("DNA Generation failed", e);
    return "";
  }
};

/**
 * Reconstructs LampshadeParams from a 'Lamp DNA' string or a full URL.
 */
export const parseLampDNA = (input: string): LampshadeParams | null => {
  if (!input) return null;

  try {
    let dna = input.trim();

    // 1. Handle full URLs
    if (dna.includes('?')) {
      try {
        const url = new URL(dna.startsWith('http') ? dna : `http://x.com/${dna}`);
        const paramDna = url.searchParams.get('dna');
        if (paramDna) dna = paramDna;
      } catch (e) {}
    }

    // 2. Decode URL-encoded characters
    dna = decodeURIComponent(dna);

    // 3. Clean up whitespace
    dna = dna.replace(/\s/g, '');

    // 4. Decode Base64
    const jsonString = atob(dna);
    const data = JSON.parse(jsonString);

    // 5. Detect if it's the new compact format or legacy format
    const isCompact = Object.keys(data).some(k => k.length === 1);

    if (isCompact) {
      const expanded: any = {};
      Object.entries(data).forEach(([key, value]) => {
        const longKey = REVERSE_KEY_MAP[key];
        if (longKey) expanded[longKey] = value;
      });
      return expanded as LampshadeParams;
    }

    // Legacy format support
    if (data && typeof data === 'object' && data.type) {
      return data as LampshadeParams;
    }
    
    return null;
  } catch (e) {
    console.error("Invalid Lamp DNA format:", e);
    return null;
  }
};