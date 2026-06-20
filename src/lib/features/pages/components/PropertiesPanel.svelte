<script lang="ts">
  import { pageStore } from '../stores/page.svelte';
  import * as Popover from '$lib/shared/components/ui/popover';
  import { Button } from '$lib/shared/components/ui/button';
  import { Input } from '$lib/shared/components/ui/input';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '../utils/tag-popover-utils';

  let props = $props<{
    pageId: string;
  }>();

  let addTagOpen = $state(false);
  let newTagValue = $state('');

  const page = $derived(pageStore.activePage);
  const tags = $derived(page?.tags || []);

  // All unique tags across all pages
  const allTags = $derived(getAllUniqueTags(pageStore.items));
  const tagSuggestions = $derived(getTagSuggestions(allTags, tags, newTagValue));
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  async function handleAddTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !tags.includes(clean)) {
      await pageStore.addTag(props.pageId, clean);
    }
    newTagValue = '';
    addTagOpen = false;
  }

  async function handleRemoveTag(tag: string) {
    await pageStore.removeTag(props.pageId, tag);
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTagValue);
    }
  }
</script>

<div
  class="flex flex-wrap gap-2 items-center font-mono text-tui-xs select-none py-1 border-b border-border/40 mb-4 pb-2"
>
  <span class="text-muted-foreground font-bold tracking-wider">TAGS:</span>

  {#each tags as tag (tag)}
    <span
      class="inline-flex items-center gap-1 text-tui-xs text-foreground bg-accent/20 px-1.5 py-0.5 border border-border/60 font-mono"
    >
      #{tag}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        onclick={() => handleRemoveTag(tag)}
        class="text-destructive hover:text-red-400 cursor-pointer font-bold text-tui-xs ml-0.5"
        title="Remove tag"
      >
        x
      </span>
    </span>
  {:else}
    <span class="text-dim-foreground italic">[no tags]</span>
  {/each}

  <!-- Add Tag Popover -->
  <Popover.Root bind:open={addTagOpen}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="xs"
          class="text-tui-xs text-primary hover:text-primary-foreground hover:bg-primary/20 transition-colors select-none font-bold h-auto px-1.5 py-0.5 font-mono"
        >
          [+ add tag]
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      class="w-52 p-0 rounded-none border border-border bg-box-bg font-mono shadow-lg z-50"
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
      <div
        class="flex flex-col py-0.5 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border"
      >
        {#if isNewTag}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            onclick={() => handleAddTag(newTagValue)}
            class="px-2 py-1 text-tui-xs text-primary cursor-pointer hover:bg-primary/10 select-none"
          >
            [Create: "{newTagValue.trim().toLowerCase()}"]
          </div>
        {/if}
        {#each tagSuggestions as suggestion (suggestion)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            onclick={() => handleAddTag(suggestion)}
            class="px-2 py-1 text-tui-xs text-muted-foreground cursor-pointer hover:bg-primary/5 hover:text-foreground select-none"
          >
            # {suggestion}
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
