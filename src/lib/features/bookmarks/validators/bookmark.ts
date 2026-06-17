import { z } from 'zod';

// Zod schema to validate a URL.
export const urlSchema = z.url({ message: 'Invalid URL format' });

/**
 * Normalizes a URL: if it doesn't parse as a valid URL, prefixes with https://.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (urlSchema.safeParse(trimmed).success) {
    return trimmed;
  }
  const prefixed = `https://${trimmed}`;
  if (urlSchema.safeParse(prefixed).success) {
    return prefixed;
  }
  return trimmed;
}

/**
 * Checks whether a given string is a valid URL using Zod.
 */
export function validateUrl(url: string): boolean {
  const trimmed = url.trim();
  return urlSchema.safeParse(trimmed).success || urlSchema.safeParse(`https://${trimmed}`).success;
}
