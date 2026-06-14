<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
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

  function handleAddTag(id: string) {
    const tag = prompt("Enter tag name:");
    if (tag) {
      const cleanTag = tag.trim().toLowerCase();
      if (cleanTag) {
        onAddTag(id, cleanTag);
      }
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
          <span class="text-primary font-bold"
            >[ {String(i + 1).padStart(2, '0')} ]</span
          >
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
            <Button
              variant="ghost"
              size="xs"
              onclick={() => handleAddTag(bookmark.id)}
              class="text-[10px] text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
            >
              + add tag
            </Button>
          </div>
        {/if}
      </div>

      <div
        class="flex items-center gap-2 pt-2 border-t border-dashed border-border-dim mt-1"
      >
        <Button
          size="xs"
          variant="outline"
          class="font-mono uppercase tracking-[0.05em] text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-accent-foreground"
          onclick={() => onToggleFavorite(bookmark.id)}
        >
          {bookmark.isFavorite ? "★ unstar" : "☆ star"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          class="font-mono uppercase tracking-[0.05em] text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-accent-foreground"
          onclick={() => onEdit(bookmark.id)}
        >
          edit
        </Button>
        <span class="text-border-dim text-[0.7rem] select-none">│</span>
        <Button
          size="xs"
          variant="destructive"
          class="font-mono uppercase tracking-[0.05em] text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:bg-destructive hover:border-destructive hover:text-destructive-foreground"
          onclick={() => onDelete(bookmark.id)}
        >
          &#10007; delete
        </Button>
      </div>
    </div>
  {/each}
</div>
