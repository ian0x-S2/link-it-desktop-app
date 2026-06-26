<script lang="ts">
  import { ideaStore } from '../stores/idea.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';
  import { categoryStore } from '$lib/features/categories/stores/category.svelte';
  import { viewStore } from '$lib/shared/stores/view.svelte';
  import IdeaCard from './IdeaCard.svelte';
  import IdeaInputBar from './IdeaInputBar.svelte';
  import { Input } from '$lib/shared/components/ui/input';

  let activeTab = $state<'all' | 'starred'>('all');
  let searchActive = $state(false);
  let searchQuery = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);

  // Filtered ideas based on Tab, Tags, and Search
  const filteredIdeas = $derived.by(() => {
    let list = ideaStore.activeItems;

    // 1. Filter by Tab
    if (activeTab === 'starred') {
      list = list.filter((i) => i.isFavorite);
    }

    // 2. Filter by selected tag
    if (viewStore.selectedTag) {
      const tag = viewStore.selectedTag;
      list = list.filter((i) => (i.tags || []).includes(tag));
    }

    // 3. Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (searchActive && q) {
      list = list.filter((i) => i.content.toLowerCase().includes(q));
    }

    return list;
  });

  async function handleCreate(content: string) {
    await ideaStore.create(content);
  }

  async function handleConvertToNote(id: string, content: string) {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim() || 'Converted Idea';
    const title = firstLine.replace(/^#+\s*/, '').trim() || 'Converted Idea';
    const noteContent = `# ${title}\n\n${content}`;

    const page = await pageStore.create(title, noteContent);
    if (page) {
      // Archive (soft-delete) the original idea
      await ideaStore.softDelete(id);

      // Find the pages category in categoryStore to switch views
      const pagesCat = categoryStore.items.find((c) => c.type === 'pages');
      if (pagesCat) {
        viewStore.selectCategory(pagesCat.id);
      }
    }
  }

  function handleSearchToggle() {
    searchActive = !searchActive;
    if (searchActive) {
      setTimeout(() => searchInput?.focus(), 50);
    } else {
      searchQuery = '';
    }
  }
</script>

<!-- Header -->
<div
  class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
>
  <span class="font-bold uppercase tracking-widest text-foreground">Ideas</span>
  <div class="flex items-center gap-1.5 select-none">
    <!-- Starred / All Tabs -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      onclick={() => (activeTab = 'all')}
      class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {activeTab ===
      'all'
        ? 'bg-primary text-background font-bold'
        : 'hover:text-foreground'}"
    >
      [a]ll
    </span>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      onclick={() => (activeTab = 'starred')}
      class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {activeTab ===
      'starred'
        ? 'bg-primary text-background font-bold'
        : 'hover:text-foreground'}"
    >
      [s]tarred
    </span>

    <!-- Search Toggle -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      onclick={handleSearchToggle}
      class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {searchActive
        ? 'bg-primary text-background font-bold'
        : 'hover:text-foreground'}"
    >
      [s]earch
    </span>
  </div>
</div>

{#if searchActive}
  <div class="shrink-0 border-b border-border bg-box-bg px-3 py-2 h-15.5 flex items-center">
    <div class="flex items-center gap-2 w-full">
      <span class="text-primary font-bold text-tui-xs select-none font-mono">?</span>
      <Input
        bind:ref={searchInput}
        bind:value={searchQuery}
        type="text"
        placeholder="Search ideas..."
        class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {#if searchQuery}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => (searchQuery = '')}
          class="text-tui-xs text-destructive hover:text-red-400 cursor-pointer font-bold select-none shrink-0 font-mono"
          >[clear]</span
        >
      {/if}
    </div>
  </div>
{:else}
  <!-- Quick capture input -->
  <IdeaInputBar onSubmit={handleCreate} />
{/if}

<!-- Ideas list -->
<div
  class="flex-1 min-h-0 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary"
>
  {#if filteredIdeas.length === 0}
    <div class="flex flex-col items-center justify-center h-full gap-2 text-center select-none">
      <div class="text-muted-foreground font-mono text-xs space-y-1">
        <div class="text-primary font-bold">// no ideas found</div>
        <div class="text-dim-foreground">
          {searchQuery || viewStore.selectedTag
            ? 'try clearing search or tag filters.'
            : 'type above to capture your first thought.'}
        </div>
      </div>
    </div>
  {:else}
    <div class="space-y-2">
      {#each filteredIdeas as idea (idea.id)}
        <IdeaCard
          {idea}
          onDelete={(id) => ideaStore.softDelete(id)}
          onToggleFavorite={(id) => ideaStore.toggleFavorite(id)}
          onUpdate={(id, content) => ideaStore.update(id, content)}
          onAddTag={(id, tag) => ideaStore.addTag(id, tag)}
          onRemoveTag={(id, tag) => ideaStore.removeTag(id, tag)}
          onConvertToNote={handleConvertToNote}
        />
      {/each}
    </div>
  {/if}

  {#if ideaStore.error}
    <div class="mt-2 text-tui-xs text-destructive font-mono">{ideaStore.error}</div>
  {/if}
</div>
