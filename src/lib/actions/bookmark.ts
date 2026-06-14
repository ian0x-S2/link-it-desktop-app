import type { BookmarkRepository } from "../repositories/bookmark.repository";
import type { Bookmark } from "../types/bookmark";

export class BookmarkActions {
  constructor(private repository: BookmarkRepository) {}

  async getBookmarks(): Promise<Bookmark[]> {
    return this.repository.getAll();
  }

  async createBookmark(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">
  ): Promise<Bookmark> {
    return this.repository.create({ ...data, isFavorite: false });
  }

  async deleteBookmark(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    return this.repository.toggleFavorite(id);
  }

  async updateBookmark(
    id: string,
    data: Partial<Omit<Bookmark, "id" | "createdAt" | "updatedAt">>
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
