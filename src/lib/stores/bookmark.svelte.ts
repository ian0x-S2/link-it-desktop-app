import type { Bookmark } from "../types/bookmark";
import { bookmarkActions } from "../../lib/repositories/config/repository";

class BookmarkStore {
  items = $state<Bookmark[]>([]);

  

  async load() {
    this.items = await bookmarkActions.getBookmarks();
  }

  async create(data) {
    const bookmark = await bookmarkActions.createBookmark(data);
    this.items.unshift(bookmark);
  }

  async delete(id:string){
    await bookmarkActions.deleteBookmark(id);
    this.items = this.items.filter(b => b.id !== id);
  }
}

export const bookmarkStore = new BookmarkStore( )