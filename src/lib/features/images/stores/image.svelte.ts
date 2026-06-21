import { imageActions } from '../actions/image';
import type { ImageItem, CreateImageInput, UpdateImageInput } from '../types/image';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';

class ImageStore {
  items = $state<ImageItem[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): ImageItem[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): ImageItem[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): ImageItem[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await imageActions.getImages(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load images.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(input: CreateImageInput): Promise<ImageItem | null> {
    try {
      const item = await imageActions.createImage(input);
      this.items = [item, ...this.items];
      return item;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create image.';
      return null;
    }
  }

  async save(id: string, data: UpdateImageInput): Promise<void> {
    try {
      await imageActions.updateImage(id, data);
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save image.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await imageActions.softDeleteImage(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete image.';
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await imageActions.restoreImage(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to restore image.';
    }
  }

  async deletePermanently(id: string): Promise<void> {
    try {
      await imageActions.permanentlyDeleteImage(id);
      this.items = this.items.filter((i) => i.id !== id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to permanently delete image.';
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await imageActions.toggleFavorite(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to toggle favorite.';
    }
  }

  async addTag(imageId: string, tag: string): Promise<void> {
    try {
      await imageActions.addTag(imageId, tag);
      this.items = this.items.map((i) => {
        if (i.id === imageId) {
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

  async removeTag(imageId: string, tag: string): Promise<void> {
    try {
      await imageActions.removeTag(imageId, tag);
      this.items = this.items.map((i) => {
        if (i.id === imageId) {
          const existing = i.tags || [];
          return { ...i, tags: existing.filter((t) => t !== tag) };
        }
        return i;
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to remove tag.';
    }
  }
}

export const imageStore = new ImageStore();
