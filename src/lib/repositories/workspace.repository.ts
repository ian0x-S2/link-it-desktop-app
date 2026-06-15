import type { CreateWorkspaceInput, Workspace } from "../types/workspace";

export interface WorkspaceRepository {
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Workspace[]>;
  rename(id: string, name: string): Promise<void>;
}
