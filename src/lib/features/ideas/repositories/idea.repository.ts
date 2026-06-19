import type { Idea, CreateIdeaInput, UpdateIdeaInput } from '../types/idea';

export interface IdeaRepository {
  getAll(workspaceId: string, categoryId: string): Promise<Idea[]>;
  create(input: CreateIdeaInput): Promise<Idea>;
  update(id: string, data: UpdateIdeaInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
}
