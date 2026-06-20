<script lang="ts">
  import { toggleMode } from 'mode-watcher';
  import { Button } from '$lib/shared/components/ui/button';
  import * as Dialog from '$lib/shared/components/ui/dialog';
  import { Input } from '$lib/shared/components/ui/input';
  import type { Workspace } from '$lib/features/workspaces/types/workspace';
  import type { Category, CategoryType } from '$lib/features/categories/types/category';
  import { bookmarkStore } from '$lib/features/bookmarks/stores/bookmark.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';
  import { ideaStore } from '$lib/features/ideas/stores/idea.svelte';

  let {
    workspaces,
    activeWorkspaceId,
    onSelectWorkspace,
    onCreateWorkspace,
    onDeleteWorkspace,
    categories,
    activeCategoryId,
    specialView,
    onSelectCategory,
    onSelectSpecialView,
    onCreateCategory,
    onDeleteCategory,
    favoriteCount = 0,
    trashCount = 0,
    currentTheme,
    themes = [],
    changeTheme,
    onAddContentClick,
  }: {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    onSelectWorkspace: (id: string) => void;
    onCreateWorkspace: (name: string) => Promise<void>;
    onDeleteWorkspace: (id: string) => void;
    categories: Category[];
    activeCategoryId: string | null;
    specialView: 'favorites' | 'trash' | 'settings' | null;
    onSelectCategory: (id: string) => void;
    onSelectSpecialView: (view: 'favorites' | 'trash' | 'settings') => void;
    onCreateCategory: (name: string, type: CategoryType) => Promise<void>;
    onDeleteCategory: (id: string) => void;
    favoriteCount: number;
    trashCount: number;
    currentTheme: string;
    themes: readonly string[];
    changeTheme: (theme: string) => void;
    onAddContentClick: () => void;
  } = $props();

  // ── Create workspace dialog ──────────────────────────────────────────────────
  let createWsDialogOpen = $state(false);
  let newWorkspaceName = $state('');
  let createWsError = $state('');
  let isCreatingWs = $state(false);

  // ── Delete workspace dialog ──────────────────────────────────────────────────
  let deleteWsDialogOpen = $state(false);
  let workspaceToDelete = $state<Workspace | null>(null);

  // ── Create category dialog ───────────────────────────────────────────────────
  let createCatDialogOpen = $state(false);
  let newCatName = $state('');
  let newCatType = $state<CategoryType>('custom');
  let createCatError = $state('');
  let isCreatingCat = $state(false);

  // ── Delete category dialog ───────────────────────────────────────────────────
  let deleteCatDialogOpen = $state(false);
  let categoryToDelete = $state<Category | null>(null);

  const activeCategory = $derived(
    categories.find((c) => c.id === activeCategoryId)
  );
  const activeCategoryType = $derived(
    specialView ? null : activeCategory?.type ?? null
  );

  const actionButtonLabel = $derived(
    specialView
      ? '[a] Add Link'
      : activeCategoryType === 'links'
        ? '[a] Add Link'
        : activeCategoryType === 'pages'
          ? '[a] Add Page'
          : activeCategoryType === 'ideas'
            ? '[a] Add Idea'
            : activeCategoryType === 'books'
              ? '[a] Add Book'
              : activeCategoryType === 'media'
                ? '[a] Add Media'
                : activeCategoryType === 'audio'
                  ? '[a] Add Audio'
                  : activeCategoryType === 'documents'
                    ? '[a] Add Document'
                    : activeCategoryType === 'images'
                      ? '[a] Add Image'
                      : activeCategoryType === 'custom'
                        ? '[a] Add Item'
                        : '[a] Add Link'
  );

  // ── Category count helper ────────────────────────────────────────────────────
  function getCategoryCount(cat: Category): number {
    if (cat.type === 'links') {
      return bookmarkStore.activeItems.filter((b) => b.categoryId === cat.id).length;
    }
    if (cat.type === 'pages') {
      return pageStore.activeItems.filter((p) => p.categoryId === cat.id).length;
    }
    if (cat.type === 'ideas') {
      return ideaStore.activeItems.filter((i) => i.categoryId === cat.id).length;
    }
    return 0;
  }

  const CATEGORY_TYPES: CategoryType[] = [
    'links', 'pages', 'ideas', 'books', 'media', 'audio', 'documents', 'images', 'custom',
  ];

  // ── Workspace handlers ───────────────────────────────────────────────────────
  async function handleCreateWorkspace() {
    if (!newWorkspaceName.trim()) {
      createWsError = 'Name cannot be empty.';
      return;
    }
    isCreatingWs = true;
    createWsError = '';
    try {
      await onCreateWorkspace(newWorkspaceName.trim());
      createWsDialogOpen = false;
      newWorkspaceName = '';
    } catch (e) {
      createWsError = e instanceof Error ? e.message : 'Failed to create workspace.';
    } finally {
      isCreatingWs = false;
    }
  }

  function handleCreateWsKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleCreateWorkspace(); }
  }

  function openDeleteWsDialog(workspace: Workspace) {
    workspaceToDelete = workspace;
    deleteWsDialogOpen = true;
  }

  function confirmDeleteWorkspace() {
    if (workspaceToDelete) {
      onDeleteWorkspace(workspaceToDelete.id);
      deleteWsDialogOpen = false;
      workspaceToDelete = null;
    }
  }

  // ── Category handlers ────────────────────────────────────────────────────────
  async function handleCreateCategory() {
    if (!newCatName.trim()) {
      createCatError = 'Name cannot be empty.';
      return;
    }
    isCreatingCat = true;
    createCatError = '';
    try {
      await onCreateCategory(newCatName.trim(), newCatType);
      createCatDialogOpen = false;
      newCatName = '';
      newCatType = 'custom';
    } catch (e) {
      createCatError = e instanceof Error ? e.message : 'Failed to create category.';
    } finally {
      isCreatingCat = false;
    }
  }

  function handleCreateCatKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); }
  }

  function openDeleteCatDialog(cat: Category) {
    categoryToDelete = cat;
    deleteCatDialogOpen = true;
  }

  function confirmDeleteCategory() {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      deleteCatDialogOpen = false;
      categoryToDelete = null;
    }
  }
