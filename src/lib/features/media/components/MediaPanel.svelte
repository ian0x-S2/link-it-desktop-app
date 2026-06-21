<script lang="ts">
  import { Input } from '$lib/shared/components/ui/input';
  import { mediaStore } from '../stores/media.svelte';
  import { viewStore } from '$lib/shared/stores/view.svelte';
  import { categoryStore } from '$lib/features/categories/stores/category.svelte';
  import MediaGrid from './MediaGrid.svelte';
  import MediaList from './MediaList.svelte';
  import EditMediaDialog from './EditMediaDialog.svelte';

  let { promptInput = $bindable(null) } = $props();
  let promptValue = $state('');

  let editDialogOpen = $state(false);
  let editId = $state<string | null>(null);

  const activeCategory = $derived(categoryStore.active);

  const displayedItems = $derived.by(() => {
    let list = mediaStore.activeItemsFiltered;
    if (viewStore.selectedTag) {
      list = list.filter((item) => item.tags?.includes(viewStore.selectedTag!));
    }
    if (viewStore.searchActive && viewStore.searchQuery.trim()) {
      const q = viewStore.searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  });

  async function handleAdd() {
    if (!promptValue.trim()) return;

    await mediaStore.create({
      workspaceId: activeCategory?.workspaceId ?? '',
      title: promptValue.trim(),
      content: '',
      rating: 0, status: 'Plan to Watch',
      tags: []
    });

    promptValue = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleEdit(id: string) {
    editId = id;
    editDialogOpen = true;
  }
</script>

<div class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none">
  <span class="font-bold uppercase tracking-widest text-foreground">
    [{activeCategory?.icon ?? '?'}] {activeCategory?.name ?? 'Media'}
  </span>
  <div class="flex items-center gap-1.5">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span onclick={() => viewStore.setMode('list')} class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.mode === 'list' ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}">[l]ist</span>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span onclick={() => viewStore.setMode('grid')} class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.mode === 'grid' ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}">[g]rid</span>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span onclick={() => {
      const nextActive = !viewStore.searchActive;
      viewStore.setSearchActive(nextActive);
      if (nextActive) setTimeout(() => promptInput?.focus(), 50);
    }} class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.searchActive ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}">[s]earch</span>
  </div>
</div>

<div class="px-4 pt-4 shrink-0">
  {#if viewStore.searchActive}
    <div class="flex flex-col mb-4 shrink-0">
      <div class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm">
        <span class="text-primary font-bold select-none">?</span>
        <Input bind:ref={promptInput} bind:value={viewStore.searchQuery} type="text" placeholder="Search media..." class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0" />
      </div>
    </div>
  {:else}
    <div class="flex flex-col mb-4 shrink-0">
      <div class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm">
        <span class="text-primary font-bold select-none">$</span>
        <Input bind:ref={promptInput} bind:value={promptValue} onkeydown={handleKeydown} type="text" placeholder="Type title and press Enter to add..." class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0" />
      </div>
    </div>
  {/if}
</div>

<div class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0">
  {#if displayedItems.length > 0}
    {#if viewStore.mode === 'list'}
      <MediaList media={displayedItems} onToggleFavorite={(id) => mediaStore.toggleFavorite(id)} onDelete={(id) => mediaStore.softDelete(id)} onAddTag={(id, tag) => mediaStore.addTag(id, tag)} onRemoveTag={(id, tag) => mediaStore.removeTag(id, tag)} onEdit={handleEdit} />
    {:else}
      <MediaGrid media={displayedItems} onToggleFavorite={(id) => mediaStore.toggleFavorite(id)} onDelete={(id) => mediaStore.softDelete(id)} onAddTag={(id, tag) => mediaStore.addTag(id, tag)} onRemoveTag={(id, tag) => mediaStore.removeTag(id, tag)} onEdit={handleEdit} />
    {/if}
  {:else}
    <div class="flex flex-col items-center justify-center h-full text-center select-none gap-2 py-8">
      <p class="text-xs uppercase tracking-wider text-destructive">✗ No records found</p>
      <p class="text-tui-xs text-dim-foreground">{viewStore.searchActive ? '> Refine your search query' : `> Type above to add a new record`}</p>
    </div>
  {/if}
</div>

<div class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-tui-xs text-muted-foreground select-none shrink-0 font-bold">
  {displayedItems.length} item{displayedItems.length === 1 ? '' : 's'}
</div>

{#if editDialogOpen && editId}
  <EditMediaDialog bind:open={editDialogOpen} mediaId={editId} />
{/if}
