import { SqliteImageRepository } from '../repositories/sqlite-image.repository';
import type { ImageItem, CreateImageInput, UpdateImageInput } from '../types/image';

class ImageActions {
  private repo = new SqliteImageRepository();

  async getImages(workspaceId: string): Promise<ImageItem[]> {
    if (!workspaceId) throw new Error('Workspace ID is required.');
    return await this.repo.getAll(workspaceId);
  }

  async createImage(input: CreateImageInput): Promise<ImageItem> {
    if (!input.workspaceId) throw new Error('Workspace ID is required.');

    if (!input.title || !input.title.trim()) throw new Error('Title is required.');
    return await this.repo.create(input);
  }

  async updateImage(id: string, data: UpdateImageInput): Promise<void> {
    if (!id) throw new Error('Image ID is required.');
    await this.repo.update(id, data);
  }

  async softDeleteImage(id: string): Promise<void> {
    if (!id) throw new Error('Image ID is required.');
    await this.repo.softDelete(id);
  }

  async restoreImage(id: string): Promise<void> {
    if (!id) throw new Error('Image ID is required.');
    await this.repo.restore(id);
  }

  async permanentlyDeleteImage(id: string): Promise<void> {
    if (!id) throw new Error('Image ID is required.');
    await this.repo.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!id) throw new Error('Image ID is required.');
    await this.repo.toggleFavorite(id);
  }

  async addTag(imageId: string, tag: string): Promise<void> {
    if (!imageId) throw new Error('Image ID is required.');
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) throw new Error('Tag name cannot be empty.');
    await this.repo.addTag(imageId, cleanTag);
  }

  async removeTag(imageId: string, tag: string): Promise<void> {
    if (!imageId) throw new Error('Image ID is required.');
    await this.repo.removeTag(imageId, tag);
  }
}

export const imageActions = new ImageActions();
