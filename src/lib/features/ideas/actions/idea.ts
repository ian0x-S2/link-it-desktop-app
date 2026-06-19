import type { Idea, CreateIdeaInput } from '../types/idea';
import { SqliteIdeaRepository } from '../repositories/sqlite-idea.repository';
import type { IdeaRepository } from '../repositories/idea.repository';

export class IdeaActions {
  private readonly repository: IdeaRepository;

  constructor(repository: IdeaRepository) {
    this.repository = repository;
  }

  async getIdeas(workspaceId: string, categoryId: string): Promise<Idea[]> {
    return await this.repository.getAll(workspaceId, categoryId);
  }

  async createIdea(input: CreateIdeaInput): Promise<Idea> {
    const content = input.content.trim();
    if (!content) {
      throw new Error('Idea content cannot be empty.');
    }
    return await this.repository.create({ ...input, content });
  }

  async softDeleteIdea(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restoreIdea(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async permanentlyDeleteIdea(id: string): Promise<void> {
    await this.repository.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    await this.repository.toggleFavorite(id);
  }
}

export const ideaActions = new IdeaActions(new SqliteIdeaRepository());
