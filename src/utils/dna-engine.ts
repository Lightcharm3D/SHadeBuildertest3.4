"use client";

import { LampshadeParams } from './geometry-generator';

/**
 * Serializes LampshadeParams into a compact 'Lamp DNA' string.
 * This allows users to share their exact designs via a short code.
 */
export const generateLampDNA = (params: LampshadeParams): string => {
  try {
    const jsonString = JSON.stringify(params);
    return btoa(jsonString);
  } catch (e) {
    console.error("DNA Generation failed", e);
    return "";
  }
};

/**
 * Reconstructs LampshadeParams from a 'Lamp DNA' string.
 */
export const parseLampDNA = (dna: string): LampshadeParams | null => {
  try {
    const jsonString = atob(dna);
    return JSON.parse(jsonString) as LampshadeParams;
  } catch (e) {
    console.error("Invalid Lamp DNA", e);
    return null;
  }
};