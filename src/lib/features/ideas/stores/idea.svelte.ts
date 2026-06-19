import { ideaActions } from '../actions/idea';
import type { Idea } from '../types/idea';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';

class IdeaStore {
  items = $state<Idea[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): Idea[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): Idea[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(categoryId: string): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await ideaActions.getIdeas(workspaceStore.activeId, categoryId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load ideas.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(categoryId: string, content: string): Promise<void> {
    if (!workspaceStore.activeId) return;
    try {
      const idea = await ideaActions.createIdea({
        workspaceId: workspaceStore.activeId,
        categoryId,
        content,
      });
      this.items = [idea, ...this.items];
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create idea.';
      throw e;
    }
  }

  async softDelete(id: string): Promise<void> {
    await ideaActions.softDeleteIdea(id);
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], deletedAt: new Date().toISOString() };
    }
  }

  async restore(id: string): Promise<void> {
    await ideaActions.restoreIdea(id);
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], deletedAt: null };
    }
  }

  async deletePermanently(id: string): Promise<void> {
    await ideaActions.permanentlyDeleteIdea(id);
    this.items = this.items.filter((i) => i.id !== id);
  }

  async toggleFavorite(id: string): Promise<void> {
    await ideaActions.toggleFavorite(id);
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], isFavorite: !this.items[idx].isFavorite };
    }
  }
}

export const ideaStore = new IdeaStore();
