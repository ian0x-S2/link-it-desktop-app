<script lang="ts">
  import { Button } from '$lib/shared/components/ui/button';
  import { Input } from '$lib/shared/components/ui/input';
  import BookmarkGrid from './BookmarkGrid.svelte';
  import BookmarkList from './BookmarkList.svelte';
  import PromptInput from './PromptInput.svelte';
  import SettingsView from '$lib/features/workspaces/components/SettingsView.svelte';
  import type { Bookmark } from '../types/bookmark';
  import type { WorkspaceStats } from '$lib/features/workspaces/types/workspace';

  interface Props {
    bookmarks: Bookmark[];
    category: string;
    mode: 'list' | 'grid';
    searchActive: boolean;
    searchQuery: string;
    selectedTag: string | null;
    promptInput: HTMLInputElement | null;
    stats: WorkspaceStats[];
    // Callbacks
    onModeChange: (mode: 'list' | 'grid') => void;
    onSearchToggle: (active: boolean) => void;
    onSearchChange: (query: string) => void;
    onClearTag: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onAddLink: (
      url: string,
      metadata?: {
        title: string;
        description: string;
        imageUrl: string;
        faviconUrl: string;
      } | null,
    ) => Promise<void>;
    onCloseSettings: () => void;
  }

  let {
    bookmarks,
    category,
    mode,
    searchActive,
    searchQuery = $bindable(''),
    selectedTag,
    promptInput = $bindable(null),
    stats,
    onModeChange,
    onSearchToggle,
    onSearchChange,
    onClearTag,
    onEdit,
    onDelete,
    onToggleFavorite,
    onAddTag,
    onRemoveTag,
    onAddLink,
    onCloseSettings,
  }: Props = $props();

  let promptValue = $state('');
</script>

<!-- Center Box: LINKS header with view mode tabs -->
<div
  class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
>
  <span class="font-bold uppercase tracking-widest text-foreground">
    {category === 'settings' ? 'Settings' : 'Links'}
  </span>
  {#if category !== 'settings'}
    <div class="flex items-center gap-1.5">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => onModeChange('list')}
        class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {mode ===
        'list'
          ? 'bg-primary text-background font-bold'
          : 'hover:text-foreground'}"
      >
        [l]ist
      </span>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => onModeChange('grid')}
        class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {mode ===
        'grid'
          ? 'bg-primary text-background font-bold'
          : 'hover:text-foreground'}"
      >
        [g]rid
      </span>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => {
          const nextActive = !searchActive;
          onSearchToggle(nextActive);
          if (nextActive) {
            setTimeout(() => promptInput?.focus(), 50);
          }
        }}
        class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {searchActive
          ? 'bg-primary text-background font-bold'
          : 'hover:text-foreground'}"
      >
        [s]earch
      </span>
    </div>
  {/if}
</div>

<!-- Tag Filter Indicator Badge if a tag is active -->
{#if selectedTag}
  <div
    class="flex items-center justify-between px-4 py-1 border-b border-border bg-accent/25 text-tui-xs text-primary shrink-0 select-none font-bold"
  >
    <div class="flex items-center gap-1">
      <span>FILTERED BY:</span>
      <span class="underline">#{selectedTag}</span>
    </div>
    <Button
      variant="ghost"
      size="xs"
      onclick={onClearTag}
      class="text-destructive hover:text-red-400 font-bold tracking-tui-wide cursor-pointer bg-transparent hover:bg-transparent border-none p-0 h-auto font-mono text-tui-xs"
    >
      [x] CLEAR
    </Button>
  </div>
{/if}

<!-- Input Container (prevents layout shift) -->
{#if category !== 'settings'}
  <div class="px-4 pt-4 shrink-0">
    {#if searchActive}
      <div class="flex flex-col mb-4 shrink-0">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm"
        >
          <span class="text-primary font-bold select-none">?</span>
          <Input
            bind:ref={promptInput}
            bind:value={searchQuery}
            oninput={(e) => onSearchChange(e.currentTarget.value)}
            type="text"
            placeholder="Search links..."
            class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    {:else if category !== 'favorites' && category !== 'trash'}
      <PromptInput
        bind:value={promptValue}
        bind:inputElement={promptInput}
        onAdd={onAddLink}
      />
    {/if}
  </div>
{/if}

<!-- Bookmark content area -->
<div
  class="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0"
>
  {#if category === 'settings'}
    <SettingsView {stats} onCloseSettings={onCloseSettings} />
  {:else if bookmarks.length > 0}
    {#if mode === 'list'}
      <BookmarkList
        {bookmarks}
        onToggleFavorite={onToggleFavorite}
        onDelete={onDelete}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onEdit={onEdit}
      />
    {:else}
      <BookmarkGrid
        {bookmarks}
        onToggleFavorite={onToggleFavorite}
        onDelete={onDelete}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onEdit={onEdit}
      />
    {/if}
  {:else}
    <div
      class="flex flex-col items-center justify-center h-full text-center select-none gap-2 py-8"
    >
      <p class="text-xs uppercase tracking-wider text-destructive">✗ No records found</p>
      <p class="text-tui-xs text-dim-foreground">
        {searchActive
          ? '> Refine your search query'
          : '> Press [a] or click $ to add a link'}
      </p>
    </div>
  {/if}
</div>

<!-- Bottom count indicator -->
{#if category !== 'settings'}
  <div
    class="flex items-center justify-end px-4 py-1 border-t border-border bg-box-bg text-tui-xs text-muted-foreground select-none shrink-0 font-bold"
  >
    {bookmarks.length}
    item{bookmarks.length === 1 ? '' : 's'}
  </div>
{/if}
