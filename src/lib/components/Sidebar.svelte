<script lang="ts">
  import { toggleMode } from 'mode-watcher';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import type { Workspace } from '$lib/types/workspace';

  let {
    workspaces,
    activeWorkspaceId,
    onSelectWorkspace,
    onCreateWorkspace,
    onDeleteWorkspace,
    selectedCategory,
    onSelectCategory,
    bookmarkCount = 0,
    favoriteCount = 0,
    trashCount = 0,
    currentTheme,
    themes = [],
    changeTheme,
    onAddLinkClick,
  }: {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    onSelectWorkspace: (id: string) => void;
    onCreateWorkspace: (name: string) => Promise<void>;
    onDeleteWorkspace: (id: string) => void;
    selectedCategory: 'inbox' | 'favorites' | 'trash' | 'settings';
    onSelectCategory: (cat: 'inbox' | 'favorites' | 'trash' | 'settings') => void;
    bookmarkCount: number;
    favoriteCount: number;
    trashCount: number;
    currentTheme: string;
    themes: readonly string[];
    changeTheme: (theme: string) => void;
    onAddLinkClick: () => void;
  } = $props();

  // --- Create workspace dialog state ---
  let createDialogOpen = $state(false);
  let newWorkspaceName = $state('');
  let createError = $state('');
  let isCreating = $state(false);

  // --- Delete workspace dialog state ---
  let deleteDialogOpen = $state(false);
  let workspaceToDelete = $state<Workspace | null>(null);

  async function handleCreate() {
    if (!newWorkspaceName.trim()) {
      createError = 'Name cannot be empty.';
      return;
    }
    isCreating = true;
    createError = '';
    try {
      await onCreateWorkspace(newWorkspaceName.trim());
      createDialogOpen = false;
      newWorkspaceName = '';
    } catch (e) {
      createError = e instanceof Error ? e.message : 'Failed to create workspace.';
    } finally {
      isCreating = false;
    }
  }

  function handleCreateKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  }

  function openDeleteDialog(workspace: Workspace) {
    workspaceToDelete = workspace;
    deleteDialogOpen = true;
  }

  function confirmDelete() {
    if (workspaceToDelete) {
      onDeleteWorkspace(workspaceToDelete.id);
      deleteDialogOpen = false;
      workspaceToDelete = null;
    }
  }
</script>

<aside class="flex w-full h-full flex-col gap-4 select-none shrink-0">
  <!-- WORKSPACES Box -->
  <div class="relative p-4 flex flex-col bg-box-bg border border-border">
    <span
      class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-1.75 left-2.5 bg-background text-primary"
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
            <span class="text-[10px] text-muted-foreground">@{workspace.slug}</span>
            {#if workspaces.length > 1}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span
                class="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer ml-1"
                onclick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(workspace);
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
          createError = '';
          createDialogOpen = true;
        }}
      >
        + New workspace...
      </div>
    </div>
  </div>

  <!-- CATEGORIES Box -->
  <div class="relative flex flex-col bg-box-bg border border-border flex-1 min-h-0">
    <span
      class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-1.75 left-2.5 bg-background text-primary z-10"
      >Categories</span
    >
    <div
      class="flex-1 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary"
    >
      <div class="space-y-1 text-xs">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => onSelectCategory('inbox')}
          class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {selectedCategory ===
          'inbox'
            ? 'bg-primary text-background font-bold'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'}"
        >
          <span>1 Inbox</span>
          <span
            class={selectedCategory === 'inbox'
              ? 'text-background'
              : 'text-muted-foreground group-hover:text-accent-foreground'}>[{bookmarkCount}]</span
          >
        </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => onSelectCategory('favorites')}
          class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {selectedCategory ===
          'favorites'
            ? 'bg-primary text-background font-bold'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'}"
        >
          <span>2 Favorites</span>
          <span
            class={selectedCategory === 'favorites'
              ? 'text-background'
              : 'text-muted-foreground group-hover:text-accent-foreground'}>[{favoriteCount}]</span
          >
        </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => onSelectCategory('trash')}
          class="group flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {selectedCategory ===
          'trash'
            ? 'bg-primary text-background font-bold'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'}"
        >
          <span>3 Trash</span>
          <span
            class={selectedCategory === 'trash'
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
      class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-1.75 left-2.5 bg-background text-primary"
      >Actions</span
    >
    <Button
      onclick={onAddLinkClick}
      size="sm"
      class="font-mono uppercase tracking-wider text-[0.65rem] rounded-none shadow-none border border-primary bg-primary text-background font-bold transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:bg-foreground hover:border-foreground hover:text-background w-full"
    >
      [a] Add Link
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

    <div class="space-y-0.5 text-[10px] text-muted-foreground mt-1 select-none">
      <div>e Export Links</div>
      <div>i Import Links</div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        onclick={() => onSelectCategory('settings')}
        class="cursor-pointer transition-colors hover:text-primary {selectedCategory === 'settings'
          ? 'text-primary font-bold'
          : ''}"
      >
        , Settings
      </div>
    </div>
  </div>
</aside>

<!-- Create Workspace Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary">
        // New Workspace
      </Dialog.Title>
      <Dialog.Description class="text-[10px] text-muted-foreground mt-1">
        Bookmarks are isolated per workspace.
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-4 py-3">
      <div class="flex items-center gap-1.5 px-2 py-1.5 border border-border bg-transparent">
        <span class="text-primary font-bold text-[10px] select-none">$</span>
        <Input
          bind:value={newWorkspaceName}
          onkeydown={handleCreateKeydown}
          placeholder="Workspace name..."
          autofocus
          class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {#if createError}
        <p class="text-[10px] text-destructive mt-1.5 px-1">{createError}</p>
      {/if}
    </div>
    <Dialog.Footer class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3">
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
        onclick={handleCreate}
        disabled={isCreating}
        class="font-mono text-[10px] rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-wider h-auto py-1 px-3 cursor-pointer disabled:opacity-50"
      >
        {isCreating ? '[...]' : '[create]'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Workspace Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-destructive bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-destructive">
        // Delete Workspace
      </Dialog.Title>
      <Dialog.Description class="text-[10px] text-muted-foreground mt-1">
        This will permanently delete
        <span class="text-foreground font-bold">{workspaceToDelete?.name}</span>
        and all its bookmarks. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="px-4 py-4 flex gap-2 justify-end">
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
        onclick={confirmDelete}
        class="font-mono text-[10px] rounded-none border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:text-destructive-foreground uppercase tracking-wider h-auto py-1 px-3 cursor-pointer"
      >
        [delete]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
