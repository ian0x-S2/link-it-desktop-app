<script lang="ts">
  import type { Bookmark } from "../types/bookmark";

  let {
    bookmarks = [],
    selectedTag = $bindable(null),
    onRenameTag,
    onDeleteTag,
  }: {
    bookmarks: Bookmark[];
    selectedTag: string | null;
    onRenameTag: (oldTag: string, newTag: string) => void;
    onDeleteTag: (tag: string) => void;
  } = $props();

  let tagSearch = $state("");

  // Aggregate all unique tags with their bookmark counts
  const tagList = $derived(() => {
    const counts: Record<string, number> = {};
    for (const b of bookmarks) {
      if (b.tags) {
        for (const t of b.tags) {
          counts[t] = (counts[t] || 0) + 1;
        }
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });

  // Filtered tags based on search input
  const filteredTags = $derived(() => {
    const search = tagSearch.trim().toLowerCase();
    if (!search) {
      return tagList();
    }
    return tagList().filter((t) => t.name.toLowerCase().includes(search));
  });

  function handleRename(tag: string) {
    const newName = prompt(`Rename tag "${tag}" globally to:`, tag);
    if (
      newName &&
      newName.trim() &&
      newName.trim().toLowerCase() !== tag.toLowerCase()
    ) {
      onRenameTag(tag, newName.trim().toLowerCase());
    }
  }

  function handleDelete(tag: string) {
    if (
      confirm(
        `Are you sure you want to delete tag "${tag}" globally from all bookmarks?`
      )
    ) {
      onDeleteTag(tag);
    }
  }
</script>

<div
  class="relative p-4 flex flex-col bg-box-bg border border-border lg:flex-[2] min-h-[140px] lg:min-h-0 select-none font-mono"
>
  <span
    class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-[7px] left-[10px] bg-background text-primary"
    >Tags</span
  >

  <!-- Tag search -->
  <div
    class="flex items-center gap-1.5 px-2 py-0.5 border border-border-dim bg-transparent text-[10px] mb-2 shrink-0"
  >
    <span class="text-primary font-bold">/</span>
    <input
      bind:value={tagSearch}
      type="text"
      placeholder="Filter tags..."
      class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-[10px]"
    >
    {#if tagSearch}
      <button
        onclick={() => tagSearch = ""}
        class="text-destructive hover:text-red-400 font-bold font-mono cursor-pointer bg-transparent border-none p-0"
        title="Clear filter"
      >
        ×
      </button>
    {/if}
  </div>

  <!-- Scrollable Tags list -->
  <div
    class="flex-1 overflow-y-auto pr-1 space-y-1 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0"
  >
    {#each filteredTags() as tag (tag.name)}
      <div
        class="flex items-center justify-between text-xs py-0.5 px-1.5 group border border-transparent transition-colors {selectedTag === tag.name ? 'bg-primary text-background font-bold' : 'hover:bg-accent/40'}"
      >
        <!-- Click tag to filter -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => selectedTag = selectedTag === tag.name ? null : tag.name}
          class="flex-1 truncate cursor-pointer py-0.5"
        >
          <span>* {tag.name}</span>
          <span
            class="text-[9px] opacity-70 ml-1"
            class:text-background={selectedTag === tag.name}
            >({tag.count})</span
          >
        </div>

        <!-- Tag actions (hover actions) -->
        <div
          class="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0 transition-opacity"
        >
          <button
            onclick={() => handleRename(tag.name)}
            class="text-[8px] px-1 border border-border-dim hover:border-primary hover:text-primary bg-background text-foreground transition-colors cursor-pointer"
            title="Rename tag globally"
          >
            edit
          </button>
          <button
            onclick={() => handleDelete(tag.name)}
            class="text-[8px] px-1 border border-border-dim hover:border-destructive hover:text-destructive bg-background text-foreground transition-colors cursor-pointer"
            title="Delete tag globally"
          >
            del
          </button>
        </div>
      </div>
    {:else}
      <div class="text-[10px] text-dim-foreground italic py-1">
        {tagSearch ? "✗ No matching tags" : "> No tags found"}
      </div>
    {/each}
  </div>
</div>
