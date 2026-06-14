import { invoke } from "@tauri-apps/api/core";
import type { BookmarkRepository } from "../repositories/bookmark.repository";
import type { Bookmark } from "../types/bookmark";
import { normalizeUrl, validateUrl } from "../validators/bookmark";

export class BookmarkActions {
  private readonly repository: BookmarkRepository;

  constructor(repository: BookmarkRepository) {
    this.repository = repository;
  }

  normalizeUrl(url: string): string {
    return normalizeUrl(url);
  }

  validateUrl(url: string): boolean {
    return validateUrl(url);
  }

  async fetchMetadata(url: string): Promise<{
    title: string;
    description: string;
    imageUrl: string;
    faviconUrl: string;
  }> {
    const normalized = this.normalizeUrl(url);
    if (!this.validateUrl(normalized)) {
      throw new Error("Invalid URL");
    }

    try {
      const metadata = await invoke<{
        title: string | null;
        description: string | null;
        image_url: string | null;
        favicon_url: string | null;
      }>("fetch_metadata", { url: normalized });

      let hostname = normalized;
      try {
        hostname = new URL(normalized).hostname;
      } catch {
        // Ignored
      }

      return {
        title: metadata.title || hostname,
        description: metadata.description || "",
        imageUrl: metadata.image_url || "",
        faviconUrl:
          metadata.favicon_url ||
          `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      };
    } catch {
      let hostname = normalized;
      try {
        hostname = new URL(normalized).hostname;
      } catch {
        // Ignored
      }

      return {
        title: hostname,
        description: "",
        imageUrl: "",
        faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      };
    }
  }

  async getBookmarks(): Promise<Bookmark[]> {
    return await this.repository.getAll();
  }

  async createBookmark(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Bookmark> {
    return await this.repository.create({ ...data, isFavorite: false });
  }

  async softDeleteBookmark(id: string): Promise<void> {
    return await this.repository.softDelete(id);
  }

  async restoreBookmark(id: string): Promise<void> {
    return await this.repository.restore(id);
  }

  async permanentlyDeleteBookmark(id: string): Promise<void> {
    return await this.repository.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    return await this.repository.toggleFavorite(id);
  }

  async updateBookmark(
    id: string,
    data: Partial<
      Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
    >
  ): Promise<void> {
    return await this.repository.update(id, data);
  }

  async addTag(bookmarkId: string, tag: string): Promise<void> {
    return await this.repository.addTag(bookmarkId, tag);
  }

  async removeTag(bookmarkId: string, tag: string): Promise<void> {
    return await this.repository.removeTag(bookmarkId, tag);
  }
}
