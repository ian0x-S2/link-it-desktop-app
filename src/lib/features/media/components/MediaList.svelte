<script lang="ts">
  import MediaItem from './MediaItem.svelte';
  import type { Media } from '../types/media';

  let {
    media = [],
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
    onAddMedia,
  }: {
    media: Media[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
    onAddMedia: () => void;
  } = $props();
</script>

<div class="flex flex-col gap-3">
  {#each media as mediaItem (mediaItem.id)}
    <MediaItem
      media={mediaItem}
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
    />
  {/each}

  <!-- Ghost List Item as last element -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    onclick={onAddMedia}
    class="group relative flex items-center justify-center p-4 border border-dashed border-border bg-background text-center select-none cursor-pointer hover:bg-box-bg/20 transition-all font-mono text-xs rounded-none py-3"
  >
    <span class="absolute top-0 left-0 size-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
    <span class="absolute top-0 right-0 size-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
    <span class="absolute bottom-0 left-0 size-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
    <span class="absolute bottom-0 right-0 size-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>

    <div class="flex items-center gap-2">
      <span class="text-lg text-primary font-bold group-hover:scale-110 transition-transform">+</span>
      <span class="font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider text-tui-xs">Catalog New Media</span>
    </div>
  </div>
</div>
