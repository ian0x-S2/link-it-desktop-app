import type { WorkspaceRepository } from '../repositories/workspace.repository';
import type { CreateWorkspaceInput, Workspace, WorkspaceStats } from '../types/workspace';

export class WorkspaceActions {
  private readonly repository: WorkspaceRepository;

  constructor(repository: WorkspaceRepository) {
    this.repository = repository;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return await this.repository.getAll();
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Workspace name cannot be empty.');
    }
    return await this.repository.create({ name });
  }

  async deleteWorkspace(id: string): Promise<void> {
    return await this.repository.delete(id);
  }

  async renameWorkspace(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Workspace name cannot be empty.');
    }
    return await this.repository.rename(id, trimmed);
  }

  async getWorkspaceStats(): Promise<WorkspaceStats[]> {
    return await this.repository.getStats();
  }
}
