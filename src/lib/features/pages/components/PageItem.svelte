<script lang="ts">
  import type { PageMetadata } from '../types/page';

  let {
    page,
    isActive = false,
    onOpen,
    onDelete,
    onToggleFavorite,
  }: {
    page: PageMetadata;
    isActive?: boolean;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
  } = $props();

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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="group relative p-3 flex flex-col gap-2 transition-all duration-150 ease-in-out bg-background border border-transparent cursor-pointer {isActive
    ? 'bg-primary/5 border-primary/20!'
    : ''}"
  onclick={() => onOpen(page.id)}
>
  <!-- Corner brackets on hover -->
  <span class="absolute top-0 left-0 size-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
  <span class="absolute top-0 right-0 size-2 border-t border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
  <span class="absolute bottom-0 left-0 size-2 border-b border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>
  <span class="absolute bottom-0 right-0 size-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150"></span>

  <div class="flex items-center justify-between text-xs">
    <div class="flex items-center gap-2">
      <span class="text-primary font-bold flex items-center gap-1 select-none">
        [📄]
      </span>
      <span class="font-bold text-sm text-foreground">{page.title || 'Untitled'}</span>
    </div>
    <span
      class="text-tui-xs uppercase tracking-tui-wide text-dim-foreground"
      class:text-primary={page.isFavorite}
    >
      {page.isFavorite ? '★ FAVORITE' : '☆ STANDARD'}
    </span>
  </div>

  <div class="flex flex-col gap-1">
    <span class="text-tui-xs text-muted-foreground leading-normal">
      [doc] document note
    </span>
  </div>

  <div class="flex items-center justify-between mt-1 pt-1 border-t border-border/40 text-tui-xs">
    <span class="text-dim-foreground">{formatRelativeTime(page.updatedAt)}</span>
    <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="text-muted-foreground hover:text-primary cursor-pointer font-mono"
        onclick={(e) => { e.stopPropagation(); onToggleFavorite(page.id); }}
        title={page.isFavorite ? 'Unstar' : 'Star'}
      >{page.isFavorite ? '[★]' : '[☆]'}</span>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="text-muted-foreground hover:text-destructive cursor-pointer font-mono"
        onclick={(e) => { e.stopPropagation(); onDelete(page.id); }}
        title="Delete"
      >[x]</span>
    </div>
  </div>
</div>
