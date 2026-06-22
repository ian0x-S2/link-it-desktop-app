import { customActions } from '../actions/custom';
import type { CustomItem, CreateCustomInput, UpdateCustomInput } from '../types/custom';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { viewStore } from '$lib/shared/stores/view.svelte';

class CustomStore {
  items = $state<CustomItem[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): CustomItem[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): CustomItem[] {
    const activeCategoryId = viewStore.activeCategoryId;
    if (!activeCategoryId) return [];
    return this.items.filter((i) => i.deletedAt === null && i.categoryId === activeCategoryId);
  }

  get trashedItems(): CustomItem[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await customActions.getCustomItems(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load custom items.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(input: CreateCustomInput): Promise<CustomItem | null> {
    try {
      const item = await customActions.createCustomItem(input);
      this.items = [item, ...this.items];
      return item;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create custom item.';
      return null;
    }
  }

  async save(id: string, data: UpdateCustomInput): Promise<void> {
    try {
      await customActions.updateCustomItem(id, data);
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save custom item.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await customActions.softDeleteCustomItem(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete custom item.';
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await customActions.restoreCustomItem(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to restore custom item.';
    }
  }

  async deletePermanently(id: string): Promise<void> {
    try {
      await customActions.permanentlyDeleteCustomItem(id);
      this.items = this.items.filter((i) => i.id !== id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to permanently delete custom item.';
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await customActions.toggleFavorite(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to toggle favorite.';
    }
  }

  async addTag(customItemId: string, tag: string): Promise<void> {
    try {
      await customActions.addTag(customItemId, tag);
      this.items = this.items.map((i) => {
        if (i.id === customItemId) {
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

  async removeTag(customItemId: string, tag: string): Promise<void> {
    try {
      await customActions.removeTag(customItemId, tag);
      this.items = this.items.map((i) => {
        if (i.id === customItemId) {
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
          await customActions.removeTag(item.id, oldTag);
          if (item.tags.includes(newTag)) {
            this.items[i] = {
              ...item,
              tags: item.tags.filter((t) => t !== oldTag),
            };
          } else {
            await customActions.addTag(item.id, newTag);
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
          await customActions.removeTag(item.id, tag);
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

export const customStore = new CustomStore();
