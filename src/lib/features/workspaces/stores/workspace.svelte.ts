import { workspaceActions } from '../actions/workspace';
import type { Workspace, WorkspaceStats } from '../types/workspace';
import { categoryStore } from '$lib/features/categories/stores/category.svelte';

class WorkspaceStore {
  items = $state<Workspace[]>([]);
  activeId = $state<string | null>(null);
  stats = $state<WorkspaceStats[]>([]);

  get active(): Workspace | null {
    return this.items.find((w) => w.id === this.activeId) ?? null;
  }

  async load(): Promise<void> {
    this.items = await workspaceActions.getWorkspaces();
    // Select the first workspace (default) if no workspace is active yet.
    if (!this.activeId && this.items.length > 0) {
      this.activeId = this.items[0].id;
      await categoryStore.load(this.items[0].id);
    }
  }

  async select(id: string): Promise<void> {
    this.activeId = id;
    categoryStore.reset();
    await categoryStore.load(id);
  }

  async create(name: string): Promise<void> {
    const workspace = await workspaceActions.createWorkspace({ name });
    this.items = [...this.items, workspace];
    this.activeId = workspace.id;
    // Load the freshly seeded categories for the new workspace.
    categoryStore.reset();
    await categoryStore.load(workspace.id);
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
      const nextId = this.items[0]?.id ?? null;
      this.activeId = nextId;
      categoryStore.reset();
      if (nextId) {
        await categoryStore.load(nextId);
      }
    }
  }

  async loadStats(): Promise<void> {
    this.stats = await workspaceActions.getWorkspaceStats();
  }
}

export const workspaceStore = new WorkspaceStore();
