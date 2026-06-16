<script lang="ts">
  import { untrack } from 'svelte';
  import { setupKeyboardShortcuts } from '$lib/actions/keyboardShortcuts';
  import BookmarkGrid from '$lib/components/BookmarkGrid.svelte';
  import BookmarkList from '$lib/components/BookmarkList.svelte';
  import FooterBar from '$lib/components/FooterBar.svelte';
  import LogoPanel from '$lib/components/LogoPanel.svelte';
  import PromptInput from '$lib/components/PromptInput.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import StatsPanel from '$lib/components/StatsPanel.svelte';
  import TagsPanel from '$lib/components/TagsPanel.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import * as Popover from '$lib/components/ui/popover';
  import { filteredBookmarksStore } from '$lib/derived/filteredBookmarks.svelte';
  import { bookmarkStore } from '$lib/stores/bookmark.svelte';
  import { THEMES, themeStore } from '$lib/stores/theme.svelte';
  import { viewStore } from '$lib/stores/view.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '$lib/tag-popover-utils';

  // Prompt input ref (local UI concern)
  let promptValue = $state('');
  let promptInput = $state<HTMLInputElement | null>(null);

  // Edit bookmark dialog state
  let editDialogOpen = $state(false);
  let editBookmarkId = $state<string | null>(null);
  let editTitleValue = $state('');
  let editDescriptionValue = $state('');
  let editImageSourceMode = $state<'url' | 'upload'>('url');
  let editImageUrlInput = $state('');
  let editImageFileBase64 = $state('');
  const editImageUrlValue = $derived(
    editImageSourceMode === 'url' ? editImageUrlInput : editImageFileBase64,
  );
  let editTagsList = $state<string[]>([]);
  let addTagOpen = $state(false);
  let newTagValue = $state('');

  const totalItems = $derived(bookmarkStore.activeItems.length);
  const favoriteCount = $derived(bookmarkStore.activeItems.filter((b) => b.isFavorite).length);
  const trashCount = $derived(bookmarkStore.trashedItems.length);

  // All unique tags across all bookmarks for autocomplete
  const allTags = $derived(() => getAllUniqueTags(bookmarkStore.items));

  // Filter suggestions based on current input (excludes tags already in our local edit list)
  const tagSuggestions = $derived(() => getTagSuggestions(allTags(), editTagsList, newTagValue));

  // Whether the typed value is a brand-new tag not in the global list
  const isNewTag = $derived(() => isNewTagValue(allTags(), newTagValue));

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
    const bookmark = bookmarkStore.items.find((b) => b.id === id);
    if (!bookmark) {
      return;
    }
    editBookmarkId = id;
    editTitleValue = bookmark.title;
    editDescriptionValue = bookmark.description || '';

    // Check if image is base64 or normal URL
    if (bookmark.imageUrl?.startsWith('data:image/')) {
      editImageSourceMode = 'upload';
      editImageFileBase64 = bookmark.imageUrl;
      editImageUrlInput = '';
    } else {
      editImageSourceMode = 'url';
      editImageUrlInput = bookmark.imageUrl || '';
      editImageFileBase64 = '';
    }

    editTagsList = bookmark.tags ? [...bookmark.tags] : [];
    editDialogOpen = true;
  }

  async function confirmEdit() {
    if (!editBookmarkId) return;
    const bookmark = bookmarkStore.items.find((b) => b.id === editBookmarkId);
    if (!bookmark) return;

    // 1. Update bookmark title, description, imageUrl (using the derived value)
    await bookmarkStore.update(editBookmarkId, {
      title: editTitleValue.trim(),
      description: editDescriptionValue.trim(),
      imageUrl: editImageUrlValue,
    });

    // 2. Reconcile tags
    const oldTags = bookmark.tags || [];
    const newTags = editTagsList;

    // Tags to remove
    for (const tag of oldTags) {
      if (!newTags.includes(tag)) {
        await bookmarkStore.removeTag(editBookmarkId, tag);
      }
    }

    // Tags to add
    for (const tag of newTags) {
      if (!oldTags.includes(tag)) {
        await bookmarkStore.addTag(editBookmarkId, tag);
      }
    }

    // 3. Reset state & close dialog
    editDialogOpen = false;
    editBookmarkId = null;
    editTitleValue = '';
    editDescriptionValue = '';
    editImageUrlInput = '';
    editImageFileBase64 = '';
    editTagsList = [];
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmEdit();
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          editImageFileBase64 = ev.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function submitEditTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !editTagsList.includes(clean)) {
      editTagsList = [...editTagsList, clean];
    }
    newTagValue = '';
    addTagOpen = false;
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = newTagValue.trim().toLowerCase();
      if (q) {
        submitEditTag(q);
      }
    } else if (e.key === 'Escape') {
      newTagValue = '';
      addTagOpen = false;
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

    <!-- Center Column: Main Content (Bordered card wrapper) -->
    <div class="flex-1 flex flex-col min-h-100 lg:min-h-0 pt-2 min-w-0">
      <div class="flex-1 flex flex-col overflow-hidden border border-border bg-box-bg relative">
        <!-- Center Box: LINKS header with view mode tabs -->
        <div
          class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
        >
          <span class="font-bold uppercase tracking-widest text-foreground">Links</span>
          <div class="flex items-center gap-1.5">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => viewStore.setMode('list')}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.mode ===
              'list'
                ? 'bg-primary text-background font-bold'
                : 'hover:text-foreground'}">[l]ist</span
            >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => viewStore.setMode('grid')}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.mode ===
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
                if (nextActive) {
                  setTimeout(() => promptInput?.focus(), 50);
                }
              }}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[10px] {viewStore.searchActive
                ? 'bg-primary text-background font-bold'
                : 'hover:text-foreground'}">[s]earch</span
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
            {#if viewStore.mode === 'list'}
              <BookmarkList
                bookmarks={filteredBookmarksStore.items}
                onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
                onDelete={(id) =>
                  viewStore.category === 'trash'
                    ? bookmarkStore.deletePermanently(id)
                    : bookmarkStore.softDelete(id)}
                onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
                onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
                onEdit={handleEdit}
              />
            {:else}
              <BookmarkGrid
                bookmarks={filteredBookmarksStore.items}
                onToggleFavorite={(id) => bookmarkStore.toggleFavorite(id)}
                onDelete={(id) =>
                  viewStore.category === 'trash'
                    ? bookmarkStore.deletePermanently(id)
                    : bookmarkStore.softDelete(id)}
                onAddTag={(id, tag) => bookmarkStore.addTag(id, tag)}
                onRemoveTag={(id, tag) => bookmarkStore.removeTag(id, tag)}
                onEdit={handleEdit}
              />
            {/if}
          {:else}
            <div
              class="flex flex-col items-center justify-center h-full text-center select-none gap-2 py-8"
            >
              <p class="text-xs uppercase tracking-wider text-destructive">✗ No records found</p>
              <p class="text-[10px] text-dim-foreground">
                {viewStore.searchActive
                  ? '> Refine your search query'
                  : '> Press [a] or click $ to add a link'}
              </p>
            </div>
          {/if}
        </div>

        <!-- Bottom count indicator -->
        <div
          class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-[10px] text-muted-foreground select-none shrink-0 font-bold"
        >
          {filteredBookmarksStore.items.length}
          item{filteredBookmarksStore.items.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>

    <!-- Right Column: Stats + Tags + Logo stacked -->
    <div class="w-full lg:w-80 flex flex-col gap-4 overflow-visible shrink-0 h-full min-h-0 pt-2">
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

<!-- Edit Bookmark Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 w-full max-w-[95vw] md:max-w-3xl shadow-xl animate-in fade-in zoom-in-95 duration-150"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary">
        // Edit Bookmark
      </Dialog.Title>
      <Dialog.Description class="text-[10px] text-muted-foreground mt-1">
        Update details for this bookmark.
      </Dialog.Description>
    </Dialog.Header>

    <div class="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[85vh]">
      <!-- Left Column: Image Preview & Source -->
      <div class="flex flex-col gap-3">
        <!-- Image Preview -->
        {#if editImageUrlValue.trim()}
          <div
            class="aspect-video w-full overflow-hidden border border-border bg-background flex items-center justify-center shrink-0"
          >
            <img
              src={editImageUrlValue}
              alt="Preview"
              class="w-full h-full object-cover"
              onerror={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        {:else}
          <div
            class="aspect-video w-full border border-border border-dashed bg-background flex flex-col items-center justify-center text-[10px] text-dim-foreground font-mono select-none shrink-0 p-4 text-center"
          >
            <span>[ NO IMAGE PREVIEW ]</span>
          </div>
        {/if}

        <!-- Image URL / File Upload Switch and Inputs -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 mb-1 select-none border-b border-border-dim pb-1">
            <span class="text-[9px] uppercase font-bold text-muted-foreground tracking-wider"
              >// Image Source:</span
            >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => (editImageSourceMode = 'url')}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[9px] {editImageSourceMode ===
              'url'
                ? 'bg-primary text-background font-bold'
                : 'text-muted-foreground hover:text-foreground'}"
            >
              [URL]
            </span>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => (editImageSourceMode = 'upload')}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-wider text-[9px] {editImageSourceMode ===
              'upload'
                ? 'bg-primary text-background font-bold'
                : 'text-muted-foreground hover:text-foreground'}"
            >
              [Upload]
            </span>
          </div>

          {#if editImageSourceMode === 'url'}
            <div
              class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent"
            >
              <span class="text-primary font-bold text-[10px] select-none">$</span>
              <Input
                id="edit-image-url-input"
                bind:value={editImageUrlInput}
                onkeydown={handleEditKeydown}
                placeholder="Image URL..."
                class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          {:else}
            <div class="flex flex-col gap-2">
              <Input
                id="edit-image-file-input"
                type="file"
                accept="image/*"
                onchange={handleFileChange}
                class="bg-transparent border border-border text-foreground placeholder:text-dim-foreground font-mono text-xs focus-visible:ring-0 focus-visible:ring-offset-0 file:text-foreground file:font-mono file:text-xs cursor-pointer file:cursor-pointer"
              />
              {#if editImageFileBase64}
                <div class="flex justify-end">
                  <Button
                    variant="outline"
                    size="xs"
                    onclick={() => {
                      editImageFileBase64 = '';
                    }}
                    class="font-mono text-[9px] text-destructive hover:bg-destructive/10 uppercase tracking-wider h-auto py-1 px-2 cursor-pointer border-destructive/30 hover:border-destructive"
                  >
                    [Clear uploaded image]
                  </Button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Right Column: Form Fields (Title, Description, Tags) -->
      <div class="flex flex-col gap-3 justify-between">
        <!-- Title Input -->
        <div class="flex flex-col gap-1">
          <label
            for="edit-title-input"
            class="text-[9px] uppercase font-bold text-muted-foreground tracking-wider"
            >// Title</label
          >
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
            <span class="text-primary font-bold text-[10px] select-none">$</span>
            <Input
              id="edit-title-input"
              bind:value={editTitleValue}
              onkeydown={handleEditKeydown}
              placeholder="Title..."
              autofocus
              class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <!-- Description Textarea -->
        <div class="flex flex-col gap-1 flex-1 min-h-35">
          <label
            for="edit-description-input"
            class="text-[9px] uppercase font-bold text-muted-foreground tracking-wider"
            >// Description</label
          >
          <textarea
            id="edit-description-input"
            bind:value={editDescriptionValue}
            rows="5"
            placeholder="Description..."
            class="w-full h-full bg-transparent border border-border outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs px-2.5 py-1.5 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 resize-none transition-colors"
          ></textarea>
        </div>

        <!-- Tags List with Popover -->
        <div class="flex flex-col gap-1">
          <span class="text-[9px] uppercase font-bold text-muted-foreground tracking-wider"
            >// Tags</span
          >
          <div
            class="flex flex-wrap gap-1.5 items-center p-2 border border-border min-h-9 bg-transparent"
          >
            {#each editTagsList as tag}
              <Badge
                variant="outline"
                class="text-[9px] px-1 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono"
              >
                *{tag}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                  onclick={() => (editTagsList = editTagsList.filter((t) => t !== tag))}
                  class="text-destructive hover:text-red-400 cursor-pointer font-bold text-[8px] ml-0.5"
                  title="Remove tag">x</span
                >
              </Badge>
            {/each}

            <!-- Tag Popover -->
            <Popover.Root bind:open={addTagOpen}>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="ghost"
                    size="xs"
                    class="text-[9px] text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
                  >
                    + add tag
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content
                class="w-52 p-0 rounded-none border border-border bg-box-bg font-mono shadow-lg"
                align="start"
                sideOffset={4}
              >
                <!-- Input -->
                <div class="flex items-center gap-1 px-2 py-1.5 border-b border-border">
                  <span class="text-primary font-bold text-[10px] select-none">#</span>
                  <Input
                    bind:value={newTagValue}
                    onkeydown={handleTagKeydown}
                    placeholder="tag name..."
                    autofocus
                    class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-[10px] h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <!-- Suggestions -->
                <div class="flex flex-col py-0.5 max-h-40 overflow-y-auto">
                  {#if isNewTag()}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      onclick={() => submitEditTag(newTagValue)}
                      class="px-2 py-1 text-[10px] text-primary cursor-pointer hover:bg-accent/30 select-none"
                    >
                      [Create: "{newTagValue.trim().toLowerCase()}"]
                    </div>
                  {/if}
                  {#each tagSuggestions() as suggestion}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      onclick={() => submitEditTag(suggestion)}
                      class="px-2 py-1 text-[10px] text-muted-foreground cursor-pointer hover:bg-accent/30 hover:text-foreground select-none"
                    >
                      * {suggestion}
                    </div>
                  {/each}
                  {#if tagSuggestions().length === 0 && !isNewTag()}
                    <div class="px-2 py-1 text-[10px] text-dim-foreground italic select-none">
                      No suggestions
                    </div>
                  {/if}
                </div>
              </Popover.Content>
            </Popover.Root>
          </div>
        </div>
      </div>
    </div>
    <Dialog.Footer class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3 shrink-0">
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
        onclick={confirmEdit}
        class="font-mono text-[10px] rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-wider h-auto py-1 px-3 cursor-pointer"
      >
        [save]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