</script>

<aside class="flex w-full h-full flex-col gap-4 select-none shrink-0">
  <!-- WORKSPACES Box -->
  <div class="relative p-4 flex flex-col bg-box-bg border border-border">
    <span
      class="absolute px-1.5 text-tui-xs font-bold uppercase tracking-tui-wide -top-1.75 left-2.5 bg-background text-primary"
      >Workspaces</span
    >
    <div class="space-y-1 text-xs">
      {#each workspaces as workspace (workspace.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {workspace.id ===
          activeWorkspaceId
            ? 'text-primary font-bold'
            : 'text-foreground hover:text-primary'}"
          onclick={() => onSelectWorkspace(workspace.id)}
        >
          <span
            >{workspace.id === activeWorkspaceId ? '* ' : '  '}
            {workspace.name}</span
          >
          <div class="flex items-center gap-1">
            <span class="text-tui-xs text-muted-foreground">@{workspace.slug}</span>
            {#if workspaces.length > 1}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span
                class="text-tui-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer ml-1"
                onclick={(e) => {
                  e.stopPropagation();
                  openDeleteWsDialog(workspace);
                }}
                title="Delete workspace">[x]</span
              >
            {/if}
          </div>
        </div>
      {/each}

      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="text-dim-foreground hover:text-foreground cursor-pointer py-0.5 px-1.5"
        onclick={() => {
          newWorkspaceName = '';
          createWsError = '';
          createWsDialogOpen = true;
        }}
      >
        + New workspace...
      </div>
    </div>
  </div>

  <!-- CATEGORIES Box -->
  <div class="relative flex flex-col bg-box-bg border border-border flex-1 min-h-0">
    <span
      class="absolute px-1.5 text-tui-xs font-bold uppercase tracking-tui-wide -top-1.75 left-2.5 bg-background text-primary z-10"
      >Categories</span
    >
    <div
      class="flex-1 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary"
    >
      <div class="space-y-1 text-xs">
        {#each categories as cat (cat.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {activeCategoryId ===
              cat.id && specialView === null
              ? 'bg-primary text-background font-bold'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground'}"
            onclick={() => onSelectCategory(cat.id)}
          >
            <span class="flex items-center gap-1.5">
              <span
                class="text-tui-xs font-bold {activeCategoryId === cat.id && specialView === null
                  ? 'text-background'
                  : 'text-muted-foreground group-hover:text-accent-foreground'}"
                >[{cat.icon ?? '?'}]</span
              >
              {cat.name}
            </span>
            <span
              class="flex items-center gap-1 {activeCategoryId === cat.id && specialView === null
                ? 'text-background'
                : 'text-muted-foreground group-hover:text-accent-foreground'}"
            >
              <span>[{getCategoryCount(cat)}]</span>
              {#if !cat.isDefault}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                  class="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer ml-0.5"
                  onclick={(e) => {
                    e.stopPropagation();
                    openDeleteCatDialog(cat);
                  }}
                  title="Delete category">[x]</span
                >
              {/if}
            </span>
          </div>
        {/each}

        <!-- Create new category -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="text-dim-foreground hover:text-foreground cursor-pointer py-0.5 px-1.5 mt-1"
          onclick={() => {
            newCatName = '';
            newCatType = 'custom';
            createCatError = '';
            createCatDialogOpen = true;
          }}
        >
          + New category...
        </div>

        <!-- Separator -->
        <div class="border-t border-border my-1.5"></div>

        <!-- Special views -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => onSelectSpecialView('favorites')}
          class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {specialView ===
          'favorites'
            ? 'bg-primary text-background font-bold'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'}"
        >
          <span class="flex items-center gap-1.5">
            <span
              class="text-tui-xs font-bold {specialView === 'favorites'
                ? 'text-background'
                : 'text-muted-foreground group-hover:text-accent-foreground'}">[★]</span
            >
            Favorites
          </span>
          <span
            class={specialView === 'favorites'
              ? 'text-background'
              : 'text-muted-foreground group-hover:text-accent-foreground'}>[{favoriteCount}]</span
          >
        </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => onSelectSpecialView('trash')}
          class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {specialView ===
          'trash'
            ? 'bg-primary text-background font-bold'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'}"
        >
          <span class="flex items-center gap-1.5">
            <span
              class="text-tui-xs font-bold {specialView === 'trash'
                ? 'text-background'
                : 'text-muted-foreground group-hover:text-accent-foreground'}">[⊠]</span
            >
            Trash
          </span>
          <span
            class={specialView === 'trash'
              ? 'text-background'
              : 'text-muted-foreground group-hover:text-accent-foreground'}>[{trashCount}]</span
          >
        </div>
      </div>
    </div>
  </div>

  <!-- ACTIONS Box -->
  <div class="relative p-4 flex flex-col bg-box-bg border border-border gap-2 shrink-0">
    <span
      class="absolute px-1.5 text-tui-xs font-bold uppercase tracking-tui-wide -top-1.75 left-2.5 bg-background text-primary"
      >Actions</span
    >
    <Button
      onclick={onAddContentClick}
      size="sm"
      class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-primary bg-primary text-background font-bold transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:bg-foreground hover:border-foreground hover:text-background w-full"
    >
      {actionButtonLabel}
    </Button>
    <Button
      onclick={() => {
        const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
        changeTheme(themes[nextIdx]);
      }}
      size="sm"
      class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-accent-foreground w-full"
    >
      [t] Toggle Theme: {currentTheme}
    </Button>
    <Button
      onclick={toggleMode}
      size="sm"
      class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-accent-foreground w-full"
    >
      [m] Toggle Mode
    </Button>

    <div class="space-y-0.5 text-tui-xs text-muted-foreground mt-1 select-none">
      <div>e Export Links</div>
      <div>i Import Links</div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        onclick={() => onSelectSpecialView('settings')}
        class="cursor-pointer transition-colors hover:text-primary {specialView === 'settings'
          ? 'text-primary font-bold'
          : ''}"
      >
        , Settings
      </div>
    </div>
  </div>
