<script lang="ts">
  import { Badge } from '$lib/shared/components/ui/badge';
  import { Button } from '$lib/shared/components/ui/button';
  import * as Card from '$lib/shared/components/ui/card';
  import { Input } from '$lib/shared/components/ui/input';
  import * as Popover from '$lib/shared/components/ui/popover';
  import type { Book } from '../types/book';
  import { bookStore } from '../stores/book.svelte';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '$lib/features/bookmarks/utils/tag-popover-utils';

  let {
    book,
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
    onOpen,
  }: {
    book: Book;
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
    onOpen?: (id: string) => void;
  } = $props();

  let addTagOpen = $state(false);
  let newTagValue = $state('');

  const allTags = $derived(getAllUniqueTags(bookStore.items));
  const tagSuggestions = $derived(getTagSuggestions(allTags, book.tags, newTagValue));
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  function submitTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !book.tags.includes(clean)) {
      onAddTag(book.id, clean);
    }
    newTagValue = '';
    addTagOpen = false;
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitTag(newTagValue);
    }
  }

  const metaString = $derived.by(() => {
    const parts = [];
    if (book.author) parts.push(`by ${book.author}`);
    if (book.rating) parts.push('★'.repeat(book.rating));
    if (book.status) parts.push(`[${book.status}]`);
    return parts.join(' │ ');
  });

  const progressPercent = $derived(
    book.pagesTotal > 0
      ? Math.min(100, Math.max(0, Math.round((book.pagesRead / book.pagesTotal) * 100)))
      : 0,
  );

  const progressBar = $derived.by(() => {
    if (book.pagesTotal <= 0) return '';
    const totalBlocks = 12;
    const filledBlocks = Math.round((progressPercent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}] ${progressPercent}%`;
  });

  const previewImage = $derived(book.imageUrl);
</script>

<Card.Root
  class="group relative bg-background border border-transparent flex flex-col min-w-0 py-0 gap-0 shadow-none ring-0 rounded-none"
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

  <Card.Header class="p-0 gap-0 min-h-0 block rounded-none border-none">
    <div
      class="flex items-center justify-between px-2 py-1 border-b border-border text-tui-xs text-muted-foreground select-none shrink-0 w-full"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-primary font-bold">[•]</span>
        <span class="font-mono text-foreground font-bold truncate">Book</span>
      </div>
      <span
        class="shrink-0 ml-2 font-mono text-tui-2xs text-dim-foreground uppercase tracking-widest"
        >books</span
      >
    </div>
  </Card.Header>

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  {#if previewImage}
    <div
      onclick={() => onOpen?.(book.id)}
      class="aspect-3/4 w-full overflow-hidden border-b border-border bg-background flex items-center justify-center shrink-0 cursor-pointer"
    >
      <img
        src={previewImage}
        alt={book.title}
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  {:else}
    <div
      onclick={() => onOpen?.(book.id)}
      class="aspect-3/4 w-full border-b border-border bg-background flex flex-col items-center justify-center text-tui-xs text-dim-foreground font-mono select-none shrink-0 p-2 text-center cursor-pointer hover:bg-box-bg/35 transition-colors"
    >
      <span>[ NO COVER ]</span>
    </div>
  {/if}

  <Card.Content class="p-3 flex flex-col flex-1 gap-2 min-h-0 text-xs">
    <div class="min-w-0">
      <button
        onclick={() => onOpen?.(book.id)}
        class="text-left font-bold text-xs text-foreground leading-tight truncate cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 w-full block"
        >{book.title}</button
      >

      {#if metaString}
        <p class="text-tui-2xs text-primary/80 font-mono font-bold uppercase tracking-wider mt-1">
          {metaString}
        </p>
      {/if}

      {#if progressBar}
        <p class="text-tui-2xs text-primary font-mono font-bold uppercase mt-1.5 select-none">
          {progressBar}
        </p>
      {/if}

      {#if book.description}
        <p class="text-tui-xs text-muted-foreground line-clamp-2 mt-1 leading-tight">
          {book.description}
        </p>
      {:else}
        <p
          class="text-tui-xs text-dim-foreground italic line-clamp-2 mt-1 leading-tight select-none"
        >
          &gt; click to add notes...
        </p>
      {/if}
    </div>

    <div class="flex flex-wrap gap-1 items-center mt-auto pt-1">
      {#each book.tags as tag (tag)}
        <Badge
          variant="outline"
          class="text-tui-2xs px-1 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono"
        >
          *{tag}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            onclick={() => onRemoveTag(book.id, tag)}
            class="text-destructive hover:text-red-400 cursor-pointer font-bold text-[8px] ml-0.5"
            title="Remove tag">x</span
          >
        </Badge>
      {/each}

      <Popover.Root bind:open={addTagOpen}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="xs"
              class="text-tui-2xs text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
              >+ add</Button
            >
          {/snippet}
        </Popover.Trigger>
        <Popover.Content
          class="w-52 p-0 rounded-none border border-border bg-box-bg font-mono shadow-lg"
          align="start"
          sideOffset={4}
        >
          <div class="flex items-center gap-1 px-2 py-1.5 border-b border-border">
            <span class="text-primary font-bold text-tui-xs select-none">#</span>
            <Input
              bind:value={newTagValue}
              onkeydown={handleTagKeydown}
              placeholder="tag name..."
              autofocus
              class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-tui-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div class="flex flex-col py-0.5 max-h-40 overflow-y-auto">
            {#if isNewTag}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                onclick={() => submitTag(newTagValue)}
                class="px-2 py-1 text-tui-xs text-primary cursor-pointer hover:bg-accent/30 select-none"
              >
                [Create: "{newTagValue.trim().toLowerCase()}"]
              </div>
            {/if}
            {#each tagSuggestions as suggestion (suggestion)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                onclick={() => submitTag(suggestion)}
                class="px-2 py-1 text-tui-xs text-muted-foreground cursor-pointer hover:bg-accent/30 hover:text-foreground select-none"
              >
                * {suggestion}
              </div>
            {/each}
            {#if tagSuggestions.length === 0 && !isNewTag}
              <div class="px-2 py-1 text-tui-xs text-dim-foreground italic select-none">
                No tags yet
              </div>
            {/if}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>

    <div
      class="flex items-center gap-2 pt-2 border-t border-dashed border-border-dim text-tui-2xs font-bold select-none shrink-0"
    >
      <Button
        variant="ghost"
        size="xs"
        onclick={() => onToggleFavorite(book.id)}
        class="text-muted-foreground hover:text-primary transition-colors uppercase h-auto p-0 bg-transparent hover:bg-transparent font-mono text-tui-2xs font-bold"
        >[{book.isFavorite ? '★ unstar' : '☆ star'}]</Button
      >
      <Button
        variant="ghost"
        size="xs"
        onclick={() => onEdit(book.id)}
        class="text-muted-foreground hover:text-primary transition-colors uppercase h-auto p-0 bg-transparent hover:bg-transparent font-mono text-tui-2xs font-bold"
        >[edit]</Button
      >
      <Button
        variant="ghost"
        size="xs"
        onclick={() => onDelete(book.id)}
        class="text-destructive hover:text-red-400 transition-colors uppercase h-auto p-0 bg-transparent hover:bg-transparent font-mono text-tui-2xs font-bold"
        >[del]</Button
      >
    </div>
  </Card.Content>
</Card.Root>
