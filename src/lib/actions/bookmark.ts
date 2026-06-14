import type { BookmarkRepository } from "../repositories/bookmark.repository";
import type { Bookmark } from "../types/bookmark";

export class BookmarkActions {
  constructor(private repository: BookmarkRepository) {}

  async getBookmarks(): Promise<Bookmark[]> {
    return this.repository.getAll();
  }

  async createBookmark(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Bookmark> {
    return this.repository.create({ ...data, isFavorite: false });
  }

  async softDeleteBookmark(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  async restoreBookmark(id: string): Promise<void> {
    return this.repository.restore(id);
  }

  async permanentlyDeleteBookmark(id: string): Promise<void> {
    return this.repository.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    return this.repository.toggleFavorite(id);
  }

  async updateBookmark(
    id: string,
    data: Partial<Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">>
  ): Promise<void> {
    return this.repository.update(id, data);
  }

  async addTag(bookmarkId: string, tag: string): Promise<void> {
    return this.repository.addTag(bookmarkId, tag);
  }

  async removeTag(bookmarkId: string, tag: string): Promise<void> {
    return this.repository.removeTag(bookmarkId, tag);
  }
}
