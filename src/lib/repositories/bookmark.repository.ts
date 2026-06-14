import type { Bookmark } from "../types/bookmark";

export interface BookmarkRepository {
  addTag(bookmarkId: string, tag: string): Promise<void>;
  create(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">
  ): Promise<Bookmark>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Bookmark[]>;
  removeTag(bookmarkId: string, tag: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  update(
    id: string,
    data: Partial<Omit<Bookmark, "id" | "createdAt" | "updatedAt">>
  ): Promise<void>;
}
