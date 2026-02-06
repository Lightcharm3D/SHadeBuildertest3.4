"use client";

import { LampshadeParams } from './geometry-generator';

/**
 * Serializes LampshadeParams into a compact 'Lamp DNA' string.
 */
export const generateLampDNA = (params: LampshadeParams): string => {
  try {
    const jsonString = JSON.stringify(params);
    // Use btoa for base64 encoding
    return btoa(jsonString);
  } catch (e) {
    console.error("DNA Generation failed", e);
    return "";
  }
};

/**
 * Reconstructs LampshadeParams from a 'Lamp DNA' string or a full URL containing DNA.
 */
export const parseLampDNA = (input: string): LampshadeParams | null => {
  if (!input) return null;

  try {
    let dna = input.trim();

    // 1. Handle full URLs by extracting the 'dna' parameter
    if (dna.includes('?')) {
      try {
        const url = new URL(dna.startsWith('http') ? dna : `http://x.com/${dna}`);
        const paramDna = url.searchParams.get('dna');
        if (paramDna) dna = paramDna;
      } catch (e) {
        // Not a valid URL, continue with raw string
      }
    }

    // 2. Decode URL-encoded characters (like %3D for =)
    dna = decodeURIComponent(dna);

    // 3. Clean up any remaining whitespace or invalid characters
    dna = dna.replace(/\s/g, '');

    // 4. Decode Base64
    const jsonString = atob(dna);
    
    // 5. Parse JSON
    const params = JSON.parse(jsonString);

    // Basic validation to ensure it's a valid params object
    if (params && typeof params === 'object' && params.type) {
      return params as LampshadeParams;
    }
    
    return null;
  } catch (e) {
    console.error("Invalid Lamp DNA format:", e);
    return null;
  }
};