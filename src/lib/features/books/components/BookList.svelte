<script lang="ts">
  import BookItem from './BookItem.svelte';
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

<div class="flex flex-col gap-3">
  {#each books as book (book.id)}
    <BookItem
      book={ book }
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
      onOpen={onOpen}
    />
  {/each}

  <!-- Ghost List Item as last element -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    onclick={onAddBook}
    class="group relative flex items-center justify-center p-4 border border-dashed border-border bg-background text-center select-none cursor-pointer hover:bg-box-bg/20 transition-all font-mono text-xs rounded-none py-3"
  >
    <span class="absolute top-0 left-0 size-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
    <span class="absolute top-0 right-0 size-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
    <span class="absolute bottom-0 left-0 size-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
    <span class="absolute bottom-0 right-0 size-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>

    <div class="flex items-center gap-2">
      <span class="text-lg text-primary font-bold group-hover:scale-110 transition-transform">+</span>
      <span class="font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider text-tui-xs">Catalog a New Book</span>
    </div>
  </div>
</div>
