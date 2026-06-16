<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Popover from "$lib/components/ui/popover";
  import { bookmarkStore } from "$lib/stores/bookmark.svelte";
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from "$lib/tag-popover-utils";
  import { getFavicon } from "$lib/utils";
  import type { Bookmark } from "../types/bookmark";

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

  // Per-item popover state: map of bookmarkId → open/value
  let openPopoverId = $state<string | null>(null);
  let tagInputValue = $state("");

  // All unique tags across all bookmarks for autocomplete
  const allTags = $derived(() => getAllUniqueTags(bookmarkStore.items));

  function getTagSuggestionsForBookmark(bookmark: Bookmark) {
    return getTagSuggestions(allTags(), bookmark.tags, tagInputValue);
  }

  function isNewTagForBookmark(bookmark: Bookmark) {
    const q = tagInputValue.trim().toLowerCase();
    return (
      isNewTagValue(allTags(), tagInputValue) && !bookmark.tags.includes(q)
    );
  }

  function openTagPopover(id: string) {
    tagInputValue = "";
    openPopoverId = id;
  }

  function closeTagPopover() {
    tagInputValue = "";
    openPopoverId = null;
  }

  function submitTag(bookmarkId: string, tag: string) {
    const clean = normaliseTag(tag);
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (clean && bookmark && !bookmark.tags.includes(clean)) {
      onAddTag(bookmarkId, clean);
    }
    closeTagPopover();
  }

  function handleTagKeydown(e: KeyboardEvent, bookmarkId: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = tagInputValue.trim().toLowerCase();
      if (q) {
        submitTag(bookmarkId, q);
      }
    } else if (e.key === "Escape") {
      closeTagPopover();
    }
  }
</script>

<div class="flex flex-col gap-3">
  {#each bookmarks as bookmark, i (bookmark.id)}
    <div
      class="p-3 border border-border-dim flex flex-col gap-2 transition-all duration-150 ease-in-out hover:border-border-hover hover:bg-box-bg/30 {i % 2 === 1 ? 'bg-entry-alt-bg/50' : 'bg-entry-bg/40'}"
    >
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span
            class="text-primary font-bold flex items-center gap-1 select-none"
          >
            <span>[</span>
            {#if getFavicon(bookmark.url, bookmark.faviconUrl)}
              <img
                src={getFavicon(bookmark.url, bookmark.faviconUrl)}
                alt=""
                class="size-3.5 object-contain shrink-0"
                onerror={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              >
            {:else}
              <span
                class="size-3.5 block shrink-0 bg-primary/20 rounded-sm"
              ></span>
            {/if}
            <span>]</span>
          </span>
          <span class="font-bold text-sm text-foreground"
            >{bookmark.title}</span
          >
        </div>
        <span
          class="text-[10px] uppercase tracking-wide text-dim-foreground"
          class:text-primary={bookmark.isFavorite}
        >
          {bookmark.isFavorite ? "★ FAVORITE" : "☆ STANDARD"}
        </span>
      </div>

      <div class="flex flex-col gap-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs truncate self-start text-muted-foreground border-b border-dotted border-border hover:text-primary hover:border-primary"
        >
          {bookmark.url}
        </a>

        {#if bookmark.tags.length || true}
          <div class="flex flex-wrap gap-1 mt-1 items-center">
            {#each bookmark.tags as tag}
              <Badge
                variant="outline"
                class="text-[10px] px-0.5 text-muted-foreground before:content-['\['] before:text-border after:content-['\]'] after:text-border flex items-center font-mono border-none"
              >
                #{tag}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                  onclick={() => onRemoveTag(bookmark.id, tag)}
                  class="text-destructive hover:text-red-400 cursor-pointer text-[8px] ml-0.5 select-none"
                  >x</span
                >
              </Badge>
            {/each}

            <!-- Per-item tag popover -->
            <Popover.Root
              open={openPopoverId === bookmark.id}
              onOpenChange={(open) => {
                if (open) openTagPopover(bookmark.id);
                else closeTagPopover();
              }}
            >
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="ghost"
                    size="xs"
                    class="text-[10px] text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
                  >
                    + add tag
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content
                class="w-52 p-0 rounded-none border border-border bg-box-bg font-mono shadow-lg"
                align="start"
                sideOffset={4}
              >
                <!-- Input -->
                <div
                  class="flex items-center gap-1 px-2 py-1.5 border-b border-border"
                >
                  <span class="text-primary font-bold text-[10px] select-none"
                    >#</span
                  >
                  <Input
                    bind:value={tagInputValue}
                    onkeydown={(e) => handleTagKeydown(e, bookmark.id)}
                    placeholder="tag name..."
                    autofocus
                    class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-[10px] h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <!-- Suggestions -->
                <div class="flex flex-col py-0.5 max-h-40 overflow-y-auto">
                  {#if isNewTagForBookmark(bookmark)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      onclick={() => submitTag(bookmark.id, tagInputValue)}
                      class="px-2 py-1 text-[10px] text-primary cursor-pointer hover:bg-accent/30 select-none"
                    >
                      [Create: "{tagInputValue.trim().toLowerCase()}"]
                    </div>
                  {/if}
                  {#each getTagSuggestionsForBookmark(bookmark) as suggestion}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      onclick={() => submitTag(bookmark.id, suggestion)}
                      class="px-2 py-1 text-[10px] text-muted-foreground cursor-pointer hover:bg-accent/30 hover:text-foreground select-none"
                    >
                      * {suggestion}
                    </div>
                  {/each}
                  {#if getTagSuggestionsForBookmark(bookmark).length === 0 && !isNewTagForBookmark(bookmark)}
                    <div
                      class="px-2 py-1 text-[10px] text-dim-foreground italic select-none"
                    >
                      No tags yet
                    </div>
                  {/if}
                </div>
              </Popover.Content>
            </Popover.Root>
          </div>
        {/if}
      </div>

      <div
        class="flex items-center gap-2 pt-2 border-t border-dashed border-border-dim mt-1"
      >
        <Button
          size="xs"
          variant="outline"
          class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-accent-foreground"
          onclick={() => onToggleFavorite(bookmark.id)}
        >
          {bookmark.isFavorite ? "★ unstar" : "☆ star"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-accent-foreground dark:hover:border-primary dark:hover:bg-accent dark:hover:text-accent-foreground"
          onclick={() => onEdit(bookmark.id)}
        >
          edit
        </Button>
        <span class="text-border-dim text-[0.7rem] select-none">│</span>
        <Button
          size="xs"
          variant="destructive"
          class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:border-destructive dark:hover:text-destructive-foreground"
          onclick={() => onDelete(bookmark.id)}
        >
          &#10007; delete
        </Button>
      </div>
    </div>
  {/each}
</div>
