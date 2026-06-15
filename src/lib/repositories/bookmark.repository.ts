import type { Bookmark } from "../types/bookmark";

export interface BookmarkRepository {
  addTag(bookmarkId: string, tag: string): Promise<void>;
  create(
    data: Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Bookmark>;
  deletePermanently(id: string): Promise<void>;
  getAll(workspaceId: string): Promise<Bookmark[]>;
  removeTag(bookmarkId: string, tag: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  update(
    id: string,
    data: Partial<
      Omit<Bookmark, "id" | "createdAt" | "updatedAt" | "deletedAt">
    >
  ): Promise<void>;
}
