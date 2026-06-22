import { audioActions } from '../actions/audio';
import type { Audio, CreateAudioInput, UpdateAudioInput } from '../types/audio';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { renameTagGloballyHelper, deleteTagGloballyHelper } from '$lib/utils/tag';

class AudioStore {
  items = $state<Audio[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): Audio[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): Audio[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): Audio[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await audioActions.getAudio(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load audio.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(input: CreateAudioInput): Promise<Audio | null> {
    try {
      const item = await audioActions.createAudio(input);
      this.items = [item, ...this.items];
      return item;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create audio.';
      return null;
    }
  }

  async save(id: string, data: UpdateAudioInput): Promise<void> {
    try {
      await audioActions.updateAudio(id, data);
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save audio.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await audioActions.softDeleteAudio(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete audio.';
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await audioActions.restoreAudio(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to restore audio.';
    }
  }

  async deletePermanently(id: string): Promise<void> {
    try {
      await audioActions.permanentlyDeleteAudio(id);
      this.items = this.items.filter((i) => i.id !== id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to permanently delete audio.';
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await audioActions.toggleFavorite(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to toggle favorite.';
    }
  }

  async addTag(audioId: string, tag: string): Promise<void> {
    try {
      await audioActions.addTag(audioId, tag);
      this.items = this.items.map((i) => {
        if (i.id === audioId) {
          const existing = i.tags || [];
          if (!existing.includes(tag)) {
            return { ...i, tags: [...existing, tag] };
          }
        }
        return i;
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to add tag.';
    }
  }

  async removeTag(audioId: string, tag: string): Promise<void> {
    try {
      await audioActions.removeTag(audioId, tag);
      this.items = this.items.map((i) => {
        if (i.id === audioId) {
          const existing = i.tags || [];
          return { ...i, tags: existing.filter((t) => t !== tag) };
        }
        return i;
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to remove tag.';
    }
  }

  async renameTagGlobally(oldTag: string, newTag: string): Promise<void> {
    try {
      this.items = await renameTagGloballyHelper(
        this.items,
        oldTag,
        newTag,
        (id, t) => audioActions.addTag(id, t),
        (id, t) => audioActions.removeTag(id, t)
      );
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to rename tag globally.';
    }
  }

  async deleteTagGlobally(tag: string): Promise<void> {
    try {
      this.items = await deleteTagGloballyHelper(
        this.items,
        tag,
        (id, t) => audioActions.removeTag(id, t)
      );
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete tag globally.';
    }
  }
}

export const audioStore = new AudioStore();
