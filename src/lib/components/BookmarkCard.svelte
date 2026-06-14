<script lang="ts">
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

  function handleAddTag() {
    const tag = prompt("Enter tag name:");
    if (tag) {
      const cleanTag = tag.trim().toLowerCase();
      if (cleanTag) {
        onAddTag(bookmark.id, cleanTag);
      }
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

<div
  class="border border-border bg-box-bg flex flex-col hover:border-border-hover transition-colors min-w-0"
>
  <!-- Card Header -->
  <div
    class="flex items-center justify-between px-2 py-1 border-b border-border text-[10px] text-muted-foreground select-none shrink-0"
  >
    <div class="flex items-center gap-1.5 min-w-0">
      <span
        class="size-1.5 rounded-full shrink-0 {bookmark.isFavorite ? 'bg-primary' : 'bg-muted-foreground'}"
      />
      <span class="font-bold text-foreground truncate">{displayUrl}</span>
    </div>
    <span class="shrink-0 ml-2">{calculateAge(bookmark.createdAt)}</span>
  </div>

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
  <div class="p-3 flex flex-col flex-1 gap-2 min-h-0">
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
        <span
          class="text-[9px] px-1 border border-border-dim text-muted-foreground flex items-center gap-1 select-none"
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
        </span>
      {/each}
      <button
        onclick={handleAddTag}
        class="text-[9px] text-dim-foreground hover:text-primary transition-colors select-none font-bold"
      >
        + add
      </button>
    </div>

    <!-- Actions Row -->
    <div
      class="flex items-center gap-3 pt-2 border-t border-dashed border-border-dim text-[9px] font-bold select-none shrink-0"
    >
      <button
        onclick={() => onToggleFavorite(bookmark.id)}
        class="text-muted-foreground hover:text-primary transition-colors uppercase"
      >
        [{bookmark.isFavorite ? '★ unstar' : '☆ star'}]
      </button>
      <button
        onclick={() => onEdit(bookmark.id)}
        class="text-muted-foreground hover:text-primary transition-colors uppercase"
      >
        [edit]
      </button>
      <button
        onclick={() => onDelete(bookmark.id)}
        class="text-destructive hover:text-red-400 transition-colors uppercase"
      >
        [del]
      </button>
    </div>
  </div>
</div>
