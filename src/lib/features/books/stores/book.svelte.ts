import { bookActions } from '../actions/book';
import type { Book, CreateBookInput, UpdateBookInput } from '../types/book';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { renameTagGloballyHelper, deleteTagGloballyHelper } from '$lib/utils/tag';

class BookStore {
  items = $state<Book[]>([]);
  isLoading = $state(false);
  error = $state<string | null>(null);

  get activeItems(): Book[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get activeItemsFiltered(): Book[] {
    return this.items.filter((i) => i.deletedAt === null);
  }

  get trashedItems(): Book[] {
    return this.items.filter((i) => i.deletedAt !== null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await bookActions.getBooks(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load books.';
    } finally {
      this.isLoading = false;
    }
  }

  async create(input: CreateBookInput): Promise<Book | null> {
    try {
      const item = await bookActions.createBook(input);
      this.items = [item, ...this.items];
      return item;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create book.';
      return null;
    }
  }

  async save(id: string, data: UpdateBookInput): Promise<void> {
    try {
      await bookActions.updateBook(id, data);
      this.items = this.items.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save book.';
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await bookActions.softDeleteBook(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete book.';
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await bookActions.restoreBook(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, deletedAt: null } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to restore book.';
    }
  }

  async deletePermanently(id: string): Promise<void> {
    try {
      await bookActions.permanentlyDeleteBook(id);
      this.items = this.items.filter((i) => i.id !== id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to permanently delete book.';
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      await bookActions.toggleFavorite(id);
      this.items = this.items.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to toggle favorite.';
    }
  }

  async addTag(bookId: string, tag: string): Promise<void> {
    try {
      await bookActions.addTag(bookId, tag);
      this.items = this.items.map((i) => {
        if (i.id === bookId) {
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

  async removeTag(bookId: string, tag: string): Promise<void> {
    try {
      await bookActions.removeTag(bookId, tag);
      this.items = this.items.map((i) => {
        if (i.id === bookId) {
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
        (id, t) => bookActions.addTag(id, t),
        (id, t) => bookActions.removeTag(id, t)
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
        (id, t) => bookActions.removeTag(id, t)
      );
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete tag globally.';
    }
  }
}

export const bookStore = new BookStore();
