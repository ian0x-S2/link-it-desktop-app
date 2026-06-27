<script lang="ts">
  import type { Book } from '../types/book';
  import { Button } from '$lib/shared/components/ui/button';
  import * as Dialog from '$lib/shared/components/ui/dialog';
  import { Input } from '$lib/shared/components/ui/input';
  import { Textarea } from '$lib/shared/components/ui/textarea';
  import { Badge } from '$lib/shared/components/ui/badge';
  import * as Popover from '$lib/shared/components/ui/popover';
  import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu';
  import { Calendar } from '$lib/shared/components/ui/calendar';
  import { Skeleton } from '$lib/shared/components/ui/skeleton';
  import { parseDate, type DateValue } from '@internationalized/date';
  import { bookStore } from '../stores/book.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '$lib/features/bookmarks/utils/tag-popover-utils';
  import { searchOpenLibrary, type OpenLibraryBook } from '../utils/open-library';

  let props = $props<{
    book: Book;
    onClose: () => void;
    onOpenNote: (pageId: string) => void;
    isNew?: boolean;
    onSaveNew?: (
      bookData: Omit<
        Book,
        'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'isFavorite' | 'deletedAt'
      >,
    ) => void;
  }>();

  // Metadata local states
  let titleValue = $state((() => props.book.title)());
  let authorValue = $state((() => props.book.author)());
  let ratingValue = $state((() => props.book.rating)());
  let statusValue = $state((() => props.book.status)());
  let startedAtValue = $state((() => props.book.startedAt || '')());
  let finishedAtValue = $state((() => props.book.finishedAt || '')());
  let pagesReadValue = $state((() => props.book.pagesRead)());
  let pagesTotalValue = $state((() => props.book.pagesTotal)());
  let imageUrlValue = $state((() => props.book.imageUrl || '')());
  let descriptionValue = $state((() => props.book.description)());
  let contentValue = $state((() => props.book.content || '')());
  let urlValue = $state((() => props.book.url || '')());
  let tagsList = $state((() => (props.book.tags ? [...props.book.tags] : []))());

  let startedAtDate = $state<DateValue | undefined>(undefined);
  let finishedAtDate = $state<DateValue | undefined>(undefined);

  $effect(() => {
    // Reset/sync local state if the book reference or ID changes
    const currentBook = props.book;
    titleValue = currentBook.title;
    authorValue = currentBook.author;
    ratingValue = currentBook.rating;
    statusValue = currentBook.status;
    startedAtValue = currentBook.startedAt || '';
    finishedAtValue = currentBook.finishedAt || '';
    pagesReadValue = currentBook.pagesRead;
    pagesTotalValue = currentBook.pagesTotal;
    imageUrlValue = currentBook.imageUrl || '';
    descriptionValue = currentBook.description;
    contentValue = currentBook.content || '';
    urlValue = currentBook.url || '';
    tagsList = currentBook.tags ? [...currentBook.tags] : [];
  });

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
  let isCreatingNote = $state(false);

  // Open Library metadata search
  let autofillSearchQuery = $state('');
  let openLibraryResults = $state<OpenLibraryBook[]>([]);
  let isSearchingOL = $state(false);

  async function handleOpenLibrarySearch() {
    if (!autofillSearchQuery.trim()) return;
    isSearchingOL = true;
    try {
      openLibraryResults = await searchOpenLibrary(autofillSearchQuery);
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.error(e);
    } finally {
      isSearchingOL = false;
    }
  }

  async function applyOpenLibraryMetadata(result: OpenLibraryBook) {
    titleValue = result.title;
    authorValue = result.author;
    imageUrlValue = result.imageUrl || '';
    if (result.pagesTotal) pagesTotalValue = result.pagesTotal;

    let descriptionText = result.description || '';
    if (result.key) {
      try {
        const response = await fetch(`https://openlibrary.org${result.key}.json`);
        if (response.ok) {
          const workData = await response.json();
          if (workData.description) {
            descriptionText =
              typeof workData.description === 'string'
                ? workData.description
                : (workData.description.value ?? descriptionText);
          }
        }
      } catch {
        /* ignore */
      }
    }

    descriptionValue = descriptionText;
    openLibraryResults = [];
    autofillSearchQuery = '';
  }

  const allTags = $derived(getAllUniqueTags(bookStore.items));
  const tagSuggestions = $derived(getTagSuggestions(allTags, tagsList, newTagValue));
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  // Reading progress
  const progressPercent = $derived(
    pagesTotalValue > 0
      ? Math.min(100, Math.max(0, Math.round((pagesReadValue / pagesTotalValue) * 100)))
      : 0,
  );

  const progressBar = $derived.by(() => {
    const total = 20;
    const filled = Math.round((progressPercent / 100) * total);
    return `[${'█'.repeat(filled)}${'░'.repeat(total - filled)}] ${progressPercent}%`;
  });

  function handleAddTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !tagsList.includes(clean)) {
      tagsList = [...tagsList, clean];
    }
    newTagValue = '';
    addTagOpen = false;
  }

  function handleRemoveTag(tag: string) {
    tagsList = tagsList.filter((t) => t !== tag);
  }

  async function handleSave() {
    if (props.isNew) {
      if (props.onSaveNew) {
        props.onSaveNew({
          title: titleValue.trim() || 'Untitled Book',
          author: authorValue.trim(),
          rating: Number(ratingValue),
          status: statusValue,
          startedAt: startedAtValue || null,
          finishedAt: finishedAtValue || null,
          pagesRead: Number(pagesReadValue),
          pagesTotal: Number(pagesTotalValue),
          imageUrl: imageUrlValue.trim() || null,
          description: descriptionValue.trim(),
          content: contentValue.trim(),
          url: urlValue.trim() || null,
          tags: tagsList,
        });
      }
    } else {
      // 1. Save standard fields
      await bookStore.save(props.book.id, {
        title: titleValue.trim() || 'Untitled Book',
        author: authorValue.trim(),
        rating: Number(ratingValue),
        status: statusValue,
        startedAt: startedAtValue || null,
        finishedAt: finishedAtValue || null,
        pagesRead: Number(pagesReadValue),
        pagesTotal: Number(pagesTotalValue),
        imageUrl: imageUrlValue.trim() || null,
        description: descriptionValue.trim(),
        content: contentValue.trim(),
        url: urlValue.trim() || null,
      });

      // 2. Synchronize tags
      const oldTags = props.book.tags || [];
      for (const t of tagsList) {
        if (!oldTags.includes(t)) {
          await bookStore.addTag(props.book.id, t);
        }
      }
      for (const t of oldTags) {
        if (!tagsList.includes(t)) {
          await bookStore.removeTag(props.book.id, t);
        }
      }

      props.onClose();
    }
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTagValue);
    }
  }

  /**
   * Builds the :::book-ref block content for CodeMirror widget rendering.
   */
  function buildBookRefBlock(): string {
    const cleanDesc = descriptionValue ? descriptionValue.replace(/\r?\n/g, ' ').trim() : '';
    return [
      ':::book-ref',
      `title: ${titleValue.trim() || 'Untitled'}`,
      `author: ${authorValue.trim() || ''}`,
      `description: ${cleanDesc}`,
      `status: ${statusValue || 'Want to Read'}`,
      `rating: ${ratingValue}`,
      `pagesRead: ${pagesReadValue}`,
      `pagesTotal: ${pagesTotalValue}`,
      `imageUrl: ${imageUrlValue.trim() || ''}`,
      `startedAt: ${startedAtValue || ''}`,
      `finishedAt: ${finishedAtValue || ''}`,
      ':::',
    ].join('\n');
  }

  /**
   * Creates a new page (note) pre-filled with book metadata and a :::book-ref widget.
   * Navigates to the page feature via onOpenNote callback after creation.
   */
  async function handleNewNote() {
    isCreatingNote = true;
    try {
      if (!props.isNew) {
        // 1. Save standard fields
        await bookStore.save(props.book.id, {
          title: titleValue.trim() || 'Untitled Book',
          author: authorValue.trim(),
          rating: Number(ratingValue),
          status: statusValue,
          startedAt: startedAtValue || null,
          finishedAt: finishedAtValue || null,
          pagesRead: Number(pagesReadValue),
          pagesTotal: Number(pagesTotalValue),
          imageUrl: imageUrlValue.trim() || null,
          description: descriptionValue.trim(),
          content: contentValue.trim(),
          url: urlValue.trim() || null,
        });

        // 2. Synchronize tags
        const oldTags = props.book.tags || [];
        for (const t of tagsList) {
          if (!oldTags.includes(t)) {
            await bookStore.addTag(props.book.id, t);
          }
        }
        for (const t of oldTags) {
          if (!tagsList.includes(t)) {
            await bookStore.removeTag(props.book.id, t);
          }
        }
      }

      const noteTitle = `📖 ${titleValue.trim() || 'Untitled Book'}`;
      const noteContent = [
        buildBookRefBlock(),
        '',
        `# Notes on: ${titleValue.trim() || 'Untitled Book'}`,
        '',
        `> by ${authorValue.trim() || 'Unknown Author'}`,
        '',
        '---',
        '',
        '## ✏️ My Thoughts',
        '',
        '',
      ].join('\n');

      const page = await pageStore.create(noteTitle, noteContent);
      if (page) props.onOpenNote(page.id);
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.error(e);
    } finally {
      isCreatingNote = false;
    }
  }
