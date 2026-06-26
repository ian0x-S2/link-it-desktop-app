<script lang="ts">
  import type { Book } from '../types/book';
  import { Input } from '$lib/shared/components/ui/input';
  import { bookStore } from '../stores/book.svelte';
  import { viewStore } from '$lib/shared/stores/view.svelte';
  import { categoryStore } from '$lib/features/categories/stores/category.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';
  import BookGrid from './BookGrid.svelte';
  import BookList from './BookList.svelte';
  import BookEditorDialog from './BookEditorDialog.svelte';
  import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu';
  import { Skeleton } from '$lib/shared/components/ui/skeleton';

  let { promptInput = $bindable(null) } = $props();

  /**
   * Navigate to the first 'pages' category after creating a note from a book.
   * Sets pageStore.pendingOpenPageId so it is opened once navigation finishes.
   */
  function handleOpenNote(pageId: string) {
    const pagesCategory = categoryStore.items.find((c) => c.type === 'pages');
    if (pagesCategory) {
      pageStore.pendingOpenPageId = pageId;
      viewStore.selectCategory(pagesCategory.id); // triggers onNavigate → closePage()
    }
  }

  const sortLabels: Record<string, string> = {
    'date-desc': 'DATE ADDED (NEWEST)',
    'date-asc': 'DATE ADDED (OLDEST)',
    'title-asc': 'TITLE (A-Z)',
    'title-desc': 'TITLE (Z-A)',
    'author-asc': 'AUTHOR (A-Z)',
    'author-desc': 'AUTHOR (Z-A)',
    'rating-desc': 'RATING (HIGH TO LOW)',
  };



  // Status Filter and Sort state
  let statusFilter = $state('all');
  let sortBy = $state('date-desc');
  let isCreatingNew = $state(false);

  const activeCategory = $derived(categoryStore.active);

  const draftBook = $derived<Book>({
    id: 'draft',
    workspaceId: activeCategory?.workspaceId ?? '',
    title: '',
    author: '',
    content: '',
    description: '',
    rating: 0,
    status: 'Want to Read',
    startedAt: null,
    finishedAt: null,
    pagesRead: 0,
    pagesTotal: 0,
    tags: [],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    url: null,
    imageUrl: null,
  });

  // Filter and sort books reactively
  const displayedItems = $derived.by(() => {
    let list = bookStore.activeItems;

    // 1. Tag filter
    if (viewStore.selectedTag) {
      list = list.filter((item) => item.tags?.includes(viewStore.selectedTag!));
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((item) => item.status === statusFilter);
    }

    // 3. Search query filter
    if (viewStore.searchActive && viewStore.searchQuery.trim()) {
      const q = viewStore.searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // 4. Sorting
    const sorted = [...list];
    if (sortBy === 'title-asc') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'author-asc') {
      sorted.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (sortBy === 'author-desc') {
      sorted.sort((a, b) => (b.author || '').localeCompare(a.author || ''));
    } else if (sortBy === 'rating-desc') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-asc') {
      sorted.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === 'date-desc') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'date-asc') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return sorted;
  });

  function handleAdd() {
    isCreatingNew = true;
  }

  async function handleCreateBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'isFavorite' | 'deletedAt'>) {
    await bookStore.create({
      workspaceId: activeCategory?.workspaceId ?? '',
      ...bookData,
    });
    isCreatingNew = false;
  }

  function handleEdit(id: string) {
    bookStore.openBook(id);
  }
