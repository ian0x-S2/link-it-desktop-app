<script lang="ts">
  import type { Media } from '../types/media';
  import { Input } from '$lib/shared/components/ui/input';
  import { mediaStore } from '../stores/media.svelte';
  import { viewStore } from '$lib/shared/stores/view.svelte';
  import { categoryStore } from '$lib/features/categories/stores/category.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';
  import MediaGrid from './MediaGrid.svelte';
  import MediaList from './MediaList.svelte';
  import MediaEditorDialog from './MediaEditorDialog.svelte';
  import { Skeleton } from '$lib/shared/components/ui/skeleton';

  let { promptInput = $bindable(null) } = $props();
  let isCreatingNew = $state(false);
  let draftTitle = $state('');

  const activeCategory = $derived(categoryStore.active);

  const draftMedia = $derived<Media>({
    id: 'draft',
    workspaceId: activeCategory?.workspaceId ?? '',
    title: draftTitle,
    content: '',
    type: 'Movie',
    creator: '',
    description: '',
    url: null,
    imageUrl: null,
    rating: 0,
    status: 'Plan to Watch',
    startedAt: null,
    finishedAt: null,
    progressValue: 0,
    progressTotal: 0,
    progressUnit: 'episodes',
    isFavorite: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  });

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
          item.creator.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  });



  function handleOpenCreate() {
    draftTitle = '';
    isCreatingNew = true;
  }

  async function handleCreateMedia(mediaData: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'isFavorite' | 'deletedAt'>) {
    await mediaStore.create({
      workspaceId: activeCategory?.workspaceId ?? '',
      ...mediaData,
    });
    isCreatingNew = false;
  }

  function handleEdit(id: string) {
    mediaStore.openMedia(id);
  }

  function handleOpenNote(pageId: string) {
    const pagesCategory = categoryStore.items.find((c) => c.type === 'pages');
    if (pagesCategory) {
      pageStore.pendingOpenPageId = pageId;
      viewStore.selectCategory(pagesCategory.id);
    }
  }
</script>

<div class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none">
  <span class="font-bold uppercase tracking-widest text-foreground font-mono">
    [{activeCategory?.icon ?? '?'}] {activeCategory?.name ?? 'Media'}
  </span>
  <div class="flex items-center gap-1.5 font-mono">
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

{#if viewStore.searchActive}
  <div class="px-4 pt-4 shrink-0 font-mono">
    <div class="flex flex-col mb-4 shrink-0">
      <div class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm">
        <span class="text-primary font-bold select-none">?</span>
        <Input bind:ref={promptInput} bind:value={viewStore.searchQuery} type="text" placeholder="Search media..." class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0" />
      </div>
    </div>
  </div>
{/if}

<div class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0">
  {#if mediaStore.isLoading}
    {#if viewStore.mode === 'list'}
      <div class="flex flex-col gap-3 font-mono">
        {#each Array(4) as _, i (i)}
          <div class="border border-border p-3 bg-background flex flex-col md:flex-row gap-3 h-18 justify-between items-center select-none">
            <div class="flex-1 flex flex-col gap-2 w-full">
              <Skeleton class="h-4 w-1/3 bg-muted/20" />
              <Skeleton class="h-3 w-1/2 bg-muted/20" />
            </div>
            <Skeleton class="h-6 w-24 bg-muted/20 shrink-0" />
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 font-mono select-none">
        {#each Array(4) as _, i (i)}
          <div class="border border-border p-4 bg-background flex flex-col gap-3 h-75">
            <Skeleton class="w-full aspect-3/4 bg-muted/20 shrink-0" />
            <Skeleton class="h-4 w-3/4 bg-muted/20" />
            <Skeleton class="h-3 w-1/2 bg-muted/20" />
            <Skeleton class="h-3 w-full bg-muted/20 mt-auto" />
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    {#if viewStore.mode === 'list'}
      <MediaList
        media={displayedItems}
        onToggleFavorite={(id) => mediaStore.toggleFavorite(id)}
        onDelete={(id) => mediaStore.softDelete(id)}
        onAddTag={(id, tag) => mediaStore.addTag(id, tag)}
        onRemoveTag={(id, tag) => mediaStore.removeTag(id, tag)}
        onEdit={handleEdit}
        onAddMedia={handleOpenCreate}
      />
    {:else}
      <MediaGrid
        media={displayedItems}
        onToggleFavorite={(id) => mediaStore.toggleFavorite(id)}
        onDelete={(id) => mediaStore.softDelete(id)}
        onAddTag={(id, tag) => mediaStore.addTag(id, tag)}
        onRemoveTag={(id, tag) => mediaStore.removeTag(id, tag)}
        onEdit={handleEdit}
        onAddMedia={handleOpenCreate}
      />
    {/if}
  {/if}
</div>

<div class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-tui-xs text-muted-foreground select-none shrink-0 font-bold font-mono">
  {displayedItems.length} item{displayedItems.length === 1 ? '' : 's'}
</div>

{#if mediaStore.activeMedia}
  <MediaEditorDialog
    media={mediaStore.activeMedia}
    onClose={() => mediaStore.closeMedia()}
    onOpenNote={handleOpenNote}
  />
{/if}

{#if isCreatingNew}
  <MediaEditorDialog
    media={draftMedia}
    isNew={true}
    onClose={() => { isCreatingNew = false; }}
    onSaveNew={handleCreateMedia}
    onOpenNote={handleOpenNote}
  />
{/if}
