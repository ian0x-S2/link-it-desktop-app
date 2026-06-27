import { pageActions } from '../actions/page';
import type { Page, PageMetadata, UpdatePageInput } from '../types/page';
import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
import { renameTagGloballyHelper, deleteTagGloballyHelper } from '$lib/utils/tag';

class PageStore {
  /** Lightweight metadata list — no content loaded. */
  items = $state<PageMetadata[]>([]);

  /** The page currently open in the editor (full content). */
  activePage = $state<Page | null>(null);

  /** A page ID queued to be opened when the pages category becomes active. */
  pendingOpenPageId = $state<string | null>(null);

  /** If true, the next opened page will force readOnly to false. */
  forceEditModeNext = $state(false);

  isLoading = $state(false);
  isSaving = $state(false);
  error = $state<string | null>(null);

  activeItems = $derived.by(() => this.items.filter((p) => p.deletedAt === null));

  activeItemsFiltered = $derived.by(() => this.items.filter((p) => p.deletedAt === null));

  trashedItems = $derived.by(() => this.items.filter((p) => p.deletedAt !== null));

  async load(): Promise<void> {
    if (!workspaceStore.activeId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.items = await pageActions.getPageMetadata(workspaceStore.activeId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load pages.';
    } finally {
      this.isLoading = false;
    }
  }

  async openPage(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      this.activePage = await pageActions.getPage(id);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to open page.';
    } finally {
      this.isLoading = false;
    }
  }

  closePage(): void {
    this.activePage = null;
  }

  async create(title?: string, content?: string): Promise<Page | null> {
    if (!workspaceStore.activeId) return null;
    try {
      const page = await pageActions.createPage({
        workspaceId: workspaceStore.activeId,
        title,
        content,
      });
      // Prepend metadata to the list.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content: _, ...meta } = page;
      this.items = [meta, ...this.items];
      this.activePage = page;
      this.forceEditModeNext = true;
      return page;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create page.';
      return null;
    }
  }

  /** Called by the editor on autosave (debounced externally). */
  async save(id: string, data: UpdatePageInput): Promise<void> {
    this.isSaving = true;
    try {
      const updatedFields = await pageActions.updatePage(id, data);
      // Update metadata in list.
      const idx = this.items.findIndex((p) => p.id === id);
      if (idx >= 0) {
        this.items[idx] = {
          ...this.items[idx],
          title: updatedFields.title ?? this.items[idx].title,
          bannerImage: updatedFields.bannerImage !== undefined ? updatedFields.bannerImage : this.items[idx].bannerImage,
          updatedAt: new Date().toISOString(),
        };
      }
      if (this.activePage?.id === id) {
        this.activePage = { ...this.activePage, ...updatedFields, updatedAt: new Date().toISOString() };
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save page.';
    } finally {
      this.isSaving = false;
    }
  }

  async softDelete(id: string): Promise<void> {
    await pageActions.softDeletePage(id);
    const idx = this.items.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], deletedAt: new Date().toISOString() };
    }
    if (this.activePage?.id === id) this.closePage();
  }

  async restore(id: string): Promise<void> {
    await pageActions.restorePage(id);
    const idx = this.items.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], deletedAt: null };
    }
  }

  async deletePermanently(id: string): Promise<void> {
    await pageActions.permanentlyDeletePage(id);
    this.items = this.items.filter((p) => p.id !== id);
    if (this.activePage?.id === id) this.closePage();
  }

  async toggleFavorite(id: string): Promise<void> {
    await pageActions.toggleFavorite(id);
    const idx = this.items.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], isFavorite: !this.items[idx].isFavorite };
    }
    if (this.activePage?.id === id) {
      this.activePage = { ...this.activePage, isFavorite: !this.activePage.isFavorite };
    }
  }

  async addTag(pageId: string, tag: string): Promise<void> {
    await pageActions.addTag(pageId, tag);
    const idx = this.items.findIndex((p) => p.id === pageId);
    if (idx >= 0) {
      const existing = this.items[idx].tags || [];
      if (!existing.includes(tag)) {
        this.items[idx] = {
          ...this.items[idx],
          tags: [...existing, tag],
        };
      }
    }
    if (this.activePage?.id === pageId) {
      const existing = this.activePage.tags || [];
      if (!existing.includes(tag)) {
        this.activePage = {
          ...this.activePage,
          tags: [...existing, tag],
        };
      }
    }
  }

  async removeTag(pageId: string, tag: string): Promise<void> {
    await pageActions.removeTag(pageId, tag);
    const idx = this.items.findIndex((p) => p.id === pageId);
    if (idx >= 0) {
      const existing = this.items[idx].tags || [];
      this.items[idx] = {
        ...this.items[idx],
        tags: existing.filter((t) => t !== tag),
      };
    }
    if (this.activePage?.id === pageId) {
      const existing = this.activePage.tags || [];
      this.activePage = {
        ...this.activePage,
        tags: existing.filter((t) => t !== tag),
      };
    }
  }

  async renameTagGlobally(oldTag: string, newTag: string): Promise<void> {
    this.items = await renameTagGloballyHelper(
      this.items,
      oldTag,
      newTag,
      (id, t) => pageActions.addTag(id, t),
      (id, t) => pageActions.removeTag(id, t)
    );
    if (this.activePage?.tags?.includes(oldTag)) {
      if (this.activePage.tags.includes(newTag)) {
        this.activePage = {
          ...this.activePage,
          tags: this.activePage.tags.filter((t) => t !== oldTag),
        };
      } else {
        this.activePage = {
          ...this.activePage,
          tags: [...this.activePage.tags.filter((t) => t !== oldTag), newTag],
        };
      }
    }
  }

  async deleteTagGlobally(tag: string): Promise<void> {
    this.items = await deleteTagGloballyHelper(
      this.items,
      tag,
      (id, t) => pageActions.removeTag(id, t)
    );
    if (this.activePage?.tags?.includes(tag)) {
      this.activePage = {
        ...this.activePage,
        tags: this.activePage.tags.filter((t) => t !== tag),
      };
    }
  }
}

export const pageStore = new PageStore();
