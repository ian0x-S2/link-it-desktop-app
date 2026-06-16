import { workspaceActions } from '../repositories/config/repository';
import type { Workspace } from '../types/workspace';

class WorkspaceStore {
  items = $state<Workspace[]>([]);
  activeId = $state<string | null>(null);

  get active(): Workspace | null {
    return this.items.find((w) => w.id === this.activeId) ?? null;
  }

  async load(): Promise<void> {
    this.items = await workspaceActions.getWorkspaces();
    // Select the first workspace (default) if no workspace is active yet.
    if (!this.activeId && this.items.length > 0) {
      this.activeId = this.items[0].id;
    }
  }

  select(id: string): void {
    this.activeId = id;
  }

  async create(name: string): Promise<void> {
    const workspace = await workspaceActions.createWorkspace({ name });
    this.items = [...this.items, workspace];
    this.activeId = workspace.id;
  }

  async rename(id: string, name: string): Promise<void> {
    await workspaceActions.renameWorkspace(id, name);
    this.items = this.items.map((w) => (w.id === id ? { ...w, name } : w));
  }

  async delete(id: string): Promise<void> {
    await workspaceActions.deleteWorkspace(id);
    this.items = this.items.filter((w) => w.id !== id);
    // If we deleted the active workspace, switch to the first remaining one.
    if (this.activeId === id) {
      this.activeId = this.items[0]?.id ?? null;
    }
  }
}

export const workspaceStore = new WorkspaceStore();
