<script lang="ts">
  import { Badge } from '$lib/shared/components/ui/badge';
  import * as Popover from '$lib/shared/components/ui/popover';
  import { Input } from '$lib/shared/components/ui/input';
  import { Button } from '$lib/shared/components/ui/button';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '$lib/features/bookmarks/utils/tag-popover-utils';
  import type { Media } from '../types/media';

  let {
    tags = $bindable(),
    allMedia,
  }: {
    tags: string[];
    allMedia: Media[];
  } = $props();

  let addTagOpen = $state(false);
  let newTagValue = $state('');

  const allTags = $derived(getAllUniqueTags(allMedia));
  const tagSuggestions = $derived(getTagSuggestions(allTags, tags, newTagValue));
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  function handleAddTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !tags.includes(clean)) {
      tags = [...tags, clean];
    }
    newTagValue = '';
    addTagOpen = false;
  }

  function handleRemoveTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTagValue);
    }
  }
</script>

<div class="flex flex-col gap-1">
  <span class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
    >Tags</span
  >
  <div
    class="flex flex-wrap gap-1 items-center min-h-8 w-full bg-transparent border border-border p-1 text-foreground"
  >
    {#each tags as tag (tag)}
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
        {#if addTagOpen}
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
        {/if}
      </Popover.Content>
    </Popover.Root>
  </div>
</div>
