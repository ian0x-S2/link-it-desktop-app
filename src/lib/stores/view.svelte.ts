export type ViewMode = 'grid' | 'list';
export type Category = 'inbox' | 'favorites' | 'trash' | 'settings';

class ViewStore {
  mode = $state<ViewMode>('grid');
  category = $state<Category>('inbox');
  selectedTag = $state<string | null>(null);
  searchQuery = $state('');
  searchActive = $state(false);

  setCategory(cat: Category) {
    this.category = cat;
    this.selectedTag = null;
  }

  setMode(mode: ViewMode) {
    this.mode = mode;
    this.selectedTag = null;
  }

  setSearchActive(active: boolean) {
    this.searchActive = active;
    if (!active) {
      this.searchQuery = '';
    }
  }

  clearTag() {
    this.selectedTag = null;
  }
}

export const viewStore = new ViewStore();
