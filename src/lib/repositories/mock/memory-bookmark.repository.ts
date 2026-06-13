import type { BookmarkRepository } from "../bookmark.repository";
import type { Bookmark } from "../../types/bookmark";

const bookmarks: Bookmark[] = [];

export class MemoryBookmarkRepository implements BookmarkRepository {
  async getAll(): Promise<Bookmark[]> {
    return [...bookmarks];
  }

  async create(data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Promise<Bookmark> {
    const now = new Date().toISOString();
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    bookmarks.unshift(bookmark);
    return bookmark;
  }

  async delete(id: string): Promise<void> {
    const index = bookmarks.findIndex((b) => b.id === id);
    if (index >= 0) {
      bookmarks.splice(index, 1);
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (!bookmark) return;
    bookmark.isFavorite = !bookmark.isFavorite;
    bookmark.updatedAt = new Date().toISOString();
  }
}