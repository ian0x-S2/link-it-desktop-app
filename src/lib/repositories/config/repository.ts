import { BookmarkActions } from "../../actions/bookmark";
import { WorkspaceActions } from "../../actions/workspace";
import { SqliteBookmarkRepository } from "../sqlite/sqlite-bookmark.repository";
import { SqliteWorkspaceRepository } from "../sqlite/sqlite-workspace.repository";

// import { MemoryBookmarkRepository } from "../mock/memory-bookmark.repository";

const bookmarkRepository = new SqliteBookmarkRepository();
const workspaceRepository = new SqliteWorkspaceRepository();

// const bookmarkRepository = new MemoryBookmarkRepository(); // Uncomment to use mock

export const bookmarkActions = new BookmarkActions(bookmarkRepository);
export const workspaceActions = new WorkspaceActions(workspaceRepository);
