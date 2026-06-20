<script lang="ts">
  import { pageStore } from '../stores/page.svelte';
  import PageItem from './PageItem.svelte';
  import PageCard from './PageCard.svelte';
  import PageEditor from './PageEditor.svelte';
  import type { UpdatePageInput } from '../types/page';
  import { viewStore } from '$lib/shared/stores/view.svelte';
  import { Input } from '$lib/shared/components/ui/input';

  let {
    categoryId,
  }: {
    categoryId: string;
  } = $props();

  const activePageId = $derived(pageStore.activePage?.id ?? null);
  let searchInput = $state<HTMLInputElement | null>(null);

  const displayedPages = $derived(
    viewStore.searchActive && viewStore.searchQuery.trim()
      ? pageStore.activeItemsFiltered.filter((p) =>
          (p.title || 'Untitled')
            .toLowerCase()
            .includes(viewStore.searchQuery.toLowerCase())
        )
      : pageStore.activeItemsFiltered
  );



  async function handleCreate() {
    await pageStore.create(categoryId);
  }

  async function handleSave(content: string, bannerImage?: string | null) {
    if (!pageStore.activePage) {
      return;
    }
    const data: UpdatePageInput = { content };
    if (bannerImage !== undefined) {
      data.bannerImage = bannerImage;
    }
    await pageStore.save(pageStore.activePage.id, data);
  }
</script>

{#if pageStore.activePage}
  <!-- Editor view -->
  {#key pageStore.activePage.id}
    <PageEditor
      page={pageStore.activePage}
      isSaving={pageStore.isSaving}
      onSave={handleSave}
      onClose={() => pageStore.closePage()}
    />
  {/key}
{:else}
  <!-- List view -->
  <!-- Header -->
  <div
    class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
  >
    <span class="font-bold uppercase tracking-widest text-foreground">Pages</span>
    <div class="flex items-center gap-2 select-none">
      <div class="flex items-center gap-1.5">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => viewStore.setMode('list')}
          class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.mode ===
          'list'
            ? 'bg-primary text-background font-bold'
            : 'hover:text-foreground'}"
        >
          [l]ist
        </span>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => viewStore.setMode('grid')}
          class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.mode ===
          'grid'
            ? 'bg-primary text-background font-bold'
            : 'hover:text-foreground'}"
        >
          [g]rid
        </span>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => {
            const nextActive = !viewStore.searchActive;
            viewStore.setSearchActive(nextActive);
            if (nextActive) {
              setTimeout(() => searchInput?.focus(), 50);
            }
          }}
          class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.searchActive
            ? 'bg-primary text-background font-bold'
            : 'hover:text-foreground'}"
        >
          [s]earch
        </span>
      </div>
    </div>
  </div>

  <!-- Input Container (prevents layout shift) -->
  {#if viewStore.searchActive}
    <div class="px-4 pt-4 shrink-0">
      <div class="flex flex-col mb-4 shrink-0">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm"
        >
          <span class="text-primary font-bold select-none">?</span>
          <Input
            bind:ref={searchInput}
            bind:value={viewStore.searchQuery}
            type="text"
            placeholder="Search pages..."
            class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Page list -->
  <div class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0">
    {#if displayedPages.length === 0}
      <div class="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        {#if viewStore.searchActive && viewStore.searchQuery.trim()}
          <p class="text-xs uppercase tracking-wider text-destructive">✗ No records found</p>
          <p class="text-tui-xs text-dim-foreground">
            &gt; Refine your search query
          </p>
        {:else}
          <div class="text-muted-foreground font-mono text-xs space-y-1">
            <div class="text-primary font-bold">// no pages yet</div>
            <div class="text-dim-foreground">create your first page to start writing.</div>
          </div>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            class="text-tui-xs border border-primary text-primary px-3 py-1 cursor-pointer hover:bg-primary hover:text-background transition-colors"
            onclick={handleCreate}
          >[+ new page]</span>
        {/if}
      </div>
    {:else}
      {#if viewStore.mode === 'grid'}
        <div class="grid grid-cols-2 gap-3">
          {#each displayedPages as page (page.id)}
            <PageCard
              {page}
              onOpen={(id) => pageStore.openPage(id)}
              onDelete={(id) => pageStore.softDelete(id)}
              onToggleFavorite={(id) => pageStore.toggleFavorite(id)}
            />
          {/each}
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each displayedPages as page (page.id)}
            <PageItem
              {page}
              isActive={activePageId === page.id}
              onOpen={(id) => pageStore.openPage(id)}
              onDelete={(id) => pageStore.softDelete(id)}
              onToggleFavorite={(id) => pageStore.toggleFavorite(id)}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  <!-- Bottom count indicator -->
  <div
    class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-tui-xs text-muted-foreground select-none shrink-0 font-bold"
  >
    {displayedPages.length}
    page{displayedPages.length === 1 ? '' : 's'}
  </div>

  {#if pageStore.error}
    <div class="px-3 py-1.5 border-t border-destructive text-tui-xs text-destructive shrink-0">
      {pageStore.error}
    </div>
  {/if}
{/if}
