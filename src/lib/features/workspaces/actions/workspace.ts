import type { WorkspaceRepository } from '../repositories/workspace.repository';
import type { CreateWorkspaceInput, Workspace, WorkspaceStats } from '../types/workspace';
import { SqliteWorkspaceRepository } from '../repositories/sqlite-workspace.repository';
import { getDatabase, seedDefaultCategories } from '$lib/core/database/database';

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
    const workspace = await this.repository.create({ name });

    // Seed the 8 default categories for the new workspace.
    const db = await getDatabase();
    await seedDefaultCategories(db, workspace.id);

    return workspace;
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

export const workspaceActions = new WorkspaceActions(new SqliteWorkspaceRepository());
export default workspaceActions;
