<script lang="ts">
  import { untrack } from "svelte";
  import { setupKeyboardShortcuts } from "$lib/actions/keyboardShortcuts";
  import BookmarkGrid from "$lib/components/BookmarkGrid.svelte";
  import BookmarkList from "$lib/components/BookmarkList.svelte";
  import FooterBar from "$lib/components/FooterBar.svelte";
  import LogoPanel from "$lib/components/LogoPanel.svelte";
  import PromptInput from "$lib/components/PromptInput.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import StatsPanel from "$lib/components/StatsPanel.svelte";
  import TagsPanel from "$lib/components/TagsPanel.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { filteredBookmarksStore } from "$lib/derived/filteredBookmarks.svelte";
  import { bookmarkStore } from "$lib/stores/bookmark.svelte";
  import { THEMES, themeStore } from "$lib/stores/theme.svelte";
  import { viewStore } from "$lib/stores/view.svelte";
  import { workspaceStore } from "$lib/stores/workspace.svelte";

  // Prompt input ref (local UI concern)
  let promptValue = $state("");
  let promptInput = $state<HTMLInputElement | null>(null);

  // Edit bookmark title dialog state
  let editDialogOpen = $state(false);
  let editBookmarkId = $state<string | null>(null);
  let editTitleValue = $state("");

  const totalItems = $derived(bookmarkStore.activeItems.length);
  const favoriteCount = $derived(
    bookmarkStore.activeItems.filter((b) => b.isFavorite).length
  );
  const trashCount = $derived(bookmarkStore.trashedItems.length);

  async function handleAddLink(
    url: string,
    metadata?: {
      title: string;
      description: string;
      imageUrl: string;
      faviconUrl: string;
    } | null
  ) {
    await bookmarkStore.addBookmark(url, metadata || undefined);
  }

  function handleEdit(id: string) {
    const bookmark = bookmarkStore.items.find((b) => b.id === id);
    if (!bookmark) {
      return;
    }
    editBookmarkId = id;
    editTitleValue = bookmark.title;
    editDialogOpen = true;
  }

  function confirmEditTitle() {
    if (editBookmarkId && editTitleValue.trim()) {
      bookmarkStore.update(editBookmarkId, { title: editTitleValue.trim() });
    }
    editDialogOpen = false;
    editBookmarkId = null;
    editTitleValue = "";
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEditTitle();
    }
  }

  $effect(() => {
    untrack(() => {
      themeStore.load();
      workspaceStore.load();
    });
    return setupKeyboardShortcuts(() => promptInput);
  });

  // Reload bookmarks whenever the active workspace changes.
  $effect(() => {
    if (workspaceStore.activeId) {
      bookmarkStore.load();
    }
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
        workspaces={workspaceStore.items}
        activeWorkspaceId={workspaceStore.activeId}
        onSelectWorkspace={(id) => {
          workspaceStore.select(id);
          viewStore.setCategory('inbox');
        }}
        onCreateWorkspace={(name) => workspaceStore.create(name)}
        onDeleteWorkspace={(id) => workspaceStore.delete(id)}
        selectedCategory={viewStore.category}
        onSelectCategory={(cat) => viewStore.setCategory(cat)}
        bookmarkCount={totalItems}
        {favoriteCount}
        {trashCount}
        currentTheme={themeStore.current}
        themes={THEMES}
        changeTheme={(t) => themeStore.change(t as (typeof THEMES)[number])}
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
              onclick={() => {
                const nextActive = !viewStore.searchActive;
                viewStore.setSearchActive(nextActive);
                if (nextActive) {
                  setTimeout(() => promptInput?.focus(), 50);
                }
              }}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.searchActive ? 'bg-primary text-background font-bold' : 'hover:text-foreground'}"
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
            <Button
              variant="ghost"
              size="xs"
              onclick={() => viewStore.clearTag()}
              class="text-destructive hover:text-red-400 font-bold tracking-wider cursor-pointer bg-transparent hover:bg-transparent border-none p-0 h-auto font-mono text-[10px]"
            >
              [x] CLEAR
            </Button>
          </div>
        {/if}

        <!-- Input Container (prevents layout shift) -->
        <div class="px-4 pt-4 shrink-0">
          {#if viewStore.searchActive}
            <div class="flex flex-col mb-4 shrink-0">
              <div
                class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm"
              >
                <span class="text-primary font-bold select-none">?</span>
                <Input
                  bind:ref={promptInput}
                  bind:value={viewStore.searchQuery}
                  type="text"
                  placeholder="Search links..."
                  class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          {:else}
            <PromptInput
              bind:value={promptValue}
              bind:inputElement={promptInput}
              onAdd={handleAddLink}
            />
          {/if}
        </div>

        <!-- Bookmark content area -->
        <div
          class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0"
        >
          {#if filteredBookmarksStore.items.length > 0}
            {#if viewStore.mode === "list"}
              <BookmarkList
                bookmarks={filteredBookmarksStore.items}
                onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
                onDelete={(id) => viewStore.category === 'trash' ? bookmarkStore.deletePermanently(id) : bookmarkStore.softDelete(id)}
                onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
                onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
                onEdit={handleEdit}
              />
            {:else}
              <BookmarkGrid
                bookmarks={filteredBookmarksStore.items}
                onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
                onDelete={(id) => viewStore.category === 'trash' ? bookmarkStore.deletePermanently(id) : bookmarkStore.softDelete(id)}
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
                {viewStore.searchActive ? "> Refine your search query" : "> Press [a] or click $ to add a link"}
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

<!-- Edit Bookmark Title Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title
        class="text-xs font-bold uppercase tracking-widest text-primary"
      >
        // Edit Title
      </Dialog.Title>
      <Dialog.Description class="text-[10px] text-muted-foreground mt-1">
        Update the display title for this bookmark.
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-4 py-3">
      <div
        class="flex items-center gap-1.5 px-2 py-1.5 border border-border bg-transparent"
      >
        <span class="text-primary font-bold text-[10px] select-none">$</span>
        <Input
          id="edit-title-input"
          bind:value={editTitleValue}
          onkeydown={handleEditKeydown}
          placeholder="Bookmark title..."
          autofocus
          class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
    <Dialog.Footer
      class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3"
    >
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="font-mono text-[10px] rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-wider h-auto py-1 px-3 cursor-pointer"
          >
            [cancel]
          </Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={confirmEditTitle}
        class="font-mono text-[10px] rounded-none border border-primary text-primary hover:bg-primary hover:text-background uppercase tracking-wider h-auto py-1 px-3 cursor-pointer"
      >
        [save]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
