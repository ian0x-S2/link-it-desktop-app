import { BookmarkActions } from "../../actions/bookmark.actions";
import { SqliteBookmarkRepository } from "../sqlite/sqlite-bookmark.repository";
// import { MemoryBookmarkRepository } from "../mock/memory-bookmark.repository";

const repository = new SqliteBookmarkRepository();
// const repository = new MemoryBookmarkRepository(); // Descomente para usar mock

export const bookmarkActions = new BookmarkActions(repository);