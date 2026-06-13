import type { Bookmark } from "../types/bookmark";
import type { BookmarkRepository } from "../repositories/bookmark.repository";

export class BookmarkActions {
  constructor(private repository: BookmarkRepository) {}

  async getBookmarks(): Promise<Bookmark[]> {
    return this.repository.getAll();
  }

  async createBookmark(data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Promise<Bookmark> {
    return this.repository.create({ ...data, isFavorite: false });
  }

  async deleteBookmark(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    return this.repository.toggleFavorite(id);
  }
}