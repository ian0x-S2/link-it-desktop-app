<script lang="ts">
  import * as AlertDialog from '$lib/shared/components/ui/alert-dialog';
  import { Button } from '$lib/shared/components/ui/button';
  import * as Dialog from '$lib/shared/components/ui/dialog';
  import { Input } from '$lib/shared/components/ui/input';

  interface ItemWithTags {
    tags: string[];
  }

  let {
    items = [],
    selectedTag = $bindable(null),
    onRenameTag,
    onDeleteTag,
    entityPluralLabel = 'items',
  }: {
    items: ItemWithTags[];
    selectedTag: string | null;
    onRenameTag: (oldTag: string, newTag: string) => void;
    onDeleteTag: (tag: string) => void;
    entityPluralLabel?: string;
  } = $props();

  let tagSearch = $state('');

  // Rename dialog state
  let renameDialogOpen = $state(false);
  let tagToRename = $state<string | null>(null);
  let newTagNameValue = $state('');

  // Delete alert dialog state
  let deleteDialogOpen = $state(false);
  let tagToDelete = $state<string | null>(null);

  // Aggregate all unique tags with their item counts
  const tagList = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (item.tags) {
        for (const t of item.tags) {
          counts[t] = (counts[t] || 0) + 1;
        }
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });

  // Filtered tags based on search input
  const filteredTags = $derived.by(() => {
    const search = tagSearch.trim().toLowerCase();
    if (!search) {
      return tagList;
    }
    return tagList.filter((t) => t.name.toLowerCase().includes(search));
  });

  function handleRename(tag: string) {
    tagToRename = tag;
    newTagNameValue = tag;
    renameDialogOpen = true;
  }

  function confirmRename() {
    if (
      tagToRename &&
      newTagNameValue.trim() &&
      newTagNameValue.trim().toLowerCase() !== tagToRename.toLowerCase()
    ) {
      onRenameTag(tagToRename, newTagNameValue.trim().toLowerCase());
    }
    renameDialogOpen = false;
    tagToRename = null;
    newTagNameValue = '';
  }

  function handleDelete(tag: string) {
    tagToDelete = tag;
    deleteDialogOpen = true;
  }

  function confirmDelete() {
    if (tagToDelete) {
      onDeleteTag(tagToDelete);
    }
    deleteDialogOpen = false;
    tagToDelete = null;
  }

  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmRename();
    }
  }
</script>

<div
  class="relative p-4 flex flex-col bg-box-bg border border-border lg:flex-2 min-h-35 lg:min-h-0 select-none font-mono"
>
  <span
    class="absolute px-1.5 text-tui-xs font-bold uppercase tracking-tui-wide -top-1.75 left-2.5 bg-background text-primary"
    >Tags</span
  >

  <!-- Tag search -->
  <div
    class="flex items-center gap-1.5 px-2 py-0.5 border border-border-dim bg-transparent text-tui-xs mb-2 shrink-0"
  >
    <span class="text-primary font-bold">/</span>
    <Input
      bind:value={tagSearch}
      type="text"
      placeholder="Filter tags..."
      class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-tui-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
    />
    {#if tagSearch}
      <Button
        variant="ghost"
        size="xs"
        onclick={() => (tagSearch = '')}
        class="text-destructive hover:text-red-400 font-bold font-mono cursor-pointer bg-transparent hover:bg-transparent border-none p-0 h-auto w-auto min-w-0"
        title="Clear filter"
      >
        ×
      </Button>
    {/if}
  </div>

  <!-- Scrollable Tags list -->
  <div
    class="flex-1 overflow-y-auto pr-1 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary min-h-0"
  >
    {#each filteredTags as tag (tag.name)}
      <div
        class="relative flex items-center justify-between text-xs py-0.5 px-1.5 group border border-transparent transition-colors {selectedTag ===
        tag.name
          ? 'bg-primary text-background font-bold'
          : ''}"
      >
        <!-- Corner brackets on hover -->
        <span class="absolute top-0 left-0 size-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
        <span class="absolute top-0 right-0 size-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
        <span class="absolute bottom-0 left-0 size-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
        <span class="absolute bottom-0 right-0 size-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>

        <!-- Click tag to filter -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => (selectedTag = selectedTag === tag.name ? null : tag.name)}
          class="flex-1 truncate cursor-pointer py-0.5"
        >
          <span>* {tag.name}</span>
          <span class="text-tui-2xs opacity-70 ml-1" class:text-background={selectedTag === tag.name}
            >({tag.count})</span
          >
        </div>

        <!-- Tag actions (hover actions) -->
        <div
          class="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0 transition-opacity"
        >
          <Button
            variant="outline"
            size="xs"
            onclick={() => handleRename(tag.name)}
            class="text-[8px] px-1 border border-border-dim hover:border-primary hover:text-primary bg-background text-foreground transition-colors cursor-pointer h-auto font-mono py-0.5 rounded-none"
            title="Rename tag globally"
          >
            edit
          </Button>
          <Button
            variant="outline"
            size="xs"
            onclick={() => handleDelete(tag.name)}
            class="text-[8px] px-1 border border-border-dim hover:border-destructive hover:text-destructive bg-background text-foreground transition-colors cursor-pointer h-auto font-mono py-0.5 rounded-none"
            title="Delete tag globally"
          >
            del
          </Button>
        </div>
      </div>
    {:else}
      <div class="text-tui-xs text-dim-foreground italic py-1">
        {tagSearch ? '✗ No matching tags' : '> No tags found'}
      </div>
    {/each}
  </div>
</div>

<!-- Rename Tag Dialog -->
<Dialog.Root bind:open={renameDialogOpen}>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary">
        // Rename Tag
      </Dialog.Title>
      <Dialog.Description class="text-tui-xs text-muted-foreground mt-1">
        Rename
        <span class="text-foreground font-bold">*{tagToRename}</span>
        globally across all {entityPluralLabel}.
      </Dialog.Description>
    </Dialog.Header>
    <div class="px-4 py-3">
      <div class="flex items-center gap-1.5 px-2 py-1.5 border border-border bg-transparent">
        <span class="text-primary font-bold text-tui-xs select-none">*</span>
        <Input
          id="rename-tag-input"
          bind:value={newTagNameValue}
          onkeydown={handleRenameKeydown}
          placeholder="new-tag-name"
          autofocus
          class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-tui-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
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
        onclick={confirmRename}
        class="font-mono text-tui-xs rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
      >
        [confirm]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Tag AlertDialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content
    class="rounded-none border border-destructive/50 bg-box-bg font-mono text-foreground p-0 gap-0 max-w-sm shadow-xl"
  >
    <AlertDialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <AlertDialog.Title class="text-xs font-bold uppercase tracking-widest text-destructive">
        // Delete Tag
      </AlertDialog.Title>
      <AlertDialog.Description class="text-tui-xs text-muted-foreground mt-1">
        Remove
        <span class="text-foreground font-bold">*{tagToDelete}</span>
        from all {entityPluralLabel} globally. This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3">
      <AlertDialog.Cancel>
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
      </AlertDialog.Cancel>
      <AlertDialog.Action>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            onclick={confirmDelete}
            class="font-mono text-tui-xs rounded-none border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:text-destructive-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
          >
            [delete]
          </Button>
        {/snippet}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
