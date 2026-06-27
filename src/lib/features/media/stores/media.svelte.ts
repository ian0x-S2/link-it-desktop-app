import { mediaActions } from '../actions/media';
import type { Media, CreateMediaInput, UpdateMediaInput } from '../types/media';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { renameTagGloballyHelper, deleteTagGloballyHelper } from '$lib/utils/tag';
import { getAllUniqueTags } from '$lib/features/bookmarks/utils/tag-popover-utils';

class MediaStore {
  items = $state<Media[]>([]);
  activeMedia = $state<Media | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);

  activeItems = $derived.by(() => this.items.filter((i) => i.deletedAt === null));

  activeItemsFiltered = $derived.by(() => this.items.filter((i) => i.deletedAt === null));

  trashedItems = $derived.by(() => this.items.filter((i) => i.deletedAt !== null));

  allTags = $derived.by(() => getAllUniqueTags(this.items));

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

  openMedia(id: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      this.activeMedia = item;
    }
  }

  closeMedia(): void {
    this.activeMedia = null;
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
      const updatedTime = new Date().toISOString();
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: updatedTime } : i));
      if (this.activeMedia?.id === id) {
        this.activeMedia = { ...this.activeMedia, ...data, updatedAt: updatedTime };
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save media.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await mediaActions.softDeleteMedia(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
      if (this.activeMedia?.id === id) {
        this.closeMedia();
      }
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
      this.items = await renameTagGloballyHelper(
        this.items,
        oldTag,
        newTag,
        (id, t) => mediaActions.addTag(id, t),
        (id, t) => mediaActions.removeTag(id, t)
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
        (id, t) => mediaActions.removeTag(id, t)
      );
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete tag globally.';
    }
  }
}

export const mediaStore = new MediaStore();
