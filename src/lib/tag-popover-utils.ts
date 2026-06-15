import type { Bookmark } from "$lib/types/bookmark";

const MAX_SUGGESTIONS = 8;

/**
 * Collects all unique tags from a list of bookmarks, sorted alphabetically.
 */
export function getAllUniqueTags(items: Bookmark[]): string[] {
  const tagSet = new Set<string>();
  for (const b of items) {
    for (const t of b.tags) {
      tagSet.add(t);
    }
  }
  return [...tagSet].sort();
}

/**
 * Returns tag suggestions filtered by query and excluding tags already on the bookmark.
 *
 * @param allTags   - Full sorted list of unique tags (from getAllUniqueTags)
 * @param existingTags - Tags already assigned to the current bookmark
 * @param query     - Current text input value
 */
export function getTagSuggestions(
  allTags: string[],
  existingTags: string[],
  query: string
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
 * Used to show the "[Create: ...]" option in the popover.
 *
 * @param allTags - Full sorted list of unique tags (from getAllUniqueTags)
 * @param query   - Current text input value
 */
export function isNewTagValue(allTags: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  return q.length > 0 && !allTags.includes(q);
}

/**
 * Normalises a raw tag input string to its canonical lowercase form.
 * Returns null if the input is empty after trimming.
 */
export function normaliseTag(raw: string): string | null {
  const clean = raw.trim().toLowerCase();
  return clean.length > 0 ? clean : null;
}
