<script lang="ts">
  import { untrack } from 'svelte';
  import { setupKeyboardShortcuts } from '$lib/actions/keyboardShortcuts';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import FooterBar from '$lib/components/FooterBar.svelte';
  import { filteredBookmarksStore } from '$lib/derived/filteredBookmarks.svelte';
  import { bookmarkStore } from '$lib/stores/bookmark.svelte';
  import { THEMES, themeStore } from '$lib/stores/theme.svelte';
  import { viewStore } from '$lib/stores/view.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';

  // Extracted components
  import EditBookmarkDialog from '$lib/features/bookmarks/components/EditBookmarkDialog.svelte';
  import BookmarkPanel from '$lib/features/bookmarks/components/BookmarkPanel.svelte';
  import BookmarkSidePanels from '$lib/features/bookmarks/components/BookmarkSidePanels.svelte';

  // Prompt input ref (local UI concern for keyboard shortcut integration)
  let promptInput = $state<HTMLInputElement | null>(null);

  // Edit bookmark dialog state
  let editDialogOpen = $state(false);
  let editBookmarkId = $state<string | null>(null);

  const totalItems = $derived(bookmarkStore.activeItems.length);
  const favoriteCount = $derived(bookmarkStore.activeItems.filter((b) => b.isFavorite).length);
  const trashCount = $derived(bookmarkStore.trashedItems.length);

  async function handleAddLink(
    url: string,
    metadata?: {
      title: string;
      description: string;
      imageUrl: string;
      faviconUrl: string;
    } | null,
  ) {
    await bookmarkStore.addBookmark(url, metadata || undefined);
  }

  function handleEdit(id: string) {
    editBookmarkId = id;
    editDialogOpen = true;
  }

  async function handleSaveBookmark(
    id: string,
    data: { title: string; description: string; imageUrl: string; tags: string[] },
  ) {
    const bookmark = bookmarkStore.items.find((b) => b.id === id);
    if (!bookmark) return;

    // 1. Update bookmark title, description, imageUrl
    await bookmarkStore.update(id, {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
    });

    // 2. Reconcile tags
    const oldTags = bookmark.tags || [];
    const newTags = data.tags;

    // Tags to remove
    for (const tag of oldTags) {
      if (!newTags.includes(tag)) {
        await bookmarkStore.removeTag(id, tag);
      }
    }

    // Tags to add
    for (const tag of newTags) {
      if (!oldTags.includes(tag)) {
        await bookmarkStore.addTag(id, tag);
      }
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

  // Load stats when settings view is active
  $effect(() => {
    if (viewStore.category === 'settings') {
      workspaceStore.loadStats();
    }
  });
</script>

<div
  class="flex h-full flex-col lg:overflow-hidden bg-background text-foreground font-mono p-4 gap-4 overflow-y-auto lg:overflow-y-hidden"
>
  <!-- 3-Column Layout -->
  <div class="flex flex-1 overflow-visible lg:overflow-hidden gap-4 min-h-0 flex-col lg:flex-row">
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

    <!-- Center Column: Main Content -->
    <BookmarkPanel
      bookmarks={filteredBookmarksStore.items}
      category={viewStore.category}
      mode={viewStore.mode}
      searchActive={viewStore.searchActive}
      bind:searchQuery={viewStore.searchQuery}
      selectedTag={viewStore.selectedTag}
      bind:promptInput={promptInput}
      onModeChange={(m) => viewStore.setMode(m)}
      onSearchToggle={(active) => {
        viewStore.setSearchActive(active);
      }}
      onSearchChange={(q) => {
        viewStore.searchQuery = q;
      }}
      onClearTag={() => viewStore.clearTag()}
      onEdit={handleEdit}
      onDelete={(id) =>
        viewStore.category === 'trash'
          ? bookmarkStore.deletePermanently(id)
          : bookmarkStore.softDelete(id)}
      onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
      onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
      onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
      onAddLink={handleAddLink}
      stats={workspaceStore.stats}
      onCloseSettings={() => viewStore.setCategory('inbox')}
    />

    <!-- Right Column: Stats + Tags + Logo -->
    <BookmarkSidePanels
      bookmarks={bookmarkStore.items}
      bind:selectedTag={viewStore.selectedTag}
      onRenameTag={(oldTag, newTag) => bookmarkStore.renameTagGlobally(oldTag, newTag)}
      onDeleteTag={(tag) => bookmarkStore.deleteTagGlobally(tag)}
    />
  </div>

  <!-- Footer -->
  <FooterBar />
</div>

<!-- Edit Bookmark Dialog -->
<EditBookmarkDialog
  bind:open={editDialogOpen}
  bookmarkId={editBookmarkId}
  {bookmarkStore}
  onSave={handleSaveBookmark}
/>
