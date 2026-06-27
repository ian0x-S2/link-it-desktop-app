<script lang="ts">
  import type { Media } from '../types/media';
  import { Button } from '$lib/shared/components/ui/button';
  import * as Dialog from '$lib/shared/components/ui/dialog';
  import { Input } from '$lib/shared/components/ui/input';
  import { Textarea } from '$lib/shared/components/ui/textarea';
  import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu';
  import { mediaStore } from '../stores/media.svelte';
  import { pageStore } from '$lib/features/pages/stores/page.svelte';

  // Import subcomponents
  import MediaAutofill from './MediaAutofill.svelte';
  import MediaTagsEditor from './MediaTagsEditor.svelte';
  import MediaProgressTracker from './MediaProgressTracker.svelte';

  let props = $props<{
    media: Media;
    onClose: () => void;
    onOpenNote: (pageId: string) => void;
    isNew?: boolean;
    onSaveNew?: (
      mediaData: Omit<
        Media,
        'id' | 'createdAt' | 'updatedAt' | 'workspaceId' | 'isFavorite' | 'deletedAt'
      >,
    ) => void;
  }>();

  // Metadata local states
  let titleValue = $state((() => props.media.title)());
  let contentValue = $state((() => props.media.content || '')());
  let typeValue = $state((() => props.media.type || 'Movie')());
  let creatorValue = $state((() => props.media.creator || '')());
  let descriptionValue = $state((() => props.media.description || '')());
  let urlValue = $state((() => props.media.url || '')());
  let imageUrlValue = $state((() => props.media.imageUrl || '')());
  let ratingValue = $state((() => props.media.rating || 0)());
  let statusValue = $state((() => props.media.status || 'Plan to Watch')());
  let startedAtValue = $state((() => props.media.startedAt || '')());
  let finishedAtValue = $state((() => props.media.finishedAt || '')());
  let progressValue = $state((() => props.media.progressValue || 0)());
  let progressTotal = $state((() => props.media.progressTotal || 0)());
  let progressUnit = $state((() => props.media.progressUnit || 'episodes')());
  let tagsList = $state((() => (props.media.tags ? [...props.media.tags] : []))());

  let autofilledEpisodes = $state<number | null>(null);
  let autofilledSeasons = $state<number | null>(null);
  let isCreatingNote = $state(false);

  $effect(() => {
    // Reset/sync local state if the media reference or ID changes
    const currentMedia = props.media;
    titleValue = currentMedia.title;
    contentValue = currentMedia.content || '';
    typeValue = currentMedia.type || 'Movie';
    creatorValue = currentMedia.creator || '';
    descriptionValue = currentMedia.description || '';
    urlValue = currentMedia.url || '';
    imageUrlValue = currentMedia.imageUrl || '';
    ratingValue = currentMedia.rating || 0;
    statusValue = currentMedia.status || 'Plan to Watch';
    startedAtValue = currentMedia.startedAt || '';
    finishedAtValue = currentMedia.finishedAt || '';
    progressValue = currentMedia.progressValue || 0;
    progressTotal = currentMedia.progressTotal || 0;
    progressUnit = currentMedia.progressUnit || 'episodes';
    tagsList = currentMedia.tags ? [...currentMedia.tags] : [];
  });

  const isProgressSupported = $derived(typeValue === 'Series');

  interface AutofillMetadata {
    title?: string;
    creator?: string;
    imageUrl?: string;
    url?: string;
    description?: string;
    type?: 'Movie' | 'Series' | 'YouTube' | 'Other';
    progressValue?: number;
    progressTotal?: number;
    progressUnit?: string;
    autofilledEpisodes?: number | null;
    autofilledSeasons?: number | null;
  }

  function handleImport(metadata: AutofillMetadata) {
    if (metadata.title !== undefined) titleValue = metadata.title;
    if (metadata.creator !== undefined) creatorValue = metadata.creator;
    if (metadata.imageUrl !== undefined) imageUrlValue = metadata.imageUrl;
    if (metadata.url !== undefined) urlValue = metadata.url;
    if (metadata.description !== undefined) descriptionValue = metadata.description;
    if (metadata.type !== undefined) typeValue = metadata.type;
    if (metadata.progressValue !== undefined) progressValue = metadata.progressValue;
    if (metadata.progressTotal !== undefined) progressTotal = metadata.progressTotal;
    if (metadata.progressUnit !== undefined) progressUnit = metadata.progressUnit;
    if (metadata.autofilledEpisodes !== undefined) autofilledEpisodes = metadata.autofilledEpisodes;
    if (metadata.autofilledSeasons !== undefined) autofilledSeasons = metadata.autofilledSeasons;
  }

  async function handleSave() {
    if (props.isNew) {
      if (props.onSaveNew) {
        props.onSaveNew({
          title: titleValue.trim() || 'Untitled Media',
          content: contentValue.trim(),
          type: typeValue,
          creator: creatorValue.trim(),
          description: descriptionValue.trim(),
          url: urlValue.trim() || null,
          imageUrl: imageUrlValue.trim() || null,
          rating: Number(ratingValue),
          status: statusValue,
          startedAt: startedAtValue || null,
          finishedAt: finishedAtValue || null,
          progressValue: isProgressSupported ? Number(progressValue) : 0,
          progressTotal: isProgressSupported ? Number(progressTotal) : 0,
          progressUnit: isProgressSupported ? progressUnit : 'episodes',
          tags: tagsList,
        });
      }
    } else {
      // 1. Save standard fields
      await mediaStore.save(props.media.id, {
        title: titleValue.trim() || 'Untitled Media',
        content: contentValue.trim(),
        type: typeValue,
        creator: creatorValue.trim(),
        description: descriptionValue.trim(),
        url: urlValue.trim() || null,
        imageUrl: imageUrlValue.trim() || null,
        rating: Number(ratingValue),
        status: statusValue,
        startedAt: startedAtValue || null,
        finishedAt: finishedAtValue || null,
        progressValue: isProgressSupported ? Number(progressValue) : 0,
        progressTotal: isProgressSupported ? Number(progressTotal) : 0,
        progressUnit: isProgressSupported ? progressUnit : 'episodes',
      });

      // 2. Synchronize tags
      const oldTags = props.media.tags || [];
      for (const t of tagsList) {
        if (!oldTags.includes(t)) {
          await mediaStore.addTag(props.media.id, t);
        }
      }
      for (const t of oldTags) {
        if (!tagsList.includes(t)) {
          await mediaStore.removeTag(props.media.id, t);
        }
      }

      props.onClose();
    }
  }

  function buildMediaRefBlock(): string {
    const cleanDesc = descriptionValue ? descriptionValue.replace(/\r?\n/g, ' ').trim() : '';
    return [
      ':::media-ref',
      `title: ${titleValue.trim() || 'Untitled'}`,
      `type: ${typeValue}`,
      `creator: ${creatorValue.trim() || ''}`,
      `description: ${cleanDesc}`,
      `status: ${statusValue || 'Plan to Watch'}`,
      `rating: ${ratingValue}`,
      `progressValue: ${isProgressSupported ? progressValue : 0}`,
      `progressTotal: ${isProgressSupported ? progressTotal : 0}`,
      `progressUnit: ${isProgressSupported ? progressUnit : 'episodes'}`,
      `imageUrl: ${imageUrlValue.trim() || ''}`,
      `startedAt: ${startedAtValue || ''}`,
      `finishedAt: ${finishedAtValue || ''}`,
      ':::',
    ].join('\n');
  }

  async function handleNewNote() {
    isCreatingNote = true;
    try {
      if (!props.isNew) {
        // Save current state first
        await mediaStore.save(props.media.id, {
          title: titleValue.trim() || 'Untitled Media',
          content: contentValue.trim(),
          type: typeValue,
          creator: creatorValue.trim(),
          description: descriptionValue.trim(),
          url: urlValue.trim() || null,
          imageUrl: imageUrlValue.trim() || null,
          rating: Number(ratingValue),
          status: statusValue,
          startedAt: startedAtValue || null,
          finishedAt: finishedAtValue || null,
          progressValue: isProgressSupported ? Number(progressValue) : 0,
          progressTotal: isProgressSupported ? Number(progressTotal) : 0,
          progressUnit: isProgressSupported ? progressUnit : 'episodes',
        });

        const oldTags = props.media.tags || [];
        for (const t of tagsList) {
          if (!oldTags.includes(t)) {
            await mediaStore.addTag(props.media.id, t);
          }
        }
        for (const t of oldTags) {
          if (!tagsList.includes(t)) {
            await mediaStore.removeTag(props.media.id, t);
          }
        }
      }

      const noteTitle = `🎬 ${titleValue.trim() || 'Untitled Media'}`;
      const noteContent = [
        buildMediaRefBlock(),
        '',
        `# Notes on: ${titleValue.trim() || 'Untitled Media'}`,
        '',
        `> Type: ${typeValue} │ Creator: ${creatorValue.trim() || 'Unknown'}`,
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
          <span>🎬 New Media: {titleValue || 'Untitled Media'}</span>
        {:else}
          <span>🎬 Media Details: {titleValue || 'Untitled Media'}</span>
        {/if}
        {#if mediaStore.error}
          <span class="text-destructive font-bold text-tui-xs">[{mediaStore.error}]</span>
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
      <!-- Autofill Lookup Row -->
      <MediaAutofill onImport={handleImport} />

      <div class="flex flex-col md:flex-row gap-6">
        <!-- Left Column: Thumbnail / Image & URLs -->
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
              >Image Preview URL</span
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

        <!-- Middle Column: Main Metadata Form -->
        <div class="flex-1 flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
                >Media Title</span
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
                >Creator / Director / Channel</span
              >
              <Input
                type="text"
                bind:value={creatorValue}
                class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary h-auto"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span
                class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
                >Media Type</span
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
                      <span>{typeValue}</span>
                      <span class="text-primary font-bold">▼</span>
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  class="bg-box-bg border border-border rounded-none font-mono text-xs w-(--bits-dropdown-menu-anchor-width) min-w-(--bits-dropdown-menu-anchor-width) shadow-lg"
                >
                  <DropdownMenu.RadioGroup
                    value={typeValue}
                    onValueChange={(val) => {
                      typeValue = val;
                    }}
                  >
                    <DropdownMenu.RadioItem value="Movie">Movie</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="Series">Series</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="YouTube">YouTube Video</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="Other">Other</DropdownMenu.RadioItem>
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

          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Status</span
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
                  <DropdownMenu.RadioItem value="Plan to Watch">Plan to Watch</DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="Watching">Watching</DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="Completed">Completed</DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="Paused">Paused</DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="Abandoned">Abandoned</DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <!-- Tags component -->
          <MediaTagsEditor bind:tags={tagsList} allMedia={mediaStore.items} />

          <div class="flex flex-col gap-1">
            <span
              class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
              >Synopsis / Description</span
            >
            <Textarea
              bind:value={descriptionValue}
              rows={3}
              placeholder="Write a synopsis or description..."
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
              placeholder="Write your thoughts, details, or reviews..."
              class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none h-auto"
            />
          </div>
        </div>

        <!-- Right Column: Progress & Dates (hidden for YouTube) -->
        {#if typeValue !== 'YouTube'}
          <MediaProgressTracker
            typeValue={typeValue}
            bind:progressValue={progressValue}
            bind:progressTotal={progressTotal}
            bind:progressUnit={progressUnit}
            bind:startedAtValue={startedAtValue}
            bind:finishedAtValue={finishedAtValue}
            bind:autofilledEpisodes={autofilledEpisodes}
            bind:autofilledSeasons={autofilledSeasons}
          />
        {/if}
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
              <span>◆ New Note from this Media</span>
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
        class="px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-background transition-colors text-tui-xs font-mono font-bold uppercase cursor-pointer h-auto"
      >
        [Save]
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
