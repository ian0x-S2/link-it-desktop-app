export type ViewMode = "grid" | "list" | "search";
export type Category = "inbox" | "favorites" | "trash";

class ViewStore {
  mode = $state<ViewMode>("grid");
  category = $state<Category>("inbox");
  selectedTag = $state<string | null>(null);
  searchQuery = $state("");

  setCategory(cat: Category) {
    this.category = cat;
    this.selectedTag = null;
  }

  setMode(mode: ViewMode) {
    this.mode = mode;
    this.selectedTag = null;
  }

  clearTag() {
    this.selectedTag = null;
  }
}

export const viewStore = new ViewStore();
