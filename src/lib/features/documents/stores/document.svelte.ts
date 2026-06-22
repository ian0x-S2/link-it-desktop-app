import { documentActions } from '../actions/document';
import type { DocumentItem, CreateDocumentInput, UpdateDocumentInput } from '../types/document';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { renameTagGloballyHelper, deleteTagGloballyHelper } from '$lib/utils/tag';

class DocumentStore {
  items = $state<DocumentItem[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): DocumentItem[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): DocumentItem[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): DocumentItem[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await documentActions.getDocuments(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load documents.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(input: CreateDocumentInput): Promise<DocumentItem | null> {
    try {
      const item = await documentActions.createDocument(input);
      this.items = [item, ...this.items];
      return item;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create document.';
      return null;
    }
  }

  async save(id: string, data: UpdateDocumentInput): Promise<void> {
    try {
      await documentActions.updateDocument(id, data);
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save document.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await documentActions.softDeleteDocument(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete document.';
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await documentActions.restoreDocument(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to restore document.';
    }
  }

  async deletePermanently(id: string): Promise<void> {
    try {
      await documentActions.permanentlyDeleteDocument(id);
      this.items = this.items.filter((i) => i.id !== id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to permanently delete document.';
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await documentActions.toggleFavorite(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to toggle favorite.';
    }
  }

  async addTag(docId: string, tag: string): Promise<void> {
    try {
      await documentActions.addTag(docId, tag);
      this.items = this.items.map((i) => {
        if (i.id === docId) {
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

  async removeTag(docId: string, tag: string): Promise<void> {
    try {
      await documentActions.removeTag(docId, tag);
      this.items = this.items.map((i) => {
        if (i.id === docId) {
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
        (id, t) => documentActions.addTag(id, t),
        (id, t) => documentActions.removeTag(id, t)
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
        (id, t) => documentActions.removeTag(id, t)
      );
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete tag globally.';
    }
  }
}

export const documentStore = new DocumentStore();
