import type { Bookmark } from "../types/bookmark";

export interface BookmarkRepository {
  getAll(): Promise<Bookmark[]>;
  create(data: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Promise<Bookmark>;
  delete(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
}