<script lang="ts">
  import { untrack } from 'svelte';
  import { setupKeyboardShortcuts } from '$lib/actions/keyboardShortcuts';
  import Sidebar from '$lib/shared/components/Sidebar.svelte';
  import FooterBar from '$lib/shared/components/FooterBar.svelte';

  // Bookmarks (Links)
  import { filteredBookmarksStore } from '$lib/features/bookmarks/stores/filteredBookmarks.svelte';
  import { bookmarkStore } from '$lib/features/bookmarks/stores/bookmark.svelte';
  import EditBookmarkDialog from '$lib/features/bookmarks/components/EditBookmarkDialog.svelte';
  import BookmarkPanel from '$lib/features/bookmarks/components/BookmarkPanel.svelte';
  import BookmarkSidePanels from '$lib/features/bookmarks/components/BookmarkSidePanels.svelte';

  // Pages
  import PageList from '$lib/features/pages/components/PageList.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';
  import PageSidePanels from '$lib/features/pages/components/PageSidePanels.svelte';

  // Ideas
  import IdeaList from '$lib/features/ideas/components/IdeaList.svelte';
  import { ideaStore } from '$lib/features/ideas/stores/idea.svelte';
  import IdeaSidePanels from '$lib/features/ideas/components/IdeaSidePanels.svelte';

  // Books
  import { bookStore } from '$lib/features/books/stores/book.svelte';
  import BookPanel from '$lib/features/books/components/BookPanel.svelte';

  // Media
  import { mediaStore } from '$lib/features/media/stores/media.svelte';
  import MediaPanel from '$lib/features/media/components/MediaPanel.svelte';

  // Audio
  import { audioStore } from '$lib/features/audio/stores/audio.svelte';
  import AudioPanel from '$lib/features/audio/components/AudioPanel.svelte';

  // Documents
  import { documentStore } from '$lib/features/documents/stores/document.svelte';
  import DocumentPanel from '$lib/features/documents/components/DocumentPanel.svelte';

  // Images
  import { imageStore } from '$lib/features/images/stores/image.svelte';
  import ImagePanel from '$lib/features/images/components/ImagePanel.svelte';

  // Custom
  import { customStore } from '$lib/features/custom/stores/custom.svelte';
  import CustomItemPanel from '$lib/features/custom/components/CustomItemPanel.svelte';

  // Stores
  import { THEMES, themeStore } from '$lib/shared/stores/theme.svelte';
  import { viewStore } from '$lib/shared/stores/view.svelte';
  import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';
  import { categoryStore } from '$lib/features/categories/stores/category.svelte';
  import type { CategoryType } from '$lib/features/categories/types/category';

  // Prompt input ref (local UI concern for keyboard shortcut integration)
  let promptInput = $state<HTMLInputElement | null>(null);

  // Edit bookmark dialog state
  let editDialogOpen = $state(false);
  let editBookmarkId = $state<string | null>(null);

  // Derived counts
  const favoriteCount = $derived(bookmarkStore.activeItems.filter((b) => b.isFavorite).length);
  const trashCount = $derived(bookmarkStore.trashedItems.length);

  // Active category type — drives center panel rendering
  const activeCategoryType = $derived<CategoryType | null>(
    categoryStore.active?.type ?? null,
  );

  // ── Bookmark handlers ──────────────────────────────────────────────────────

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

  async function handleCreateContent() {
    if (viewStore.specialView || activeCategoryType === 'links') {
      promptInput?.focus();
    } else if (activeCategoryType === 'pages') {
      await pageStore.create();
    } else if (activeCategoryType === 'ideas' && viewStore.activeCategoryId) {
      const textarea = document.getElementById('quick-capture-idea-input') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
      }
    } else if (activeCategoryType) {
      promptInput?.focus();
    }
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

    await bookmarkStore.update(id, {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
    });

    const oldTags = bookmark.tags || [];
    const newTags = data.tags;
    for (const tag of oldTags) {
      if (!newTags.includes(tag)) await bookmarkStore.removeTag(id, tag);
    }
    for (const tag of newTags) {
      if (!oldTags.includes(tag)) await bookmarkStore.addTag(id, tag);
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  $effect(() => {
    untrack(() => {
      themeStore.load();
      workspaceStore.load();
    });
    return setupKeyboardShortcuts(() => promptInput, handleCreateContent);
  });

  // Close active page when navigating categories/views or switching workspaces
  $effect(() => {
    viewStore.onNavigate = () => {
      pageStore.closePage();
    };
    return () => {
      viewStore.onNavigate = undefined;
    };
  });

  $effect(() => {
    if (workspaceStore.activeId) {
      untrack(() => {
        pageStore.closePage();
      });
    }
  });

  // Reload bookmarks, pages, ideas, and items whenever the active workspace changes.
  $effect(() => {
    if (workspaceStore.activeId) {
      bookmarkStore.load();
      pageStore.load();
      ideaStore.load();
      bookStore.load();
      mediaStore.load();
      audioStore.load();
      documentStore.load();
      imageStore.load();
      customStore.load();
    }
  });

  // Select the first category (Links) by default once categories are loaded.
  $effect(() => {
    if (categoryStore.items.length > 0 && !viewStore.activeCategoryId && !viewStore.specialView) {
      viewStore.selectCategory(categoryStore.items[0].id);
    }
  });

  // Load settings stats when settings view is active.
  $effect(() => {
    if (viewStore.specialView === 'settings') {
      workspaceStore.loadStats();
    }
  });
</script>

<div
  class="flex h-full flex-col lg:overflow-hidden bg-background text-foreground font-mono p-2.5 gap-4 overflow-y-auto lg:overflow-y-hidden"
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
          viewStore.selectCategory(categoryStore.items[0]?.id ?? '');
        }}
        onCreateWorkspace={(name) => workspaceStore.create(name)}
        onDeleteWorkspace={(id) => workspaceStore.delete(id)}
        categories={categoryStore.items}
        activeCategoryId={viewStore.activeCategoryId}
        specialView={viewStore.specialView}
        onSelectCategory={(id) => viewStore.selectCategory(id)}
        onSelectSpecialView={(view) => viewStore.selectSpecialView(view)}
        onCreateCategory={(name, type) => {
          if (!workspaceStore.activeId) return Promise.resolve();
          return categoryStore.create({ workspaceId: workspaceStore.activeId, name, type });
        }}
        onDeleteCategory={(id) => categoryStore.delete(id)}
        {favoriteCount}
        {trashCount}
        currentTheme={themeStore.current}
        themes={THEMES}
        changeTheme={(t) => themeStore.change(t as (typeof THEMES)[number])}
        onAddContentClick={handleCreateContent}
      />
    </div>

    <!-- Center Column: Main Content (routes by category type or special view) -->
    <div class="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col pt-2">
      <div class="flex-1 flex flex-col overflow-hidden border border-border bg-box-bg relative">
        {#if viewStore.specialView === 'settings'}
          <!-- Settings — delegate to BookmarkPanel which has SettingsView embedded -->
          <BookmarkPanel
            bookmarks={filteredBookmarksStore.items}
            category="settings"
            mode={viewStore.mode}
            searchActive={viewStore.searchActive}
            bind:searchQuery={viewStore.searchQuery}
            selectedTag={viewStore.selectedTag}
            bind:promptInput
            onModeChange={(m) => viewStore.setMode(m)}
            onSearchToggle={(active) => viewStore.setSearchActive(active)}
            onSearchChange={(q) => { viewStore.searchQuery = q; }}
            onClearTag={() => viewStore.clearTag()}
            onEdit={handleEdit}
            onDelete={(id) => bookmarkStore.softDelete(id)}
            onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
            onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
            onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
            onAddLink={handleAddLink}
            stats={workspaceStore.stats}
            onCloseSettings={() => viewStore.selectCategory(categoryStore.items[0]?.id ?? '')}
          />
        {:else if viewStore.specialView === 'favorites' || viewStore.specialView === 'trash'}
          <!-- Special views: Favorites / Trash — show bookmarks panel -->
          <BookmarkPanel
            bookmarks={filteredBookmarksStore.items}
            category={viewStore.specialView}
            mode={viewStore.mode}
            searchActive={viewStore.searchActive}
            bind:searchQuery={viewStore.searchQuery}
            selectedTag={viewStore.selectedTag}
            bind:promptInput
            onModeChange={(m) => viewStore.setMode(m)}
            onSearchToggle={(active) => viewStore.setSearchActive(active)}
            onSearchChange={(q) => { viewStore.searchQuery = q; }}
            onClearTag={() => viewStore.clearTag()}
            onEdit={handleEdit}
            onDelete={(id) =>
              viewStore.specialView === 'trash'
                ? bookmarkStore.deletePermanently(id)
                : bookmarkStore.softDelete(id)}
            onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
            onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
            onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
            onAddLink={handleAddLink}
            stats={workspaceStore.stats}
            onCloseSettings={() => viewStore.selectCategory(categoryStore.items[0]?.id ?? '')}
          />
        {:else if activeCategoryType === 'links'}
          <!-- Links — existing bookmark panel -->
          <BookmarkPanel
            bookmarks={filteredBookmarksStore.items}
            category="inbox"
            mode={viewStore.mode}
            searchActive={viewStore.searchActive}
            bind:searchQuery={viewStore.searchQuery}
            selectedTag={viewStore.selectedTag}
            bind:promptInput
            onModeChange={(m) => viewStore.setMode(m)}
            onSearchToggle={(active) => viewStore.setSearchActive(active)}
            onSearchChange={(q) => { viewStore.searchQuery = q; }}
            onClearTag={() => viewStore.clearTag()}
            onEdit={handleEdit}
            onDelete={(id) => bookmarkStore.softDelete(id)}
            onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
            onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
            onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
            onAddLink={handleAddLink}
            stats={workspaceStore.stats}
            onCloseSettings={() => viewStore.selectSpecialView('settings')}
          />
        {:else if activeCategoryType === 'pages' && viewStore.activeCategoryId && workspaceStore.activeId}
          <!-- Pages — CodeMirror editor -->
          <PageList />
        {:else if activeCategoryType === 'ideas'}
          <!-- Ideas — quick capture -->
          <IdeaList />
        {:else if activeCategoryType === 'books'}
          <BookPanel bind:promptInput />
        {:else if activeCategoryType === 'media'}
          <MediaPanel bind:promptInput />
        {:else if activeCategoryType === 'audio'}
          <AudioPanel bind:promptInput />
        {:else if activeCategoryType === 'documents'}
          <DocumentPanel bind:promptInput />
        {:else if activeCategoryType === 'images'}
          <ImagePanel bind:promptInput />
        {:else if activeCategoryType === 'custom'}
          <CustomItemPanel bind:promptInput />
        {:else}
          <div class="flex-1"></div>
        {/if}
      </div>
    </div>

    <!-- Right Column: Stats + Tags + Logo -->
    <IdeaSidePanels
      ideas={ideaStore.items}
      bind:selectedTag={viewStore.selectedTag}
      onRenameTag={(oldTag, newTag) => ideaStore.renameTagGlobally(oldTag, newTag)}
      onDeleteTag={(tag) => ideaStore.deleteTagGlobally(tag)}
      class={activeCategoryType !== 'ideas' ? 'hidden' : ''}
    />
    <PageSidePanels
      pages={pageStore.items}
      bind:selectedTag={viewStore.selectedTag}
      onRenameTag={(oldTag, newTag) => pageStore.renameTagGlobally(oldTag, newTag)}
      onDeleteTag={(tag) => pageStore.deleteTagGlobally(tag)}
      class={activeCategoryType !== 'pages' ? 'hidden' : ''}
    />
    <BookmarkSidePanels
      bookmarks={bookmarkStore.items}
      bind:selectedTag={viewStore.selectedTag}
      onRenameTag={(oldTag, newTag) => bookmarkStore.renameTagGlobally(oldTag, newTag)}
      onDeleteTag={(tag) => bookmarkStore.deleteTagGlobally(tag)}
      class={activeCategoryType === 'ideas' || activeCategoryType === 'pages' ? 'hidden' : ''}
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
