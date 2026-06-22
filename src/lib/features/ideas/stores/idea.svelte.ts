import { ideaActions } from '../actions/idea';
import type { Idea } from '../types/idea';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { renameTagGloballyHelper, deleteTagGloballyHelper } from '$lib/utils/tag';

class IdeaStore {
  items = $state<Idea[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): Idea[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): Idea[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): Idea[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await ideaActions.getIdeas(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load ideas.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(content: string): Promise<void> {
    if (!workspaceStore.activeId) return;
    try {
      const idea = await ideaActions.createIdea({
        workspaceId: workspaceStore.activeId,
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

  async update(id: string, content: string): Promise<void> {
    await ideaActions.updateIdea(id, content);
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      this.items[idx] = {
        ...this.items[idx],
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async addTag(ideaId: string, tag: string): Promise<void> {
    await ideaActions.addTag(ideaId, tag);
    const idx = this.items.findIndex((i) => i.id === ideaId);
    if (idx >= 0) {
      const currentTags = this.items[idx].tags || [];
      if (!currentTags.includes(tag)) {
        this.items[idx] = { ...this.items[idx], tags: [...currentTags, tag] };
      }
    }
  }

  async removeTag(ideaId: string, tag: string): Promise<void> {
    await ideaActions.removeTag(ideaId, tag);
    const idx = this.items.findIndex((i) => i.id === ideaId);
    if (idx >= 0) {
      const currentTags = this.items[idx].tags || [];
      this.items[idx] = { ...this.items[idx], tags: currentTags.filter((t) => t !== tag) };
    }
  }

  async renameTagGlobally(oldTag: string, newTag: string): Promise<void> {
    this.items = await renameTagGloballyHelper(
      this.items,
      oldTag,
      newTag,
      (id, t) => ideaActions.addTag(id, t),
      (id, t) => ideaActions.removeTag(id, t)
    );
  }

  async deleteTagGlobally(tag: string): Promise<void> {
    this.items = await deleteTagGloballyHelper(
      this.items,
      tag,
      (id, t) => ideaActions.removeTag(id, t)
    );
  }
}

export const ideaStore = new IdeaStore();