</aside>

<!-- ── Create Workspace Dialog ──────────────────────────────────────────────── -->
<Dialog.Root bind:open={createWsDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary">
        // New Workspace
      </Dialog.Title>
      <Dialog.Description class="text-tui-xs text-muted-foreground mt-1">
        Categories and content are isolated per workspace.
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-4 py-3">
      <div class="flex items-center gap-1.5 px-2 py-1.5 border border-border bg-transparent">
        <span class="text-primary font-bold text-tui-xs select-none">$</span>
        <Input
          bind:value={newWorkspaceName}
          onkeydown={handleCreateWsKeydown}
          placeholder="Workspace name..."
          autofocus
          class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {#if createWsError}
        <p class="text-tui-xs text-destructive mt-1.5 px-1">{createWsError}</p>
      {/if}
    </div>
    <Dialog.Footer class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3">
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="font-mono text-tui-xs rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
          >
            [cancel]
          </Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={handleCreateWorkspace}
        disabled={isCreatingWs}
        class="font-mono text-tui-xs rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer disabled:opacity-50"
      >
        {isCreatingWs ? '[...]' : '[create]'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- ── Delete Workspace Dialog ───────────────────────────────────────────────── -->
<Dialog.Root bind:open={deleteWsDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-destructive bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-destructive">
        // Delete Workspace
      </Dialog.Title>
      <Dialog.Description class="text-tui-xs text-muted-foreground mt-1">
        This will permanently delete
        <span class="text-foreground font-bold">{workspaceToDelete?.name}</span>
        and all its content. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="px-4 py-4 flex gap-2 justify-end">
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="font-mono text-tui-xs rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
          >
            [cancel]
          </Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={confirmDeleteWorkspace}
        class="font-mono text-tui-xs rounded-none border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:text-destructive-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
      >
        [delete]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- ── Create Category Dialog ────────────────────────────────────────────────── -->
<Dialog.Root bind:open={createCatDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary">
        // New Category
      </Dialog.Title>
      <Dialog.Description class="text-tui-xs text-muted-foreground mt-1">
        Create a custom category for this workspace.
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-4 py-3 space-y-3">
      <div class="flex items-center gap-1.5 px-2 py-1.5 border border-border bg-transparent">
        <span class="text-primary font-bold text-tui-xs select-none">$</span>
        <Input
          bind:value={newCatName}
          onkeydown={handleCreateCatKeydown}
          placeholder="Category name..."
          autofocus
          class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <div class="space-y-1">
        <span class="text-tui-xs text-muted-foreground uppercase tracking-tui-wide">Type</span>
        <div class="grid grid-cols-3 gap-1">
          {#each CATEGORY_TYPES as type (type)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="text-tui-xs px-2 py-1 border cursor-pointer transition-colors text-center {newCatType ===
              type
                ? 'border-primary text-primary font-bold'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'}"
              onclick={() => (newCatType = type)}
            >
              {type}
            </div>
          {/each}
        </div>
      </div>
      {#if createCatError}
        <p class="text-tui-xs text-destructive px-1">{createCatError}</p>
      {/if}
    </div>
    <Dialog.Footer class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3">
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="font-mono text-tui-xs rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
          >
            [cancel]
          </Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={handleCreateCategory}
        disabled={isCreatingCat}
        class="font-mono text-tui-xs rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer disabled:opacity-50"
      >
        {isCreatingCat ? '[...]' : '[create]'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- ── Delete Category Dialog ────────────────────────────────────────────────── -->
<Dialog.Root bind:open={deleteCatDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-destructive bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-destructive">
        // Delete Category
      </Dialog.Title>
      <Dialog.Description class="text-tui-xs text-muted-foreground mt-1">
        This will permanently delete
        <span class="text-foreground font-bold">{categoryToDelete?.name}</span>
        and all its content. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="px-4 py-4 flex gap-2 justify-end">
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="font-mono text-tui-xs rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
          >
            [cancel]
          </Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={confirmDeleteCategory}
        class="font-mono text-tui-xs rounded-none border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:text-destructive-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
      >
        [delete]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
