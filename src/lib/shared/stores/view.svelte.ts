export type ViewMode = 'grid' | 'list';

/**
 * Special cross-category views that are not tied to a specific category in the DB.
 * - 'favorites' — favorites from all content types
 * - 'trash'     — soft-deleted items from all content types
 * - 'settings'  — application settings
 */
export type SpecialView = 'favorites' | 'trash' | 'settings';

class ViewStore {
  mode = $state<ViewMode>('grid');

  /**
   * ID of the active DB category (from `categoryStore`).
   * Null when a special view is active instead.
   */
  activeCategoryId = $state<string | null>(null);

  /**
   * Active special view (favorites / trash / settings).
   * Null when a regular category is selected.
   */
  specialView = $state<SpecialView | null>(null);

  selectedTag = $state<string | null>(null);
  searchQuery = $state('');
  searchActive = $state(false);

  // ── Convenience getters ──────────────────────────────────────────────────────

  get isSpecialView(): boolean {
    return this.specialView !== null;
  }

  get isCategoryView(): boolean {
    return this.activeCategoryId !== null && this.specialView === null;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /** Navigate to a DB-persisted category by its ID. */
  selectCategory(id: string): void {
    this.activeCategoryId = id;
    this.specialView = null;
    this.selectedTag = null;
    this.searchActive = false;
    this.searchQuery = '';
  }

  /** Navigate to a special view (favorites / trash / settings). */
  selectSpecialView(view: SpecialView): void {
    this.specialView = view;
    this.activeCategoryId = null;
    this.selectedTag = null;
    this.searchActive = false;
    this.searchQuery = '';
  }

  setMode(mode: ViewMode): void {
    this.mode = mode;
    this.selectedTag = null;
  }

  setSearchActive(active: boolean): void {
    this.searchActive = active;
    if (!active) {
      this.searchQuery = '';
    }
  }

  clearTag(): void {
    this.selectedTag = null;
  }
}

export const viewStore = new ViewStore();