</script>

<Dialog.Root
  open={true}
  onOpenChange={(val) => {
    if (!val) props.onClose();
  }}
>
  <Dialog.Content
    showCloseButton={false}
    class="rounded-none border border-border bg-box-bg font-mono text-foreground p-0 gap-0 w-full max-w-[95vw] md:max-w-6xl h-[70vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150"
  >
    <Dialog.Header
      class="px-4 pt-4 pb-3 border-b border-border flex flex-row items-center justify-between shrink-0"
    >
      <Dialog.Title
        class="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5"
      >
        {#if props.isNew}
          <span>📖 New Book: {titleValue || 'Untitled Book'}</span>
        {:else}
          <span>📖 Book Details: {titleValue || 'Untitled Book'}</span>
        {/if}
        {#if bookStore.error}
          <span class="text-destructive font-bold text-tui-xs">[{bookStore.error}]</span>
        {/if}
      </Dialog.Title>
      <Button
        variant="ghost"
        size="xs"
        onclick={props.onClose}
        class="text-muted-foreground hover:text-foreground font-mono text-tui-xs cursor-pointer bg-transparent hover:bg-transparent border-none p-0 h-auto font-bold uppercase select-none shadow-none"
        >[CLOSE]</Button
      >
    </Dialog.Header>

    <div class="px-4 py-4 flex flex-col gap-4 overflow-y-auto flex-1 select-text">
      <!-- Open Library Metadata Import Row -->
      <div class="flex flex-col gap-2 border-b border-dashed border-border-dim pb-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-tui-2xs font-bold text-primary select-none uppercase tracking-widest"
            >// Import Metadata:</span
          >
          <Input
            type="text"
            bind:value={autofillSearchQuery}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleOpenLibrarySearch();
              }
            }}
            placeholder="Search title, author, or ISBN..."
            class="bg-transparent border border-border text-foreground font-mono text-xs px-2 py-0.5 outline-none focus:border-primary flex-1 max-w-md h-auto"
          />
          <Button
            variant="outline"
            size="xs"
            onclick={handleOpenLibrarySearch}
            disabled={isSearchingOL}
            class="px-2 py-0.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors text-tui-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono cursor-pointer h-auto"
          >
            {isSearchingOL ? '[searching...]' : '[search open library]'}
          </Button>
        </div>

        {#if isSearchingOL}
          <div
            class="border border-border p-2 bg-box-bg flex flex-col gap-1.5 max-h-48 overflow-y-auto mt-1 font-mono"
          >
            <div
              class="text-tui-xs text-muted-foreground font-bold select-none border-b border-border pb-1 uppercase tracking-wider animate-pulse"
            >
              // Searching Open Library...
            </div>
            {#each Array(3) as _, i (i)}
              <div class="p-1.5 flex gap-3 items-center">
                <Skeleton class="w-7 h-10 bg-muted/20 shrink-0" />
                <div class="flex-1 flex flex-col gap-1.5">
                  <Skeleton class="h-3.5 w-1/2 bg-muted/20" />
                  <Skeleton class="h-2.5 w-1/3 bg-muted/20" />
                </div>
              </div>
            {/each}
          </div>
        {:else if openLibraryResults.length > 0}
          <div
            class="border border-border p-2 bg-box-bg flex flex-col gap-1.5 max-h-48 overflow-y-auto mt-1"
          >
            <div
              class="text-tui-xs text-muted-foreground font-bold select-none border-b border-border pb-1 flex justify-between uppercase"
            >
              <span>Select a match to autofill metadata:</span>
              <Button
                variant="ghost"
                size="xs"
                onclick={() => (openLibraryResults = [])}
                class="text-destructive font-bold hover:underline cursor-pointer p-0 h-auto hover:bg-transparent bg-transparent shadow-none"
                >[close]</Button
              >
            </div>
            {#each openLibraryResults as result, index (result.title + result.author + (result.isbn || '') + index)}
              <Button
                variant="ghost"
                size="xs"
                onclick={() => applyOpenLibraryMetadata(result)}
                class="text-left w-full hover:bg-primary/10 p-1.5 flex gap-3 items-center text-tui-xs transition-colors border-b border-border/30 last:border-none cursor-pointer h-auto rounded-none justify-start shadow-none"
              >
                {#if result.imageUrl}
                  <img
                    src={result.imageUrl}
                    alt="cover"
                    class="w-7 h-10 object-cover border border-border shrink-0"
                  />
                {:else}
                  <div
                    class="w-7 h-10 border border-border border-dashed flex items-center justify-center text-[8px] text-dim-foreground font-bold shrink-0"
                  >
                    [NO COV]
                  </div>
                {/if}
                <div class="flex-1 min-w-0">
                  <div class="font-bold truncate text-foreground font-mono">{result.title}</div>
                  <div class="text-tui-xs text-muted-foreground truncate font-mono">
                    by {result.author}
                  </div>
                  {#if result.description}
                    <div class="text-tui-2xs text-dim-foreground truncate font-mono italic mt-0.5">
                      {result.description}
                    </div>
                  {/if}
                </div>
              </Button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex flex-col md:flex-row gap-6">
        <!-- Left: Cover / Image & URL -->
        <div class="flex flex-col gap-3 w-full md:w-44 shrink-0">
          {#if imageUrlValue}
            <div
              class="aspect-3/4 w-full border border-border bg-box-bg overflow-hidden flex items-center justify-center"
            >
              <img src={imageUrlValue} alt="Cover Preview" class="w-full h-full object-cover" />
            </div>
          {:else}
            <div
              class="aspect-3/4 w-full border border-border border-dashed bg-box-bg flex flex-col items-center justify-center text-center text-dim-foreground font-bold p-3 select-none text-tui-sm"
            >
              <span>[ NO COVER IMAGE ]</span>
            </div>
          {/if}

          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Cover Image URL</span
            >
            <Input
              type="text"
              bind:value={imageUrlValue}
              placeholder="https://..."
              class="w-full bg-transparent border border-border text-foreground font-mono text-tui-xs px-1.5 py-0.5 outline-none focus:border-primary h-auto"
            />
          </div>

          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >URL / Link</span
            >
            <Input
              type="text"
              bind:value={urlValue}
              placeholder="https://..."
              class="w-full bg-transparent border border-border text-foreground font-mono text-tui-xs px-1.5 py-0.5 outline-none focus:border-primary h-auto"
            />
          </div>
        </div>

        <!-- Middle: Title, Author, Status, Rating, Description -->
        <div class="flex-1 flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
                >Book Title</span
              >
              <Input
                type="text"
                bind:value={titleValue}
                class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary font-bold h-auto"
              />
            </div>

            <div class="flex flex-col gap-1">
              <span
                class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
                >Author</span
              >
              <Input
                type="text"
                bind:value={authorValue}
                class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary h-auto"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
                >Reading Status</span
              >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="outline"
                      size="xs"
                      {...props}
                      class="w-full text-left bg-box-bg border border-border text-foreground font-mono text-xs px-2 py-1.5 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
                    >
                      <span>{statusValue}</span>
                      <span class="text-primary font-bold">▼</span>
                    </Button>
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
                    <DropdownMenu.RadioItem value="Want to Read"
                      >Want to Read</DropdownMenu.RadioItem
                    >
                    <DropdownMenu.RadioItem value="Reading">Reading</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="Paused">Paused</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="Completed">Completed</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="Abandoned">Abandoned</DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>

            <div class="flex flex-col gap-1">
              <span
                class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
                >Personal Rating</span
              >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="outline"
                      size="xs"
                      {...props}
                      class="w-full text-left bg-box-bg border border-border text-foreground font-mono text-xs px-2 py-1.5 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
                    >
                      <span
                        >{ratingValue > 0
                          ? '★'.repeat(ratingValue) + ` (${ratingValue}/5)`
                          : 'No Rating'}</span
                      >
                      <span class="text-primary font-bold">▼</span>
                    </Button>
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
          </div>

          <!-- Tags -->
          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Tags</span
            >
            <div
              class="flex flex-wrap gap-1 items-center min-h-8 w-full bg-transparent border border-border p-1 text-foreground"
            >
              {#each tagsList as tag (tag)}
                <Badge
                  variant="outline"
                  class="text-tui-2xs px-1.5 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono py-0"
                >
                  *{tag}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <span
                    onclick={() => handleRemoveTag(tag)}
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
                      class="text-tui-2xs text-dim-foreground hover:text-primary transition-colors select-none font-bold h-auto p-0 bg-transparent hover:bg-transparent font-mono ml-1 shadow-none"
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
                      class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-dim-foreground font-mono text-tui-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0"
                    />
                  </div>
                  <div class="flex flex-col py-0.5 max-h-40 overflow-y-auto">
                    {#if isNewTag}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div
                        onclick={() => handleAddTag(newTagValue)}
                        class="px-2 py-1 text-tui-xs text-primary cursor-pointer hover:bg-accent/30 select-none"
                      >
                        [Create: "{newTagValue.trim().toLowerCase()}"]
                      </div>
                    {/if}
                    {#each tagSuggestions as suggestion (suggestion)}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div
                        onclick={() => handleAddTag(suggestion)}
                        class="px-2 py-1 text-tui-xs text-muted-foreground cursor-pointer hover:bg-accent/30 hover:text-foreground select-none"
                      >
                        * {suggestion}
                      </div>
                    {/each}
                    {#if tagSuggestions.length === 0 && !isNewTag}
                      <div class="px-2 py-1 text-tui-xs text-dim-foreground italic select-none">
                        No tags yet
                      </div>
                    {/if}
                  </div>
                </Popover.Content>
              </Popover.Root>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Synopsis / Description</span
            >
            <Textarea
              bind:value={descriptionValue}
              rows={3}
              placeholder="Write a short description or synopsis of the book..."
              class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none h-auto"
            />
          </div>

          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Personal Notes / Summary (Markdown)</span
            >
            <Textarea
              bind:value={contentValue}
              rows={4}
              placeholder="Write your personal notes, summaries, or quotes..."
              class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none h-auto  "
            />
          </div>
        </div>

        <!-- Right: Progress & Dates -->
        <div
          class="w-full md:w-64 shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-dashed border-border-dim pt-3 md:pt-0 md:pl-6 justify-between"
        >
          <div class="flex flex-col gap-2">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Reading Progress</span
            >

            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-0.5">
                <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
                  >Pages Read</span
                >
                <Input
                  type="number"
                  bind:value={pagesReadValue}
                  min={0}
                  class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary h-auto"
                />
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
                  >Total Pages</span
                >
                <Input
                  type="number"
                  bind:value={pagesTotalValue}
                  min={0}
                  class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary h-auto"
                />
              </div>
            </div>

            <!-- TUI Progress Bar -->
            <div class="mt-1 text-xs font-mono font-bold text-primary select-none whitespace-pre">
              {progressBar}
            </div>
          </div>

          <div class="flex flex-col gap-2 border-t border-dashed border-border-dim pt-2">
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-0.5">
                <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
                  >Date Started</span
                >
                <Popover.Root>
                  <Popover.Trigger>
                    {#snippet child({ props })}
                      <Button
                        variant="outline"
                        size="xs"
                        {...props}
                        class="w-full text-left bg-transparent border border-border text-foreground font-mono text-tui-xs px-2 py-1 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
                      >
                        <span>{startedAtValue ? startedAtValue : 'Select Date'}</span>
                        <span class="text-primary font-bold">📅</span>
                      </Button>
                    {/snippet}
                  </Popover.Trigger>
                  <Popover.Content
                    class="p-0 border border-border bg-box-bg rounded-none shadow-lg w-auto"
                    align="center"
                  >
                    <Calendar
                      type="single"
                      bind:value={startedAtDate}
                      class="bg-box-bg rounded-none"
                    />
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
              <div class="flex flex-col gap-0.5">
                <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
                  >Date Finished</span
                >
                <Popover.Root>
                  <Popover.Trigger>
                    {#snippet child({ props })}
                      <Button
                        variant="outline"
                        size="xs"
                        {...props}
                        class="w-full text-left bg-transparent border border-border text-foreground font-mono text-tui-xs px-2 py-1 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
                      >
                        <span>{finishedAtValue ? finishedAtValue : 'Select Date'}</span>
                        <span class="text-primary font-bold">📅</span>
                      </Button>
                    {/snippet}
                  </Popover.Trigger>
                  <Popover.Content
                    class="p-0 border border-border bg-box-bg rounded-none shadow-lg w-auto"
                    align="end"
                  >
                    <Calendar
                      type="single"
                      bind:value={finishedAtDate}
                      class="bg-box-bg rounded-none"
                    />
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
          </div>
        </div>
      </div>

      <!-- New Note button row -->
      {#if !props.isNew}
        <div class="border-t border-dashed border-border-dim pt-2 mt-1 flex justify-end">
          <Button
            variant="outline"
            size="xs"
            onclick={handleNewNote}
            disabled={isCreatingNote}
            class="px-3 py-1 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-tui-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono cursor-pointer flex items-center gap-1.5 h-auto"
          >
            {#if isCreatingNote}
              <span class="animate-pulse">creating note...</span>
            {:else}
              <span>◆ New Note from this Book</span>
            {/if}
          </Button>
        </div>
      {/if}
    </div>

    <Dialog.Footer
      class="px-4 pb-4 pt-3 flex gap-3 justify-end border-t border-border bg-box-bg shrink-0 select-none"
    >
      <Button
        variant="outline"
        size="xs"
        onclick={props.onClose}
        class="px-3 py-1 border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors text-tui-xs font-mono font-bold uppercase cursor-pointer h-auto"
      >
        [Cancel]
      </Button>
      <Button
        variant="outline"
        size="xs"
        onclick={handleSave}
        class="px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground transition-colors text-tui-xs font-mono font-bold uppercase cursor-pointer h-auto"
      >
        [Save]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
