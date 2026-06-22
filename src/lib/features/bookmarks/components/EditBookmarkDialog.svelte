<script lang="ts">
  import { Button } from '$lib/shared/components/ui/button';
  import * as Dialog from '$lib/shared/components/ui/dialog';
  import { Input } from '$lib/shared/components/ui/input';
  import { Textarea } from '$lib/shared/components/ui/textarea';
  import { Badge } from '$lib/shared/components/ui/badge';
  import * as Popover from '$lib/shared/components/ui/popover';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '$lib/features/bookmarks/utils/tag-popover-utils';
  import type { Bookmark } from '../types/bookmark';

  interface Props {
    open: boolean;
    bookmarkId: string | null;
    bookmarkStore: any;
    onSave: (
      id: string,
      data: {
        title: string;
        description: string;
        imageUrl: string;
        tags: string[];
      },
    ) => Promise<void>;
  }

  let { open = $bindable(false), bookmarkId, bookmarkStore, onSave }: Props = $props();

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

  // All unique tags across all bookmarks for autocomplete
  const allTags = $derived(getAllUniqueTags(bookmarkStore.items));

  // Filter suggestions based on current input (excludes tags already in our local edit list)
  const tagSuggestions = $derived(getTagSuggestions(allTags, editTagsList, newTagValue));

  // Whether the typed value is a brand-new tag not in the global list
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  $effect(() => {
    if (open && bookmarkId) {
      const bookmark = bookmarkStore.items.find((b: Bookmark) => b.id === bookmarkId);
      if (bookmark) {
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
      }
    }
  });

  $effect(() => {
    if (!open) {
      editTitleValue = '';
      editDescriptionValue = '';
      editImageUrlInput = '';
      editImageFileBase64 = '';
      editTagsList = [];
    }
  });

  async function confirmEdit() {
    if (!bookmarkId) return;
    await onSave(bookmarkId, {
      title: editTitleValue.trim(),
      description: editDescriptionValue.trim(),
      imageUrl: editImageUrlValue,
      tags: editTagsList,
    });
    open = false;
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
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 w-full max-w-[95vw] md:max-w-3xl shadow-xl animate-in fade-in zoom-in-95 duration-150"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary">
        // Edit Bookmark
      </Dialog.Title>
      <Dialog.Description class="text-tui-xs text-muted-foreground mt-1">
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
            class="aspect-video w-full border border-border border-dashed bg-background flex flex-col items-center justify-center text-tui-xs text-dim-foreground font-mono select-none shrink-0 p-4 text-center"
          >
            <span>[ NO IMAGE PREVIEW ]</span>
          </div>
        {/if}

        <!-- Image URL / File Upload Switch and Inputs -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 mb-1 select-none border-b border-border-dim pb-1">
            <span class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
              >// Image Source:</span
            >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              onclick={() => (editImageSourceMode = 'url')}
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-2xs {editImageSourceMode ===
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
              class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-2xs {editImageSourceMode ===
              'upload'
                ? 'bg-primary text-background font-bold'
                : 'text-muted-foreground hover:text-foreground'}"
            >
              [Upload]
            </span>
          </div>

          {#if editImageSourceMode === 'url'}
            <div
              class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent focus-within:border-primary transition-colors"
            >
              <span class="text-primary font-bold text-tui-xs select-none">$</span>
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
                    class="font-mono text-tui-2xs text-destructive hover:bg-destructive/10 uppercase tracking-tui-wide h-auto py-1 px-2 cursor-pointer border-destructive/30 hover:border-destructive"
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
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Title</label
          >
          <div
            class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent focus-within:border-primary transition-colors"
          >
            <span class="text-primary font-bold text-tui-xs select-none">$</span>
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
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Description</label
          >
          <Textarea
            id="edit-description-input"
            bind:value={editDescriptionValue}
            rows={5}
            placeholder="Description..."
            class="w-full h-full bg-transparent border border-border outline-none text-foreground placeholder:text-dim-foreground font-mono text-xs px-2.5 py-1.5 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 resize-none transition-colors"
          />
        </div>

        <!-- Tags List with Popover -->
        <div class="flex flex-col gap-1">
          <span class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Tags</span
          >
          <div
            class="flex flex-wrap gap-1.5 items-center p-2 border border-border min-h-9 bg-transparent"
          >
            {#each editTagsList as tag (tag)}
              <Badge
                variant="outline"
                class="text-tui-2xs px-1 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono"
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
                    class="text-tui-2xs text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
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
                  <span class="text-primary font-bold text-tui-xs select-none">#</span>
                  <Input
                    bind:value={newTagValue}
                    onkeydown={handleTagKeydown}
                    placeholder="tag name..."
                    autofocus
                    class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-tui-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <!-- Suggestions -->
                <div class="flex flex-col py-0.5 max-h-40 overflow-y-auto">
                  {#if isNewTag}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      onclick={() => submitEditTag(newTagValue)}
                      class="px-2 py-1 text-tui-xs text-primary cursor-pointer hover:bg-accent/30 select-none"
                    >
                      [Create: "{newTagValue.trim().toLowerCase()}"]
                    </div>
                  {/if}
                  {#each tagSuggestions as suggestion (suggestion)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      onclick={() => submitEditTag(suggestion)}
                      class="px-2 py-1 text-tui-xs text-muted-foreground cursor-pointer hover:bg-accent/30 hover:text-foreground select-none"
                    >
                      * {suggestion}
                    </div>
                  {/each}
                  {#if tagSuggestions.length === 0 && !isNewTag}
                    <div class="px-2 py-1 text-tui-xs text-dim-foreground italic select-none">
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
            class="font-mono text-tui-xs rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
          >
            [cancel]
          </Button>
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={confirmEdit}
        class="font-mono text-tui-xs rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
      >
        [save]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
