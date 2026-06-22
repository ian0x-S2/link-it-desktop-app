<script lang="ts">
  /* eslint-disable no-console */
  import { Badge } from '$lib/shared/components/ui/badge';
  import { Button } from '$lib/shared/components/ui/button';
  import { Input } from '$lib/shared/components/ui/input';
  import { Textarea } from '$lib/shared/components/ui/textarea';
  import * as Popover from '$lib/shared/components/ui/popover';
  import { ideaStore } from '../stores/idea.svelte';
  import {
    getAllUniqueTags,
    getTagSuggestions,
    isNewTagValue,
    normaliseTag,
  } from '../utils/tag-popover-utils';
  import type { Idea } from '../types/idea';

  let {
    idea,
    onDelete,
    onToggleFavorite,
    onUpdate,
    onAddTag,
    onRemoveTag,
    onConvertToNote,
  }: {
    idea: Idea;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onUpdate: (id: string, content: string) => Promise<void>;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onConvertToNote: (id: string, content: string) => Promise<void>;
  } = $props();

  let isEditing = $state(false);
  let editContent = $state('');
  let copied = $state(false);

  // Tag popover state
  let addTagOpen = $state(false);
  let newTagValue = $state('');

  // All unique tags across all ideas for autocomplete
  const allTags = $derived(getAllUniqueTags(ideaStore.items));

  // Filter suggestions based on current input (excludes tags already on this idea)
  const tagSuggestions = $derived(getTagSuggestions(allTags, idea.tags || [], newTagValue));

  // Whether the typed value is a brand-new tag not in the global list
  const isNewTag = $derived(isNewTagValue(allTags, newTagValue));

  function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function startEditing() {
    editContent = idea.content;
    isEditing = true;
  }

  async function handleSave() {
    if (!editContent.trim()) return;
    try {
      await onUpdate(idea.id, editContent);
      isEditing = false;
    } catch (e) {
      console.error(e);
    }
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      isEditing = false;
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(idea.content);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  }

  function submitTag(tag: string) {
    const clean = normaliseTag(tag);
    if (clean && !(idea.tags || []).includes(clean)) {
      onAddTag(idea.id, clean);
    }
    newTagValue = '';
    addTagOpen = false;
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = newTagValue.trim().toLowerCase();
      if (q) {
        submitTag(q);
      }
    } else if (e.key === 'Escape') {
      newTagValue = '';
      addTagOpen = false;
    }
  }
</script>

<div
  class="group relative flex flex-col gap-2.5 p-3 border border-border bg-background transition-all duration-150 rounded-none shadow-none text-foreground"
>
  <!-- Corner brackets on hover (4 vertices) -->
  <span
    class="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity"
  ></span>
  <span
    class="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity"
  ></span>
  <span
    class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity"
  ></span>
  <span
    class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity"
  ></span>

  <!-- Content & Inline Edit -->
  {#if isEditing}
    <div class="flex flex-col gap-2">
      <Textarea
        bind:value={editContent}
        onkeydown={handleEditKeydown}
        rows={5}
        autofocus
        class="w-full bg-background text-foreground border border-border p-2 font-mono text-xs focus:outline-none focus:border-primary resize-y min-h-25"
        placeholder="Edit idea content..."
      />
      <div class="flex items-center gap-2 justify-end text-tui-2xs font-mono select-none">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={handleSave}
          class="text-primary hover:text-foreground cursor-pointer font-bold">[save]</span
        >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => (isEditing = false)}
          class="text-muted-foreground hover:text-foreground cursor-pointer">[cancel]</span
        >
      </div>
    </div>
  {:else}
    <p
      class="text-xs text-foreground whitespace-pre-wrap wrap-break-word leading-relaxed cursor-text select-text"
      ondblclick={startEditing}
    >
      {idea.content}
    </p>
  {/if}

  <!-- Tags Row (only if not editing) -->
  {#if !isEditing}
    <div class="flex flex-wrap gap-1 items-center font-mono">
      {#each idea.tags || [] as tag (tag)}
        <Badge
          variant="outline"
          class="text-tui-2xs px-1 border border-border-dim text-muted-foreground flex items-center gap-1 select-none font-mono"
        >
          *{tag}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span
            onclick={() => onRemoveTag(idea.id, tag)}
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
              + add
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
                onclick={() => submitTag(newTagValue)}
                class="px-2 py-1 text-tui-xs text-primary cursor-pointer hover:bg-accent/30 select-none"
              >
                [Create: "{newTagValue.trim().toLowerCase()}"]
              </div>
            {/if}
            {#each tagSuggestions as suggestion (suggestion)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                onclick={() => submitTag(suggestion)}
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
  {/if}

  <!-- Footer & Actions -->
  {#if !isEditing}
    <div
      class="flex items-center justify-between mt-0.5 pt-2 border-t border-dashed border-border-dim text-tui-2xs font-mono select-none"
    >
      <span class="text-dim-foreground">{formatRelativeTime(idea.createdAt)}</span>

      <div class="flex items-center gap-2">
        <!-- Star / Unstar -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="text-muted-foreground hover:text-primary cursor-pointer"
          onclick={() => onToggleFavorite(idea.id)}
          title={idea.isFavorite ? 'Unstar' : 'Star'}
        >
          {idea.isFavorite ? '[★ unstar]' : '[☆ star]'}
        </span>

        <!-- Edit -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="text-muted-foreground hover:text-primary cursor-pointer"
          onclick={startEditing}
          title="Edit Inline"
        >
          [edit]
        </span>

        <!-- Convert to Note -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="text-muted-foreground hover:text-primary cursor-pointer"
          onclick={() => onConvertToNote(idea.id, idea.content)}
          title="Convert to Note"
        >
          [-> note]
        </span>

        <!-- Copy -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="text-muted-foreground hover:text-primary cursor-pointer"
          onclick={handleCopy}
          title="Copy to Clipboard"
        >
          {copied ? '[copied!]' : '[copy]'}
        </span>

        <!-- Delete -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="text-destructive hover:text-red-400 cursor-pointer"
          onclick={() => onDelete(idea.id)}
          title="Delete"
        >
          [del]
        </span>
      </div>
    </div>
  {/if}
</div>
