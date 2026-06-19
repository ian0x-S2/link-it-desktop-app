import { categoryActions } from '../actions/category';
import type { Category, CreateCategoryInput } from '../types/category';
import { viewStore } from '$lib/shared/stores/view.svelte';

class CategoryStore {
  items = $state<Category[]>([]);

  /** The currently active category object (null if none or special view is active). */
  get active(): Category | null {
    const activeId = viewStore.activeCategoryId;
    if (!activeId) return null;
    return this.items.find((c) => c.id === activeId) ?? null;
  }

  /** Count of user-created (non-default) categories. */
  get customItems(): Category[] {
    return this.items.filter((c) => !c.isDefault);
  }

  async load(workspaceId: string): Promise<void> {
    this.items = await categoryActions.getCategories(workspaceId);

    // Select the first category (Links) by default if none is active.
    if (!viewStore.activeCategoryId && this.items.length > 0) {
      viewStore.selectCategory(this.items[0].id);
    }
  }

  /** Explicitly select a category by ID (clears any special view). */
  select(id: string): void {
    viewStore.selectCategory(id);
  }

  async create(input: CreateCategoryInput): Promise<void> {
    const category = await categoryActions.createCategory(input);
    this.items = [...this.items, category];
    viewStore.selectCategory(category.id);
  }

  async delete(id: string): Promise<void> {
    const category = this.items.find((c) => c.id === id);
    if (!category) return;

    await categoryActions.deleteCategory(id, category.isDefault);
    this.items = this.items.filter((c) => c.id !== id);

    // Switch to the first category if the active one was deleted.
    if (viewStore.activeCategoryId === id) {
      if (this.items.length > 0) {
        viewStore.selectCategory(this.items[0].id);
      } else {
        viewStore.activeCategoryId = null;
      }
    }
  }

  /** Reset when switching workspaces — categories will be re-loaded. */
  reset(): void {
    this.items = [];
  }
}

export const categoryStore = new CategoryStore();
