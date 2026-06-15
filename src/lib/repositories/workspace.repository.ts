import type { CreateWorkspaceInput, Workspace } from "../types/workspace";

export interface WorkspaceRepository {
  getAll(): Promise<Workspace[]>;
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  delete(id: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
}
