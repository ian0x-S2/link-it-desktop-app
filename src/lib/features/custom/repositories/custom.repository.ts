import type { CustomItem, CreateCustomInput, UpdateCustomInput } from '../types/custom';

export interface CustomRepository {
  getAll(workspaceId: string): Promise<CustomItem[]>;
  getById(id: string): Promise<CustomItem | null>;
  create(input: CreateCustomInput): Promise<CustomItem>;
  update(id: string, data: UpdateCustomInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  addTag(customItemId: string, tag: string): Promise<void>;
  removeTag(customItemId: string, tag: string): Promise<void>;
}
