import { bookmarkStore } from './bookmark.svelte';
import { viewStore } from '$lib/shared/stores/view.svelte';

class FilteredBookmarksStore {
  get items() {
    // Trash view: only soft-deleted items
    if (viewStore.category === 'trash') {
      return bookmarkStore.trashedItems;
    }

    // All other views: only active (non-deleted) items
    let items = bookmarkStore.activeItems;

    if (viewStore.category === 'favorites') {
      items = items.filter((b) => b.isFavorite);
    }

    if (viewStore.selectedTag) {
      items = items.filter((b) => b.tags?.includes(viewStore.selectedTag!));
    }

    if (viewStore.searchActive && viewStore.searchQuery.trim()) {
      const q = viewStore.searchQuery.toLowerCase();
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return items;
  }
}

export const filteredBookmarksStore = new FilteredBookmarksStore();
