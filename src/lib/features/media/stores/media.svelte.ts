import { mediaActions } from '../actions/media';
import type { Media, CreateMediaInput, UpdateMediaInput } from '../types/media';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';

class MediaStore {
  items = $state<Media[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): Media[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): Media[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): Media[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await mediaActions.getMedia(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load media.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(input: CreateMediaInput): Promise<Media | null> {
    try {
      const item = await mediaActions.createMedia(input);
      this.items = [item, ...this.items];
      return item;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create media.';
      return null;
    }
  }

  async save(id: string, data: UpdateMediaInput): Promise<void> {
    try {
      await mediaActions.updateMedia(id, data);
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save media.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await mediaActions.softDeleteMedia(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete media.';
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await mediaActions.restoreMedia(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to restore media.';
    }
  }

  async deletePermanently(id: string): Promise<void> {
    try {
      await mediaActions.permanentlyDeleteMedia(id);
      this.items = this.items.filter((i) => i.id !== id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to permanently delete media.';
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await mediaActions.toggleFavorite(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to toggle favorite.';
    }
  }

  async addTag(mediaId: string, tag: string): Promise<void> {
    try {
      await mediaActions.addTag(mediaId, tag);
      this.items = this.items.map((i) => {
        if (i.id === mediaId) {
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

  async removeTag(mediaId: string, tag: string): Promise<void> {
    try {
      await mediaActions.removeTag(mediaId, tag);
      this.items = this.items.map((i) => {
        if (i.id === mediaId) {
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
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (item.tags?.includes(oldTag)) {
          await mediaActions.removeTag(item.id, oldTag);
          if (item.tags.includes(newTag)) {
            this.items[i] = {
              ...item,
              tags: item.tags.filter((t) => t !== oldTag),
            };
          } else {
            await mediaActions.addTag(item.id, newTag);
            this.items[i] = {
              ...item,
              tags: [...item.tags.filter((t) => t !== oldTag), newTag],
            };
          }
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to rename tag globally.';
    }
  }

  async deleteTagGlobally(tag: string): Promise<void> {
    try {
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (item.tags?.includes(tag)) {
          await mediaActions.removeTag(item.id, tag);
          this.items[i] = {
            ...item,
            tags: item.tags.filter((t) => t !== tag),
          };
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete tag globally.';
    }
  }
}

export const mediaStore = new MediaStore();
