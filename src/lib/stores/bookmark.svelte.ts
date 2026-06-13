import type { Bookmark } from "../types/bookmark";
import { bookmarkActions } from "../repositories/config/repository";

class BookmarkStore {
  items = $state<Bookmark[]>([]);

  async load(): Promise<void> {
    this.items = await bookmarkActions.getBookmarks();
  }

  async create(data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Promise<void> {
    const bookmark = await bookmarkActions.createBookmark(data);
    this.items.unshift(bookmark);
  }

  async delete(id: string): Promise<void> {
    await bookmarkActions.deleteBookmark(id);
    this.items = this.items.filter((b) => b.id !== id);
  }

  async toggleFavorite(id: string): Promise<void> {
    await bookmarkActions.toggleFavorite(id);
    const index = this.items.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        isFavorite: !this.items[index].isFavorite,
      };
    }
  }
}

export const bookmarkStore = new BookmarkStore();