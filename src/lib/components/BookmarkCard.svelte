<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
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
    bookmark,
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
  }: {
    bookmark: Bookmark;
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
  } = $props();

  // Tag popover state
  let addTagOpen = $state(false);
  let newTagValue = $state("");

  // All unique tags across all bookmarks for autocomplete
  const allTags = $derived(() => getAllUniqueTags(bookmarkStore.items));

  // Filter suggestions based on current input (excludes tags already on this bookmark)
  const tagSuggestions = $derived(() =>
    getTagSuggestions(allTags(), bookmark.tags, newTagValue)
  );

  // Whether the typed value is a brand-new tag not in the global list
  const isNewTag = $derived(() => isNewTagValue(allTags(), newTagValue));

  function submitTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !bookmark.tags.includes(clean)) {
      onAddTag(bookmark.id, clean);
    }
    newTagValue = "";
    addTagOpen = false;
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = newTagValue.trim().toLowerCase();
      if (q) {
        submitTag(q);
      }
    } else if (e.key === "Escape") {
      newTagValue = "";
      addTagOpen = false;
    }
  }

  function calculateAge(createdAtString: string): string {
    try {
      const created = new Date(createdAtString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays}d`;
    } catch (e) {
      return "1d";
    }
  }

  const displayUrl = $derived(
    bookmark.url
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .split("/")[0]
  );
</script>

<Card.Root
  class="bg-box-bg border border-border flex flex-col hover:border-border-hover transition-colors min-w-0 py-0 gap-0 shadow-none ring-0 rounded-none"
>
  <!-- Card Header -->
  <Card.Header
    class="p-0 gap-0 min-h-0 @container/card-header block rounded-none border-none"
  >
    <div
      class="flex items-center justify-between px-2 py-1 border-b border-border text-[10px] text-muted-foreground select-none shrink-0 w-full"
    >
      <div class="flex items-center gap-1.5 min-w-0">
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
          <span class="size-3.5 block shrink-0 bg-primary/20 rounded-sm"></span>
        {/if}
        <span class="font-bold text-foreground truncate">{displayUrl}</span>
      </div>
      <span class="shrink-0 ml-2">{calculateAge(bookmark.createdAt)}</span>
    </div>
  </Card.Header>

  <!-- Website Image Preview -->
  {#if bookmark.imageUrl}
    <div
      class="aspect-video w-full overflow-hidden border-b border-border bg-background flex items-center justify-center shrink-0"
    >
      <img
        src={bookmark.imageUrl}
        alt={bookmark.title}
        class="w-full h-full object-cover"
      >
    </div>
  {:else}
    <div
      class="aspect-video w-full border-b border-border bg-background flex flex-col items-center justify-center text-[10px] text-dim-foreground font-mono select-none shrink-0 p-2 text-center"
    >
      <span>[ NO PREVIEW ]</span>
      <span class="text-[8px] opacity-40 truncate w-full mt-1"
        >{bookmark.url}</span
      >
    </div>
  {/if}

  <!-- Card Body -->
  <Card.Content class="p-3 flex flex-col flex-1 gap-2 min-h-0 text-xs">
    <div class="min-w-0">
      <h3 class="font-bold text-xs text-foreground leading-tight truncate">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-primary transition-colors"
        >
          {bookmark.title}
        </a>
      </h3>
      {#if bookmark.description}
        <p
          class="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-tight"
        >
          {bookmark.description}
        </p>
      {/if}
    </div>

    <!-- Tags Row -->
    <div class="flex flex-wrap gap-1 items-center mt-auto pt-1">
      {#each bookmark.tags as tag}
        <Badge
          variant="outline"
          class="text-[9px] px-1 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono"
        >
          *{tag}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            onclick={() => onRemoveTag(bookmark.id, tag)}
            class="text-destructive hover:text-red-400 cursor-pointer font-bold text-[8px] ml-0.5"
            title="Remove tag"
            >x</span
          >
        </Badge>
      {/each}

      <!-- Tag Popover -->
      <Popover.Root bind:open={addTagOpen}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="xs"
              class="text-[9px] text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
            >
              + add
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
              bind:value={newTagValue}
              onkeydown={handleTagKeydown}
              placeholder="tag name..."
              autofocus
              class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-[10px] h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <!-- Suggestions -->
          <div class="flex flex-col py-0.5 max-h-40 overflow-y-auto">
            {#if isNewTag()}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                onclick={() => submitTag(newTagValue)}
                class="px-2 py-1 text-[10px] text-primary cursor-pointer hover:bg-accent/30 select-none"
              >
                [Create: "{newTagValue.trim().toLowerCase()}"]
              </div>
            {/if}
            {#each tagSuggestions() as suggestion}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                onclick={() => submitTag(suggestion)}
                class="px-2 py-1 text-[10px] text-muted-foreground cursor-pointer hover:bg-accent/30 hover:text-foreground select-none"
              >
                * {suggestion}
              </div>
            {/each}
            {#if tagSuggestions().length === 0 && !isNewTag()}
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

    <!-- Actions Row -->
    <div
      class="flex items-center gap-3 pt-2 border-t border-dashed border-border-dim text-[9px] font-bold select-none shrink-0"
    >
      <Button
        variant="ghost"
        size="xs"
        onclick={() => onToggleFavorite(bookmark.id)}
        class="text-muted-foreground hover:text-primary transition-colors uppercase h-auto p-0 bg-transparent hover:bg-transparent font-mono text-[9px] font-bold"
      >
        [{bookmark.isFavorite ? '★ unstar' : '☆ star'}]
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onclick={() => onEdit(bookmark.id)}
        class="text-muted-foreground hover:text-primary transition-colors uppercase h-auto p-0 bg-transparent hover:bg-transparent font-mono text-[9px] font-bold"
      >
        [edit]
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onclick={() => onDelete(bookmark.id)}
        class="text-destructive hover:text-red-400 transition-colors uppercase h-auto p-0 bg-transparent hover:bg-transparent font-mono text-[9px] font-bold"
      >
        [del]
      </Button>
    </div>
  </Card.Content>
</Card.Root>
