<script lang="ts">
  import type { Bookmark } from '../types/bookmark';
  import BookmarkCard from './BookmarkCard.svelte';

  let {
    bookmarks = [],
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
  }: {
    bookmarks: Bookmark[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
  } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
  {#each bookmarks as bookmark (bookmark.id)}
    <BookmarkCard {bookmark} {onToggleFavorite} {onDelete} {onAddTag} {onRemoveTag} {onEdit} />
  {/each}
</div>
