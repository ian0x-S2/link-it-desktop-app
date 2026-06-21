import type { Category, CreateCategoryInput } from '../types/category';

export interface CategoryRepository {
  getAll(workspaceId: string): Promise<Category[]>;
  create(input: CreateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;
  toggleHidden(id: string): Promise<void>;
}

