import type { Media, CreateMediaInput, UpdateMediaInput } from '../types/media';

export interface MediaRepository {
  getAll(workspaceId: string): Promise<Media[]>;
  getById(id: string): Promise<Media | null>;
  create(input: CreateMediaInput): Promise<Media>;
  update(id: string, data: UpdateMediaInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  addTag(mediaId: string, tag: string): Promise<void>;
  removeTag(mediaId: string, tag: string): Promise<void>;
}
