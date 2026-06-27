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
  import GenericSidePanels from '$lib/shared/components/GenericSidePanels.svelte';

  // Pages
  import PageList from '$lib/features/pages/components/PageList.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';

  // Ideas
  import IdeaList from '$lib/features/ideas/components/IdeaList.svelte';
  import { ideaStore } from '$lib/features/ideas/stores/idea.svelte';

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

  // ── Right panel: single reactive instance ──────────────────────────────────
  // Instead of conditionally mounting/unmounting GenericSidePanels per category
  // (which destroys/creates the heavy layerchart inside each time), we compute
  // the items and callbacks reactively and feed them to a single persistent instance.

  type TagRenamer = (old: string, next: string) => Promise<void>;
  type TagDeleter = (tag: string) => Promise<void>;

  const rightPanelVisible = $derived(
    activeCategoryType !== null ||
      viewStore.specialView === 'favorites' ||
      viewStore.specialView === 'trash' ||
      viewStore.specialView === 'settings',
  );

  const rightPanelItems = $derived.by(() => {
    const sv = viewStore.specialView;
    if (sv === 'favorites' || sv === 'trash' || sv === 'settings') return bookmarkStore.activeItems;
    if (activeCategoryType === 'links') return bookmarkStore.activeItems;
    if (activeCategoryType === 'ideas') return ideaStore.activeItems;
    if (activeCategoryType === 'pages') return pageStore.activeItems;
    if (activeCategoryType === 'books') return bookStore.activeItems;
    if (activeCategoryType === 'media') return mediaStore.activeItems;
    if (activeCategoryType === 'audio') return audioStore.activeItems;
    if (activeCategoryType === 'documents') return documentStore.activeItems;
    if (activeCategoryType === 'images') return imageStore.activeItems;
    if (activeCategoryType === 'custom') return customStore.activeItems;
    return [];
  });

  const rightPanelLabel = $derived.by(() => {
    const sv = viewStore.specialView;
    if (sv === 'favorites' || sv === 'trash' || sv === 'settings') return 'bookmarks';
    if (activeCategoryType === 'links') return 'bookmarks';
    if (activeCategoryType === 'ideas') return 'ideas';
    if (activeCategoryType === 'pages') return 'notes';
    if (activeCategoryType === 'books') return 'books';
    if (activeCategoryType === 'media') return 'media items';
    if (activeCategoryType === 'audio') return 'audio files';
    if (activeCategoryType === 'documents') return 'documents';
    if (activeCategoryType === 'images') return 'images';
    if (activeCategoryType === 'custom') return 'items';
    return 'items';
  });

  const rightPanelRenameTag = $derived.by((): TagRenamer => {
    const sv = viewStore.specialView;
    if (sv === 'favorites' || sv === 'trash' || sv === 'settings')
      return (o, n) => bookmarkStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'links') return (o, n) => bookmarkStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'ideas') return (o, n) => ideaStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'pages') return (o, n) => pageStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'books') return (o, n) => bookStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'media') return (o, n) => mediaStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'audio') return (o, n) => audioStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'documents') return (o, n) => documentStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'images') return (o, n) => imageStore.renameTagGlobally(o, n);
    if (activeCategoryType === 'custom') return (o, n) => customStore.renameTagGlobally(o, n);
    return async () => {};
  });

  const rightPanelDeleteTag = $derived.by((): TagDeleter => {
    const sv = viewStore.specialView;
    if (sv === 'favorites' || sv === 'trash' || sv === 'settings')
      return (t) => bookmarkStore.deleteTagGlobally(t);
    if (activeCategoryType === 'links') return (t) => bookmarkStore.deleteTagGlobally(t);
    if (activeCategoryType === 'ideas') return (t) => ideaStore.deleteTagGlobally(t);
    if (activeCategoryType === 'pages') return (t) => pageStore.deleteTagGlobally(t);
    if (activeCategoryType === 'books') return (t) => bookStore.deleteTagGlobally(t);
    if (activeCategoryType === 'media') return (t) => mediaStore.deleteTagGlobally(t);
    if (activeCategoryType === 'audio') return (t) => audioStore.deleteTagGlobally(t);
    if (activeCategoryType === 'documents') return (t) => documentStore.deleteTagGlobally(t);
    if (activeCategoryType === 'images') return (t) => imageStore.deleteTagGlobally(t);
    if (activeCategoryType === 'custom') return (t) => customStore.deleteTagGlobally(t);
    return async () => {};
  });

  // The center panel to show — computed eagerly so Svelte renders synchronously
  type CenterView =
    | 'settings'
    | 'favorites'
    | 'trash'
    | 'links'
    | 'pages'
    | 'ideas'
    | 'books'
    | 'media'
    | 'audio'
    | 'documents'
    | 'images'
    | 'custom'
    | 'empty';

  const centerView = $derived.by((): CenterView => {
    if (viewStore.specialView === 'settings') return 'settings';
    if (viewStore.specialView === 'favorites') return 'favorites';
    if (viewStore.specialView === 'trash') return 'trash';
    if (activeCategoryType === 'links') return 'links';
    if (
      activeCategoryType === 'pages' &&
      viewStore.activeCategoryId &&
      workspaceStore.activeId
    )
      return 'pages';
    if (activeCategoryType === 'ideas') return 'ideas';
    if (activeCategoryType === 'books') return 'books';
    if (activeCategoryType === 'media') return 'media';
    if (activeCategoryType === 'audio') return 'audio';
    if (activeCategoryType === 'documents') return 'documents';
    if (activeCategoryType === 'images') return 'images';
    if (activeCategoryType === 'custom') return 'custom';
    return 'empty';
  });

  // Bookmark panel category string (reused for settings/favorites/trash/links)
  const bookmarkCategory = $derived.by(() => {
    if (centerView === 'settings') return 'settings';
    if (centerView === 'favorites') return 'favorites';
    if (centerView === 'trash') return 'trash';
    return 'inbox';
  });

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
      bookStore.closeBook();
    };
    return () => {
      viewStore.onNavigate = undefined;
    };
  });

  // Open pending page when navigating to pages category
  $effect(() => {
    if (centerView === 'pages' && pageStore.pendingOpenPageId) {
      const pageId = pageStore.pendingOpenPageId;
      pageStore.pendingOpenPageId = null;
      pageStore.openPage(pageId);
    }
  });

  $effect(() => {
    if (workspaceStore.activeId) {
      untrack(() => {
        pageStore.closePage();
        bookStore.closeBook();
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

    <!-- Center Column: Main Content (persistent panels, shown/hidden via CSS) -->
    <div class="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col pt-2">
      <div class="flex-1 flex flex-col overflow-hidden border border-border bg-box-bg relative">
        <!-- Bookmark panel — covers settings / favorites / trash / links.
             Kept mounted and shown reactively to avoid remounting cost. -->
        <div
          class="contents"
          style:display={centerView === 'settings' || centerView === 'favorites' || centerView === 'trash' || centerView === 'links' ? 'contents' : 'none'}
        >
          <BookmarkPanel
            bookmarks={filteredBookmarksStore.items}
            category={bookmarkCategory}
            mode={viewStore.mode}
            searchActive={viewStore.searchActive}
            bind:searchQuery={viewStore.searchQuery}
            bind:promptInput
            onModeChange={(m) => viewStore.setMode(m)}
            onSearchToggle={(active) => viewStore.setSearchActive(active)}
            onSearchChange={(q) => { viewStore.searchQuery = q; }}
            onEdit={handleEdit}
            onDelete={(id) =>
              centerView === 'trash'
                ? bookmarkStore.deletePermanently(id)
                : bookmarkStore.softDelete(id)}
            onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
            onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
            onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
            onAddLink={handleAddLink}
            stats={workspaceStore.stats}
            onCloseSettings={() =>
              centerView === 'links'
                ? viewStore.selectSpecialView('settings')
                : viewStore.selectCategory(categoryStore.items[0]?.id ?? '')}
          />
        </div>

        <!-- Pages — CodeMirror editor -->
        <div
          class="contents"
          style:display={centerView === 'pages' ? 'contents' : 'none'}
        >
          {#if centerView === 'pages'}
            <PageList />
          {/if}
        </div>

        <!-- Ideas -->
        <div
          class="contents"
          style:display={centerView === 'ideas' ? 'contents' : 'none'}
        >
          {#if centerView === 'ideas'}
            <IdeaList />
          {/if}
        </div>

        <!-- Books -->
        <div
          class="contents"
          style:display={centerView === 'books' ? 'contents' : 'none'}
        >
          {#if centerView === 'books'}
            <BookPanel bind:promptInput />
          {/if}
        </div>

        <!-- Media -->
        <div
          class="contents"
          style:display={centerView === 'media' ? 'contents' : 'none'}
        >
          {#if centerView === 'media'}
            <MediaPanel bind:promptInput />
          {/if}
        </div>

        <!-- Audio -->
        <div
          class="contents"
          style:display={centerView === 'audio' ? 'contents' : 'none'}
        >
          {#if centerView === 'audio'}
            <AudioPanel bind:promptInput />
          {/if}
        </div>

        <!-- Documents -->
        <div
          class="contents"
          style:display={centerView === 'documents' ? 'contents' : 'none'}
        >
          {#if centerView === 'documents'}
            <DocumentPanel bind:promptInput />
          {/if}
        </div>

        <!-- Images -->
        <div
          class="contents"
          style:display={centerView === 'images' ? 'contents' : 'none'}
        >
          {#if centerView === 'images'}
            <ImagePanel bind:promptInput />
          {/if}
        </div>

        <!-- Custom -->
        <div
          class="contents"
          style:display={centerView === 'custom' ? 'contents' : 'none'}
        >
          {#if centerView === 'custom'}
            <CustomItemPanel bind:promptInput />
          {/if}
        </div>

        <!-- Empty fallback -->
        {#if centerView === 'empty'}
          <div class="flex-1"></div>
        {/if}
      </div>
    </div>

    <!-- Right Column: single persistent GenericSidePanels instance.
         Data is fed reactively via derived stores — no destroy/mount cycle on navigation. -->
    {#if rightPanelVisible}
      <GenericSidePanels
        items={rightPanelItems}
        bind:selectedTag={viewStore.selectedTag}
        onRenameTag={rightPanelRenameTag}
        onDeleteTag={rightPanelDeleteTag}
        entityPluralLabel={rightPanelLabel}
      />
    {/if}
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
