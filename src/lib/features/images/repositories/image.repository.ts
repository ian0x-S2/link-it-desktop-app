import type { ImageItem, CreateImageInput, UpdateImageInput } from '../types/image';

export interface ImageRepository {
  getAll(workspaceId: string): Promise<ImageItem[]>;
  getById(id: string): Promise<ImageItem | null>;
  create(input: CreateImageInput): Promise<ImageItem>;
  update(id: string, data: UpdateImageInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  addTag(imageId: string, tag: string): Promise<void>;
  removeTag(imageId: string, tag: string): Promise<void>;
}
