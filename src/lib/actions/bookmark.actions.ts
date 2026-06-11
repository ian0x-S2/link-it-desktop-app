import type { BookmarkRepository } from "../repositories/bookmark.repository";

export class BookmarkActions {
  constructor(private repository: BookmarkRepository) {}

  async getBookmarks() {
    return this.repository.getAll();
  }

  async createBookmark(data) {
    return this.repository.create({
      ...data,
      isFavorite: false,
    });
  }

  async deleteBookmark(id: string) {
    return this.repository.delete(id);
  }

  async toggleFavorite(id: string) {
    return this.repository.toggleFavorite(id);
  }
}
