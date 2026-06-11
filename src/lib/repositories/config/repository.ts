import {BookmarkActions} from "../../actions/bookmark.actions"

import {MemoryBookmarkRepository} from "../../repositories/mock/memory-bookmark.repository";

const repository = new MemoryBookmarkRepository();
export const bookmarkActions = new BookmarkActions(repository);