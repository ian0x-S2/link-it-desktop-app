import type { Bookmark } from "../../types/bookmark";
import type { BookmarkRepository } from "../bookmark.repository";

const bookmarks: Bookmark[] = [];

export class MemoryBookmarkRepository implements BookmarkRepository {
  async getAll(workspaceId: string): Promise<Bookmark[]> {
    return bookmarks.filter((b) => b.workspaceId === workspaceId);
  }

  async create(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Bookmark> {
    const now = new Date().toISOString();
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      ...data,
    };
    bookmarks.unshift(bookmark);
    return bookmark;
  }

  async softDelete(id: string): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      bookmark.deletedAt = new Date().toISOString();
      bookmark.updatedAt = bookmark.deletedAt;
    }
  }

  async restore(id: string): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      bookmark.deletedAt = null;
      bookmark.updatedAt = new Date().toISOString();
    }
  }

  async deletePermanently(id: string): Promise<void> {
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
    data: Partial<
      Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
    >
  ): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === id);
    if (bookmark) {
      Object.assign(bookmark, data);
      bookmark.updatedAt = new Date().toISOString();
    }
  }

  async addTag(bookmarkId: string, tag: string): Promise<void> {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark && !bookmark.tags.includes(tag)) {
      bookmark.tags.push(tag);
      bookmark.updatedAt = new Date().toISOString();
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
