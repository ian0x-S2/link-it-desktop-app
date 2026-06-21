import { SqliteAudioRepository } from '../repositories/sqlite-audio.repository';
import type { Audio, CreateAudioInput, UpdateAudioInput } from '../types/audio';

class AudioActions {
  private repo = new SqliteAudioRepository();

  async getAudio(workspaceId: string): Promise<Audio[]> {
    if (!workspaceId) throw new Error('Workspace ID is required.');
    return await this.repo.getAll(workspaceId);
  }

  async createAudio(input: CreateAudioInput): Promise<Audio> {
    if (!input.workspaceId) throw new Error('Workspace ID is required.');

    if (!input.title || !input.title.trim()) throw new Error('Title is required.');
    return await this.repo.create(input);
  }

  async updateAudio(id: string, data: UpdateAudioInput): Promise<void> {
    if (!id) throw new Error('Audio ID is required.');
    await this.repo.update(id, data);
  }

  async softDeleteAudio(id: string): Promise<void> {
    if (!id) throw new Error('Audio ID is required.');
    await this.repo.softDelete(id);
  }

  async restoreAudio(id: string): Promise<void> {
    if (!id) throw new Error('Audio ID is required.');
    await this.repo.restore(id);
  }

  async permanentlyDeleteAudio(id: string): Promise<void> {
    if (!id) throw new Error('Audio ID is required.');
    await this.repo.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!id) throw new Error('Audio ID is required.');
    await this.repo.toggleFavorite(id);
  }

  async addTag(audioId: string, tag: string): Promise<void> {
    if (!audioId) throw new Error('Audio ID is required.');
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) throw new Error('Tag name cannot be empty.');
    await this.repo.addTag(audioId, cleanTag);
  }

  async removeTag(audioId: string, tag: string): Promise<void> {
    if (!audioId) throw new Error('Audio ID is required.');
    await this.repo.removeTag(audioId, tag);
  }
}

export const audioActions = new AudioActions();
