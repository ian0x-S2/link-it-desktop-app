import type { Bookmark } from "../../types/bookmark";
import type { BookmarkRepository } from "../bookmark.repository";

const bookmarks: Bookmark[] = [];

export class MemoryBookmarkRepository implements BookmarkRepository {
  async getAll(): Promise<Bookmark[]> {
    return [...bookmarks];
  }

  async create(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">
  ): Promise<Bookmark> {
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
    if (!bookmark) {
      return;
    }
    bookmark.isFavorite = !bookmark.isFavorite;
    bookmark.updatedAt = new Date().toISOString();
  }

  async update(
    id: string,
    data: Partial<Omit<Bookmark, "id" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      Object.assign(bookmark, data);
      bookmark.updatedAt = new Date().toISOString();
    }
  }

  async addTag(bookmarkId: string, tag: string): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark) {
      if (!bookmark.tags.includes(tag)) {
        bookmark.tags.push(tag);
        bookmark.updatedAt = new Date().toISOString();
      }
    }
  }

  async removeTag(bookmarkId: string, tag: string): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark) {
      bookmark.tags = bookmark.tags.filter((t) => t !== tag);
      bookmark.updatedAt = new Date().toISOString();
    }
  }
}
