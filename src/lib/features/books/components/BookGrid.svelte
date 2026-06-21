<script lang="ts">
  import BookCard from './BookCard.svelte';
  import type { Book } from '../types/book';

  let {
    books = [],
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
  }: {
    books: Book[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
  } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
  {#each books as book (book.id)}
    <BookCard
      book={ book }
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
    />
  {/each}
</div>
