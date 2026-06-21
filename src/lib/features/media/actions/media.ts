import { SqliteMediaRepository } from '../repositories/sqlite-media.repository';
import type { Media, CreateMediaInput, UpdateMediaInput } from '../types/media';

class MediaActions {
  private repo = new SqliteMediaRepository();

  async getMedia(workspaceId: string): Promise<Media[]> {
    if (!workspaceId) throw new Error('Workspace ID is required.');
    return await this.repo.getAll(workspaceId);
  }

  async createMedia(input: CreateMediaInput): Promise<Media> {
    if (!input.workspaceId) throw new Error('Workspace ID is required.');

    if (!input.title || !input.title.trim()) throw new Error('Title is required.');
    return await this.repo.create(input);
  }

  async updateMedia(id: string, data: UpdateMediaInput): Promise<void> {
    if (!id) throw new Error('Media ID is required.');
    await this.repo.update(id, data);
  }

  async softDeleteMedia(id: string): Promise<void> {
    if (!id) throw new Error('Media ID is required.');
    await this.repo.softDelete(id);
  }

  async restoreMedia(id: string): Promise<void> {
    if (!id) throw new Error('Media ID is required.');
    await this.repo.restore(id);
  }

  async permanentlyDeleteMedia(id: string): Promise<void> {
    if (!id) throw new Error('Media ID is required.');
    await this.repo.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!id) throw new Error('Media ID is required.');
    await this.repo.toggleFavorite(id);
  }

  async addTag(mediaId: string, tag: string): Promise<void> {
    if (!mediaId) throw new Error('Media ID is required.');
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) throw new Error('Tag name cannot be empty.');
    await this.repo.addTag(mediaId, cleanTag);
  }

  async removeTag(mediaId: string, tag: string): Promise<void> {
    if (!mediaId) throw new Error('Media ID is required.');
    await this.repo.removeTag(mediaId, tag);
  }
}

export const mediaActions = new MediaActions();