</script>


  <!-- Toolbar -->
  <div
    class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none font-mono"
  >
    <span class="font-bold uppercase tracking-widest text-foreground">
      [{activeCategory?.icon ?? '?'}] {activeCategory?.name ?? 'Books'}
    </span>
    <div class="flex items-center gap-1.5">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => viewStore.setMode('list')}
        class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.mode ===
        'list'
          ? 'bg-primary text-background font-bold'
          : 'hover:text-foreground'}">[l]ist</span
      >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => viewStore.setMode('grid')}
        class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.mode ===
        'grid'
          ? 'bg-primary text-background font-bold'
          : 'hover:text-foreground'}">[g]rid</span
      >
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => {
          const nextActive = !viewStore.searchActive;
          viewStore.setSearchActive(nextActive);
          if (nextActive) setTimeout(() => promptInput?.focus(), 50);
        }}
        class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {viewStore.searchActive
          ? 'bg-primary text-background font-bold'
          : 'hover:text-foreground'}">[s]earch</span
      >
    </div>
  </div>

  <!-- Tag Filter Indicator Badge if a tag is active -->
  {#if viewStore.selectedTag}
    <div
      class="flex items-center justify-between px-4 py-1 border-b border-border bg-accent/25 text-tui-xs text-primary shrink-0 select-none font-bold font-mono"
    >
      <div class="flex items-center gap-1">
        <span>FILTERED BY:</span>
        <span class="underline">#{viewStore.selectedTag}</span>
      </div>
      <button
        onclick={() => viewStore.clearTag()}
        class="text-destructive hover:text-red-400 font-bold tracking-tui-wide cursor-pointer bg-transparent hover:bg-transparent border-none p-0 h-auto font-mono text-tui-xs"
      >
        [x] CLEAR
      </button>
    </div>
  {/if}



  <!-- Search bar (only visible when search is active) -->
  {#if viewStore.searchActive}
    <div class="px-4 pt-4 shrink-0 font-mono">
      <div class="flex flex-col mb-2 shrink-0">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm"
        >
          <span class="text-primary font-bold select-none">?</span>
          <Input
            bind:ref={promptInput}
            bind:value={viewStore.searchQuery}
            type="text"
            placeholder="Search books..."
            class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Status Filters & Sorting Row -->
  <div
    class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-box-bg/50 px-4 py-2 text-tui-2xs font-mono select-none shrink-0"
  >
    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="text-dim-foreground font-bold">STATUS:</span>
      {#each ['all', 'Want to Read', 'Reading', 'Paused', 'Completed', 'Abandoned'] as statusOption (statusOption)}
        <button
          onclick={() => (statusFilter = statusOption)}
          class="px-1.5 py-0.5 border border-border hover:border-primary transition-colors text-tui-2xs font-bold uppercase font-mono cursor-pointer {statusFilter ===
          statusOption
            ? 'bg-primary text-background font-bold border-primary'
            : 'text-muted-foreground'}"
        >
          {statusOption}
        </button>
      {/each}
    </div>

    <div class="flex items-center gap-1.5">
      <span class="text-dim-foreground font-bold">SORT BY:</span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              class="bg-box-bg border border-border text-foreground hover:border-primary text-tui-xs px-2 py-0.5 outline-none font-mono cursor-pointer font-bold uppercase select-none flex items-center gap-1"
            >
              {sortLabels[sortBy] || sortBy} <span class="text-primary font-bold">▼</span>
            </button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="bg-box-bg border border-border rounded-none font-mono text-tui-xs w-52 max-w-xs shadow-lg"
        >
          <DropdownMenu.RadioGroup bind:value={sortBy}>
            <DropdownMenu.RadioItem value="date-desc">DATE ADDED (NEWEST)</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="date-asc">DATE ADDED (OLDEST)</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="title-asc">TITLE (A-Z)</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="title-desc">TITLE (Z-A)</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="author-asc">AUTHOR (A-Z)</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="author-desc">AUTHOR (Z-A)</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="rating-desc">RATING (HIGH TO LOW)</DropdownMenu.RadioItem
            >
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>

  <!-- Grid/List layout container -->
  <div
    class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0"
  >
    {#if bookStore.isLoading}
      {#if viewStore.mode === 'list'}
        <div class="flex flex-col gap-3 font-mono">
          {#each Array(4) as _, i (i)}
            <div
              class="border border-border p-3 bg-background flex flex-col md:flex-row gap-3 h-18 justify-between items-center select-none"
            >
              <div class="flex-1 flex flex-col gap-2 w-full">
                <Skeleton class="h-4 w-1/3 bg-muted/20" />
                <Skeleton class="h-3 w-1/2 bg-muted/20" />
              </div>
              <Skeleton class="h-6 w-24 bg-muted/20 shrink-0" />
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 font-mono select-none"
        >
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
        <BookList
          books={displayedItems}
          onToggleFavorite={(id) => bookStore.toggleFavorite(id)}
          onDelete={(id) => bookStore.softDelete(id)}
          onAddTag={(id, tag) => bookStore.addTag(id, tag)}
          onRemoveTag={(id, tag) => bookStore.removeTag(id, tag)}
          onEdit={handleEdit}
          onOpen={(id) => bookStore.openBook(id)}
          onAddBook={handleAdd}
        />
      {:else}
        <BookGrid
          books={displayedItems}
          onToggleFavorite={(id) => bookStore.toggleFavorite(id)}
          onDelete={(id) => bookStore.softDelete(id)}
          onAddTag={(id, tag) => bookStore.addTag(id, tag)}
          onRemoveTag={(id, tag) => bookStore.removeTag(id, tag)}
          onEdit={handleEdit}
          onOpen={(id) => bookStore.openBook(id)}
          onAddBook={handleAdd}
        />
      {/if}
    {/if}
  </div>

  <div
    class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-tui-xs text-muted-foreground select-none shrink-0 font-bold font-mono"
  >
    {displayedItems.length} book{displayedItems.length === 1 ? '' : 's'}
  </div>

{#if bookStore.activeBook}
  <BookEditorDialog
    book={bookStore.activeBook}
    onClose={() => bookStore.closeBook()}
    onOpenNote={handleOpenNote}
  />
{/if}

{#if isCreatingNew}
  <BookEditorDialog
    book={draftBook}
    isNew={true}
    onClose={() => { isCreatingNew = false; }}
    onSaveNew={handleCreateBook}
    onOpenNote={handleOpenNote}
  />
{/if}


