import { SqliteCustomRepository } from '../repositories/sqlite-custom.repository';
import type { CustomItem, CreateCustomInput, UpdateCustomInput } from '../types/custom';

class CustomActions {
  private repo = new SqliteCustomRepository();

  async getCustomItems(workspaceId: string): Promise<CustomItem[]> {
    if (!workspaceId) throw new Error('Workspace ID is required.');
    return await this.repo.getAll(workspaceId);
  }

  async createCustomItem(input: CreateCustomInput): Promise<CustomItem> {
    if (!input.workspaceId) throw new Error('Workspace ID is required.');
    if (!input.categoryId) throw new Error('Category ID is required.');
    if (!input.title || !input.title.trim()) throw new Error('Title is required.');
    return await this.repo.create(input);
  }

  async updateCustomItem(id: string, data: UpdateCustomInput): Promise<void> {
    if (!id) throw new Error('CustomItem ID is required.');
    await this.repo.update(id, data);
  }

  async softDeleteCustomItem(id: string): Promise<void> {
    if (!id) throw new Error('CustomItem ID is required.');
    await this.repo.softDelete(id);
  }

  async restoreCustomItem(id: string): Promise<void> {
    if (!id) throw new Error('CustomItem ID is required.');
    await this.repo.restore(id);
  }

  async permanentlyDeleteCustomItem(id: string): Promise<void> {
    if (!id) throw new Error('CustomItem ID is required.');
    await this.repo.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!id) throw new Error('CustomItem ID is required.');
    await this.repo.toggleFavorite(id);
  }

  async addTag(customItemId: string, tag: string): Promise<void> {
    if (!customItemId) throw new Error('CustomItem ID is required.');
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) throw new Error('Tag name cannot be empty.');
    await this.repo.addTag(customItemId, cleanTag);
  }

  async removeTag(customItemId: string, tag: string): Promise<void> {
    if (!customItemId) throw new Error('CustomItem ID is required.');
    await this.repo.removeTag(customItemId, tag);
  }
}

export const customActions = new CustomActions();
