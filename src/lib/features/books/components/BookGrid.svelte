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
    onOpen,
    onAddBook,
  }: {
    books: Book[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
    onOpen?: (id: string) => void;
    onAddBook: () => void;
  } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
  {#each books as book (book.id)}
    <BookCard {book} {onToggleFavorite} {onDelete} {onAddTag} {onRemoveTag} {onEdit} {onOpen} />
  {/each}

  <!-- Ghost Card to add a new book (always at the end) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onclick={onAddBook}
    class="group relative bg-background border border-dashed border-border flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer hover:bg-box-bg/20 transition-all min-h-75 font-mono text-xs rounded-none"
  >
    <span
      class="absolute top-0 left-0 size-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    ></span>
    <span
      class="absolute top-0 right-0 size-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    ></span>
    <span
      class="absolute bottom-0 left-0 size-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    ></span>
    <span
      class="absolute bottom-0 right-0 size-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    ></span>

    <span
      class="text-2xl text-muted-foreground group-hover:text-primary transition-colors font-bold mb-2"
      >+</span
    >
    <span
      class="font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest text-tui-xs"
      >Add New Book</span
    >
    <span class="text-tui-2xs text-dim-foreground mt-1 select-none">// click to catalog a book</span
    >
  </div>
</div>
