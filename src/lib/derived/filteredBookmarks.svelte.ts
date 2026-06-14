import { bookmarkStore } from "$lib/stores/bookmark.svelte";
import { viewStore } from "$lib/stores/view.svelte";

class FilteredBookmarksStore {
  get items() {
    let items = bookmarkStore.items;

    if (viewStore.category === "favorites") {
      items = items.filter((b) => b.isFavorite);
    }

    if (viewStore.selectedTag) {
      items = items.filter((b) => b.tags?.includes(viewStore.selectedTag!));
    }

    if (viewStore.mode === "search" && viewStore.searchQuery.trim()) {
      const q = viewStore.searchQuery.toLowerCase();
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  }
}

export const filteredBookmarksStore = new FilteredBookmarksStore();
