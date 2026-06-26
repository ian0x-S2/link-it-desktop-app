<script lang="ts">
  import { Badge } from '$lib/shared/components/ui/badge';
  import { Button } from '$lib/shared/components/ui/button';
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
    const totalBlocks = 16;
    const filledBlocks = Math.round((progressPercent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}] ${progressPercent}%`;
  });
</script>

<div
  class="group relative flex flex-col md:flex-row md:items-center justify-between p-3 border border-border bg-background gap-3 font-mono text-xs hover:border-primary transition-colors rounded-none"
>
  <div class="flex items-start gap-3 min-w-0 flex-1">
    <div class="flex items-center gap-1.5 shrink-0 select-none text-muted-foreground mt-0.5">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => onToggleFavorite(book.id)}
        class="cursor-pointer hover:text-primary transition-colors font-bold select-none"
        >{book.isFavorite ? '★' : '☆'}</span
      >
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex flex-col md:flex-row md:items-baseline gap-x-2 gap-y-0.5">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => onOpen?.(book.id)}
          class="font-bold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
          >{book.title}</span
        >
        {#if book.url}
          <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-tui-2xs text-muted-foreground hover:text-primary truncate font-normal"
            >({book.url})</a
          >
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
        {#if metaString}
          <div class="text-tui-2xs text-primary/80 font-bold uppercase tracking-wider">
            {metaString}
          </div>
        {/if}
        {#if progressBar}
          <div class="text-tui-2xs text-primary font-bold uppercase select-none">{progressBar}</div>
        {/if}
      </div>

      {#if book.description}
        <p class="text-tui-xs text-muted-foreground line-clamp-2 mt-1 leading-tight">
          {book.description}
        </p>
      {/if}

      <div class="flex flex-wrap gap-1 items-center mt-2">
        {#each book.tags as tag (tag)}
          <Badge
            variant="outline"
            class="text-tui-2xs px-1.5 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono py-0"
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
                >+ tag</Button
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
    </div>
  </div>

  <div
    class="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 border-dashed border-border-dim pt-2 md:pt-0"
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
</div>
