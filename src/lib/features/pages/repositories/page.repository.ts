import type { Page, CreatePageInput, UpdatePageInput, PageMetadata } from '../types/page';

export interface PageRepository {
  getAllMetadata(workspaceId: string, categoryId: string): Promise<PageMetadata[]>;
  getById(id: string): Promise<Page | null>;
  create(input: CreatePageInput): Promise<Page>;
  update(id: string, data: UpdatePageInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
}
