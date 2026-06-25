<script lang="ts">
  import { Button } from '$lib/shared/components/ui/button';
  import * as Dialog from '$lib/shared/components/ui/dialog';
  import { Input } from '$lib/shared/components/ui/input';
  import { Textarea } from '$lib/shared/components/ui/textarea';
  import { Badge } from '$lib/shared/components/ui/badge';
  import * as Popover from '$lib/shared/components/ui/popover';
  import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu';
  import { Calendar } from '$lib/shared/components/ui/calendar';
  import { parseDate, type DateValue } from '@internationalized/date';
  import { bookStore } from '../stores/book.svelte';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '$lib/features/bookmarks/utils/tag-popover-utils';

  interface Props {
    open: boolean;
    bookId: string;
  }

  let { open = $bindable(false), bookId }: Props = $props();

  let book = $derived(bookStore.items.find((i) => i.id === bookId));

  let editTitleValue = $state('');
  let editContentValue = $state('');
  let editDescriptionValue = $state('');
  let editUrlValue = $state('');
  let editImageUrlValue = $state('');
  let editTagsList = $state<string[]>([]);

  let authorValue = $state('');
  let ratingValue = $state(0);
  let statusValue = $state('Want to Read');
  let startedAtValue = $state('');
  let finishedAtValue = $state('');
  let pagesReadValue = $state(0);
  let pagesTotalValue = $state(0);

  let startedAtDate = $state<DateValue | undefined>(undefined);
  let finishedAtDate = $state<DateValue | undefined>(undefined);

  $effect(() => {
    if (startedAtValue) {
      try {
        startedAtDate = parseDate(startedAtValue);
      } catch {
        startedAtDate = undefined;
      }
    } else {
      startedAtDate = undefined;
    }
  });

  $effect(() => {
    if (finishedAtValue) {
      try {
        finishedAtDate = parseDate(finishedAtValue);
      } catch {
        finishedAtDate = undefined;
      }
    } else {
      finishedAtDate = undefined;
    }
  });

  $effect(() => {
    const nextStr = startedAtDate ? startedAtDate.toString() : '';
    if (nextStr !== startedAtValue) {
      startedAtValue = nextStr;
    }
  });

  $effect(() => {
    const nextStr = finishedAtDate ? finishedAtDate.toString() : '';
    if (nextStr !== finishedAtValue) {
      finishedAtValue = nextStr;
    }
  });

  let addTagOpen = $state(false);
  let newTagValue = $state('');

  $effect(() => {
    if (open && book) {
      editTitleValue = book.title;
      editContentValue = book.content;
      editDescriptionValue = book.description || '';
      editUrlValue = book.url || '';
      editImageUrlValue = book.imageUrl || '';
      editTagsList = book.tags ? [...book.tags] : [];
      authorValue = book.author || '';
      ratingValue = book.rating || 0;
      statusValue = book.status || 'Want to Read';
      startedAtValue = book.startedAt || '';
      finishedAtValue = book.finishedAt || '';
      pagesReadValue = book.pagesRead || 0;
      pagesTotalValue = book.pagesTotal || 0;
    }
  });

  const allTags = $derived(getAllUniqueTags(bookStore.items));
  const tagSuggestions = $derived(getTagSuggestions(allTags, editTagsList, newTagValue));
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  async function confirmEdit() {
    if (!book) return;

    await bookStore.save(book.id, {
      title: editTitleValue.trim(),
      content: editContentValue.trim(),
      description: editDescriptionValue.trim(),
      url: editUrlValue.trim() || null,
      imageUrl: editImageUrlValue.trim() || null,
      author: authorValue.trim(),
      rating: Number(ratingValue),
      status: statusValue,
      startedAt: startedAtValue || null,
      finishedAt: finishedAtValue || null,
      pagesRead: Number(pagesReadValue),
      pagesTotal: Number(pagesTotalValue),
    });

    const oldTags = book.tags || [];
    for (const tag of oldTags) {
      if (!editTagsList.includes(tag)) await bookStore.removeTag(book.id, tag);
    }
    for (const tag of editTagsList) {
      if (!oldTags.includes(tag)) await bookStore.addTag(book.id, tag);
    }

    open = false;
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
      submitEditTag(newTagValue);
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 w-full max-w-[95vw] md:max-w-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150"
  >
    <Dialog.Header class="px-4 pt-4 pb-3 border-b border-border">
      <Dialog.Title class="text-xs font-bold uppercase tracking-widest text-primary"
        >// Edit Book</Dialog.Title
      >
    </Dialog.Header>

    <div class="px-4 py-4 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
      <div class="flex flex-col gap-1">
        <label
          for="edit-title"
          class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
          >// Title</label
        >
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
          <Input
            id="edit-title"
            bind:value={editTitleValue}
            class="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs h-auto py-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="edit-description"
          class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
          >// Synopsis / Description</label
        >
        <Textarea
          id="edit-description"
          bind:value={editDescriptionValue}
          rows={2}
          class="w-full bg-transparent border border-border outline-none text-foreground font-mono text-xs px-2.5 py-1.5 focus-visible:border-primary resize-none transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="edit-content"
          class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
          >// Personal Notes / Summary (Markdown)</label
        >
        <Textarea
          id="edit-content"
          bind:value={editContentValue}
          rows={3}
          class="w-full bg-transparent border border-border outline-none text-foreground font-mono text-xs px-2.5 py-1.5 focus-visible:border-primary resize-none transition-colors"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label
            for="edit-url"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// URL / Link</label
          >
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
            <Input
              id="edit-url"
              bind:value={editUrlValue}
              class="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs h-auto py-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label
            for="edit-image-url"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Image Preview URL</label
          >
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
            <Input
              id="edit-image-url"
              bind:value={editImageUrlValue}
              class="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs h-auto py-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-dashed border-border-dim pt-3"
      >
        <div class="flex flex-col gap-1">
          <label
            for="edit-author"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Author</label
          >
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
            <Input
              id="edit-author"
              bind:value={authorValue}
              class="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs h-auto py-0 focus-visible:ring-0"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label
            for="edit-rating"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Rating</label
          >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  id="edit-rating"
                  class="w-full text-left bg-box-bg border border-border text-foreground font-mono text-xs px-2.5 py-1.5 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold"
                >
                  <span
                    >{ratingValue > 0
                      ? '★'.repeat(ratingValue) + ` (${ratingValue}/5)`
                      : 'No Rating'}</span
                  >
                  <span class="text-primary font-bold">▼</span>
                </button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              class="bg-box-bg border border-border rounded-none font-mono text-xs w-(--bits-dropdown-menu-anchor-width) min-w-(--bits-dropdown-menu-anchor-width) shadow-lg"
            >
              <DropdownMenu.RadioGroup
                value={String(ratingValue)}
                onValueChange={(val) => {
                  ratingValue = Number(val);
                }}
              >
                <DropdownMenu.RadioItem value="0">No Rating</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="1">★☆☆☆☆ (1/5)</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="2">★★☆☆☆ (2/5)</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="3">★★★☆☆ (3/5)</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="4">★★★★☆ (4/5)</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="5">★★★★★ (5/5)</DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
        <div class="flex flex-col gap-1">
          <label
            for="edit-status"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Status</label
          >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  id="edit-status"
                  class="w-full text-left bg-box-bg border border-border text-foreground font-mono text-xs px-2.5 py-1.5 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold"
                >
                  <span>{statusValue}</span>
                  <span class="text-primary font-bold">▼</span>
                </button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              class="bg-box-bg border border-border rounded-none font-mono text-xs w-(--bits-dropdown-menu-anchor-width) min-w-(--bits-dropdown-menu-anchor-width) shadow-lg"
            >
              <DropdownMenu.RadioGroup
                value={statusValue}
                onValueChange={(val) => {
                  statusValue = val;
                }}
              >
                <DropdownMenu.RadioItem value="Want to Read">Want to Read</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="Reading">Reading</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="Paused">Paused</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="Completed">Completed</DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="Abandoned">Abandoned</DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-dashed border-border-dim pt-3"
      >
        <div class="flex flex-col gap-1">
          <label
            for="edit-pages-read"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Pages Read</label
          >
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
            <input
              id="edit-pages-read"
              type="number"
              bind:value={pagesReadValue}
              min={0}
              class="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs h-auto py-0 focus-visible:ring-0 w-full"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label
            for="edit-pages-total"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Total Pages</label
          >
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-transparent">
            <input
              id="edit-pages-total"
              type="number"
              bind:value={pagesTotalValue}
              min={0}
              class="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-xs h-auto py-0 focus-visible:ring-0 w-full"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label
            for="edit-started-at"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Date Started</label
          >
          <Popover.Root>
            <Popover.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  id="edit-started-at"
                  class="w-full text-left bg-transparent border border-border text-foreground font-mono text-tui-xs px-2 py-1.5 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold"
                >
                  <span>{startedAtValue ? startedAtValue : 'Select Date'}</span>
                  <span class="text-primary font-bold">📅</span>
                </button>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content
              class="p-0 border border-border bg-box-bg rounded-none shadow-lg w-auto"
              align="start"
            >
              <Calendar type="single" bind:value={startedAtDate} class="bg-box-bg rounded-none" />
              <div class="px-3 pb-3 pt-1 text-right flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onclick={() => {
                    startedAtDate = undefined;
                  }}
                  class="text-tui-2xs text-destructive hover:text-red-400 font-bold uppercase tracking-wider font-mono p-0 h-auto bg-transparent"
                >
                  [Clear]
                </Button>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>
        <div class="flex flex-col gap-1">
          <label
            for="edit-finished-at"
            class="text-tui-2xs uppercase font-bold text-muted-foreground tracking-tui-wide"
            >// Date Finished</label
          >
          <Popover.Root>
            <Popover.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  id="edit-finished-at"
                  class="w-full text-left bg-transparent border border-border text-foreground font-mono text-tui-xs px-2 py-1.5 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold"
                >
                  <span>{finishedAtValue ? finishedAtValue : 'Select Date'}</span>
                  <span class="text-primary font-bold">📅</span>
                </button>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content
              class="p-0 border border-border bg-box-bg rounded-none shadow-lg w-auto"
              align="end"
            >
              <Calendar type="single" bind:value={finishedAtDate} class="bg-box-bg rounded-none" />
              <div class="px-3 pb-3 pt-1 text-right flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onclick={() => {
                    finishedAtDate = undefined;
                  }}
                  class="text-tui-2xs text-destructive hover:text-red-400 font-bold uppercase tracking-wider font-mono p-0 h-auto bg-transparent"
                >
                  [Clear]
                </Button>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>

      <div class="flex flex-col gap-1 border-t border-dashed border-border-dim pt-3">
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

          <Popover.Root bind:open={addTagOpen}>
            <Popover.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="xs"
                  class="text-tui-2xs text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono"
                  >+ add tag</Button
                >
              {/snippet}
            </Popover.Trigger>
            <Popover.Content
              class="w-52 p-0 rounded-none border border-border bg-box-bg font-mono shadow-lg"
              align="start"
              sideOffset={4}
            >
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

    <Dialog.Footer class="px-4 pb-4 flex gap-2 justify-end border-t border-border pt-3 shrink-0">
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="xs"
            class="font-mono text-tui-xs rounded-none border border-border-dim hover:border-border text-muted-foreground hover:text-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
            >[cancel]</Button
          >
        {/snippet}
      </Dialog.Close>
      <Button
        variant="outline"
        size="xs"
        onclick={confirmEdit}
        class="font-mono text-tui-xs rounded-none border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground uppercase tracking-tui-wide h-auto py-1 px-3 cursor-pointer"
        >[save]</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
