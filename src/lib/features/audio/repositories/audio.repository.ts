import type { Audio, CreateAudioInput, UpdateAudioInput } from '../types/audio';

export interface AudioRepository {
  getAll(workspaceId: string): Promise<Audio[]>;
  getById(id: string): Promise<Audio | null>;
  create(input: CreateAudioInput): Promise<Audio>;
  update(id: string, data: UpdateAudioInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  addTag(audioId: string, tag: string): Promise<void>;
  removeTag(audioId: string, tag: string): Promise<void>;
}
