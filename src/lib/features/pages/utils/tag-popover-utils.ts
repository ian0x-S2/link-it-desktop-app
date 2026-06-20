import type { PageMetadata } from '../types/page';

const MAX_SUGGESTIONS = 8;

/**
 * Collects all unique tags from a list of pages, sorted alphabetically.
 */
export function getAllUniqueTags(items: PageMetadata[]): string[] {
  const tagSet = new Set<string>();
  for (const p of items) {
    if (p.tags) {
      for (const t of p.tags) {
        tagSet.add(t);
      }
    }
  }
  return [...tagSet].sort();
}

/**
 * Returns tag suggestions filtered by query and excluding tags already on the page.
 */
export function getTagSuggestions(
  allTags: string[],
  existingTags: string[],
  query: string,
): string[] {
  const q = query.trim().toLowerCase();
  const available = allTags.filter((t) => !existingTags.includes(t));
  if (!q) {
    return available.slice(0, MAX_SUGGESTIONS);
  }
  return available.filter((t) => t.includes(q)).slice(0, MAX_SUGGESTIONS);
}

/**
 * Returns true if the query represents a tag that does not yet exist globally.
 */
export function isNewTagValue(allTags: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  return q.length > 0 && !allTags.includes(q);
}

/**
 * Normalises a raw tag input string to its canonical lowercase form.
 */
export function normaliseTag(raw: string): string | null {
  const clean = raw.trim().toLowerCase();
  return clean.length > 0 ? clean : null;
}
