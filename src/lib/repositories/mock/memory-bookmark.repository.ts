import type { BookmarkRepository } from "../bookmark.repository";
import type { Bookmark } from "../../types/bookmark";

const bookmarks: Bookmark[] = [];

export class MemoryBookmarkRepository implements BookmarkRepository {
  async getAll() {
    return bookmarks;
  }

  async create(data) {
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isFavorite: false,
      ...data,
    };
    bookmarks.unshift(bookmark);
    return bookmark;
  }

  async delete(id: string) {
    const index = bookmarks.findIndex((b) => b.id === id);
    if (index >= 0) {
      bookmarks.splice(index, 1);
    }
  }

  async toggleFavorite(id: string) {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark) return;

    bookmark.isFavorite = !bookmark.isFavorite;
  }
}
