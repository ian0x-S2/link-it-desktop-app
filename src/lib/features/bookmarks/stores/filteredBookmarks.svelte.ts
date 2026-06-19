import { bookmarkStore } from './bookmark.svelte';
import { viewStore } from '$lib/shared/stores/view.svelte';

class FilteredBookmarksStore {
  get items() {
    // Trash special view: all soft-deleted bookmarks.
    if (viewStore.specialView === 'trash') {
      return bookmarkStore.trashedItems;
    }

    // Favorites special view: active bookmarks marked as favorite.
    if (viewStore.specialView === 'favorites') {
      return bookmarkStore.activeItems.filter((b) => b.isFavorite);
    }

    // Regular category view: show active bookmarks for the active category.
    let items = bookmarkStore.activeItems;

    if (viewStore.activeCategoryId) {
      items = items.filter((b) => b.categoryId === viewStore.activeCategoryId);
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
