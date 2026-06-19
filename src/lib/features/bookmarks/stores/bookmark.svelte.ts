import { bookmarkActions } from '../actions/bookmark';
import type { Bookmark } from '../types/bookmark';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';

class BookmarkStore {
  items = $state<Bookmark[]>([]);

  /** All bookmarks currently in the trash (soft-deleted). */
  get trashedItems(): Bookmark[] {
    return this.items.filter((b) => b.deletedAt !== null);
  }

  /** Active bookmarks (not in trash). */
  get activeItems(): Bookmark[] {
    return this.items.filter((b) => b.deletedAt === null);
  }

  async load(): Promise<void> {
    if (!workspaceStore.activeId) {
      return;
    }
    this.items = await bookmarkActions.getBookmarks(workspaceStore.activeId);
  }

  async create(
    data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<void> {
    const bookmark = await bookmarkActions.createBookmark(data);
    this.items.unshift(bookmark);
  }

  /** Normalizes, validates, fetches metadata if needed, and adds the bookmark. */
  async addBookmark(
    url: string,
    categoryId: string | null,
    metadata?: {
      title: string;
      description: string;
      imageUrl: string;
      faviconUrl: string;
    },
  ): Promise<void> {
    if (!workspaceStore.activeId) {
      throw new Error('No active workspace selected.');
    }

    const normalized = bookmarkActions.normalizeUrl(url);
    if (!bookmarkActions.validateUrl(normalized)) {
      throw new Error('Invalid URL');
    }

    let resolvedMetadata = metadata;
    if (!resolvedMetadata) {
      resolvedMetadata = await bookmarkActions.fetchMetadata(normalized);
    }

    await this.create({
      workspaceId: workspaceStore.activeId,
      categoryId,
      url: normalized,
      title: resolvedMetadata.title,
      description: resolvedMetadata.description,
      imageUrl: resolvedMetadata.imageUrl,
      faviconUrl: resolvedMetadata.faviconUrl,
      tags: [],
      isFavorite: false,
    });
  }

  /** Moves a bookmark to the trash (soft delete). */
  async softDelete(id: string): Promise<void> {
    await bookmarkActions.softDeleteBookmark(id);
    const index = this.items.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        deletedAt: new Date().toISOString(),
      };
    }
  }

  /** Restores a trashed bookmark back to the inbox. */
  async restore(id: string): Promise<void> {
    await bookmarkActions.restoreBookmark(id);
    const index = this.items.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.items[index] = { ...this.items[index], deletedAt: null };
    }
  }

  /** Permanently deletes a bookmark from the database. */
  async deletePermanently(id: string): Promise<void> {
    await bookmarkActions.permanentlyDeleteBookmark(id);
    this.items = this.items.filter((b) => b.id !== id);
  }

  async toggleFavorite(id: string): Promise<void> {
    await bookmarkActions.toggleFavorite(id);
    const index = this.items.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        isFavorite: !this.items[index].isFavorite,
      };
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
  ): Promise<void> {
    await bookmarkActions.updateBookmark(id, data);
    const index = this.items.findIndex((b) => b.id === id);
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        ...data,
      };
    }
  }

  async addTag(bookmarkId: string, tag: string): Promise<void> {
    await bookmarkActions.addTag(bookmarkId, tag);
    const index = this.items.findIndex((b) => b.id === bookmarkId);
    if (index >= 0) {
      const currentTags = this.items[index].tags;
      if (!currentTags.includes(tag)) {
        this.items[index] = {
          ...this.items[index],
          tags: [...currentTags, tag],
        };
      }
    }
  }

  async removeTag(bookmarkId: string, tag: string): Promise<void> {
    await bookmarkActions.removeTag(bookmarkId, tag);
    const index = this.items.findIndex((b) => b.id === bookmarkId);
    if (index >= 0) {
      this.items[index] = {
        ...this.items[index],
        tags: this.items[index].tags.filter((t) => t !== tag),
      };
    }
  }

  async renameTagGlobally(oldTag: string, newTag: string): Promise<void> {
    for (let i = 0; i < this.items.length; i++) {
      const b = this.items[i];
      if (b.tags?.includes(oldTag)) {
        await bookmarkActions.removeTag(b.id, oldTag);
        if (b.tags.includes(newTag)) {
          this.items[i] = {
            ...b,
            tags: b.tags.filter((t) => t !== oldTag),
          };
        } else {
          await bookmarkActions.addTag(b.id, newTag);
          this.items[i] = {
            ...b,
            tags: [...b.tags.filter((t) => t !== oldTag), newTag],
          };
        }
      }
    }
  }

  async deleteTagGlobally(tag: string): Promise<void> {
    for (let i = 0; i < this.items.length; i++) {
      const b = this.items[i];
      if (b.tags?.includes(tag)) {
        await bookmarkActions.removeTag(b.id, tag);
        this.items[i] = {
          ...b,
          tags: b.tags.filter((t) => t !== tag),
        };
      }
    }
  }
}

export const bookmarkStore = new BookmarkStore();
