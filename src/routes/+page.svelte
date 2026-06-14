<script lang="ts">
  import { onMount } from "svelte";
  import BookmarkGrid from "$lib/components/BookmarkGrid.svelte";
  import BookmarkList from "$lib/components/BookmarkList.svelte";
  import FooterBar from "$lib/components/FooterBar.svelte";
  import LogoPanel from "$lib/components/LogoPanel.svelte";
  import PromptInput from "$lib/components/PromptInput.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import StatsPanel from "$lib/components/StatsPanel.svelte";
  import TagsPanel from "$lib/components/TagsPanel.svelte";
  import { bookmarkStore } from "$lib/stores/bookmark.svelte";
  import { themeStore, THEMES } from "$lib/stores/theme.svelte";
  import { viewStore } from "$lib/stores/view.svelte";
  import { filteredBookmarksStore } from "$lib/derived/filteredBookmarks.svelte";
  import { setupKeyboardShortcuts } from "$lib/actions/keyboardShortcuts";

  // Prompt input ref (local UI concern)
  let promptValue = $state("");
  let promptInput = $state<HTMLInputElement | null>(null);

  const totalItems = $derived(bookmarkStore.items.length);
  const favoriteCount = $derived(
    bookmarkStore.items.filter((b) => b.isFavorite).length
  );

  async function handleAddLink(url: string) {
    // Normalize URL
    let normalizedUrl = url;
    if (!/^https?:\/\//.test(url)) {
      normalizedUrl = `https://${url}`;
    }
    let hostname = normalizedUrl;
    try {
      hostname = new URL(normalizedUrl).hostname;
    } catch (_) {}

    await bookmarkStore.create({
      title: hostname,
      url: normalizedUrl,
      imageUrl: "",
      faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      description: "",
      tags: [],
      isFavorite: false,
    });
  }

  function handleEdit(id: string) {
    const bookmark = bookmarkStore.items.find((b) => b.id === id);
    if (!bookmark) {
      return;
    }
    const newTitle = prompt("Edit title:", bookmark.title);
    if (newTitle && newTitle.trim()) {
      bookmarkStore.update(id, { title: newTitle.trim() });
    }
  }

  onMount(() => {
    themeStore.load();
    bookmarkStore.load();
    return setupKeyboardShortcuts(() => promptInput);
  });
</script>

<div
  class="flex h-full flex-col lg:overflow-hidden bg-background text-foreground font-mono p-4 gap-4 overflow-y-auto lg:overflow-y-hidden"
>
  <!-- 3-Column Layout -->
  <div
    class="flex flex-1 overflow-visible lg:overflow-hidden gap-4 min-h-0 flex-col lg:flex-row"
  >
    <!-- Left Column: Sidebar -->
    <div class="w-full lg:w-64 flex flex-col shrink-0 pt-2">
      <Sidebar
        selectedCategory={viewStore.category}
        onSelectCategory={(cat) => viewStore.setCategory(cat)}
        bookmarkCount={totalItems}
        {favoriteCount}
        currentTheme={themeStore.current}
        themes={THEMES}
        changeTheme={(t) => themeStore.change(t)}
        onAddLinkClick={() => promptInput?.focus()}
      />
    </div>

    <!-- Center Column: Main Content (Bordered card wrapper) -->
    <div class="flex-1 flex flex-col min-h-100 lg:min-h-0 pt-2 min-w-0">
      <div
        class="flex-1 flex flex-col overflow-hidden border border-border bg-box-bg relative"
      >
        <!-- Center Box: LINKS header with view mode tabs -->
        <div
          class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
        >
          <span class="font-bold uppercase tracking-widest text-foreground"
            >Links</span
          >
          <div class="flex items-center gap-1.5">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => viewStore.setMode("list")}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.mode === 'list' ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}"
              >[l]ist</span
            >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => viewStore.setMode("grid")}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.mode === 'grid' ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}"
              >[g]rid</span
            >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => { viewStore.setMode('search'); setTimeout(() => promptInput?.focus(), 50); }}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.mode === 'search' ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}"
              >[s]earch</span
            >
          </div>
        </div>

        <!-- Tag Filter Indicator Badge if a tag is active -->
        {#if viewStore.selectedTag}
          <div
            class="flex items-center justify-between px-4 py-1 border-b border-border bg-accent/25 text-[10px] text-primary shrink-0 select-none font-bold"
          >
            <div class="flex items-center gap-1">
              <span>FILTERED BY:</span>
              <span class="underline">#{viewStore.selectedTag}</span>
            </div>
            <button
              onclick={() => viewStore.clearTag()}
              class="text-destructive hover:text-red-400 font-bold tracking-wider cursor-pointer bg-transparent border-none p-0"
            >
              [x] CLEAR
            </button>
          </div>
        {/if}

        <!-- Prompt Input / Search Bar -->
        {#if viewStore.mode === "search"}
          <div
            class="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-background text-sm shrink-0"
          >
            <span class="text-primary font-bold select-none">?</span>
            <input
              bind:this={promptInput}
              bind:value={viewStore.searchQuery}
              type="text"
              placeholder="Search links..."
              class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs"
            />
          </div>
        {:else}
          <div class="px-4 pt-4 shrink-0">
            <PromptInput
              bind:value={promptValue}
              bind:inputElement={promptInput}
              onAdd={handleAddLink}
            />
          </div>
        {/if}

        <!-- Bookmark content area -->
        <div
          class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0"
        >
          {#if filteredBookmarksStore.items.length > 0}
            {#if viewStore.mode === "list"}
              <BookmarkList
                bookmarks={filteredBookmarksStore.items}
                onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
                onDelete={(id) => bookmarkStore.delete(id)}
                onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
                onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
                onEdit={handleEdit}
              />
            {:else}
              <BookmarkGrid
                bookmarks={filteredBookmarksStore.items}
                onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
                onDelete={(id) => bookmarkStore.delete(id)}
                onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
                onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
                onEdit={handleEdit}
              />
            {/if}
          {:else}
            <div
              class="flex flex-col items-center justify-center h-full text-center select-none gap-2 py-8"
            >
              <p class="text-xs uppercase tracking-wider text-destructive">
                ✗ No records found
              </p>
              <p class="text-[10px] text-dim-foreground">
                {viewStore.mode === "search" ? "> Refine your search query" : "> Press [a] or click $ to add a link"}
              </p>
            </div>
          {/if}
        </div>

        <!-- Bottom count indicator -->
        <div
          class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-[10px] text-muted-foreground select-none shrink-0 font-bold"
        >
          {filteredBookmarksStore.items.length}
          item{filteredBookmarksStore.items.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>

    <!-- Right Column: Stats + Tags + Logo stacked -->
    <div
      class="w-full lg:w-80 flex flex-col gap-4 overflow-visible shrink-0 h-full min-h-0 pt-2"
    >
      <StatsPanel bookmarks={bookmarkStore.items} />
      <TagsPanel
        bookmarks={bookmarkStore.items}
        bind:selectedTag={viewStore.selectedTag}
        onRenameTag={(oldTag, newTag) => bookmarkStore.renameTagGlobally(oldTag, newTag)}
        onDeleteTag={(tag) => bookmarkStore.deleteTagGlobally(tag)}
      />
      <LogoPanel />
    </div>
  </div>

  <!-- Footer -->
  <FooterBar />
</div>

<style>
  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
