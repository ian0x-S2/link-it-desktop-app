import type { Category, CreateCategoryInput } from '../types/category';
import { SqliteCategoryRepository } from '../repositories/sqlite-category.repository';
import type { CategoryRepository } from '../repositories/category.repository';

export class CategoryActions {
  private readonly repository: CategoryRepository;

  constructor(repository: CategoryRepository) {
    this.repository = repository;
  }

  async getCategories(workspaceId: string): Promise<Category[]> {
    return await this.repository.getAll(workspaceId);
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Category name cannot be empty.');
    }
    if (name.length > 64) {
      throw new Error('Category name must be 64 characters or fewer.');
    }
    return await this.repository.create({ ...input, name });
  }

  async deleteCategory(id: string, isDefault: boolean): Promise<void> {
    if (isDefault) {
      throw new Error('Default categories cannot be deleted.');
    }
    await this.repository.delete(id);
  }

  async reorderCategories(ids: string[]): Promise<void> {
    await this.repository.reorder(ids);
  }

  async toggleHidden(id: string): Promise<void> {
    await this.repository.toggleHidden(id);
  }
}

export const categoryActions = new CategoryActions(new SqliteCategoryRepository());
