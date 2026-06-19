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
  class="group flex items-start justify-between gap-2 py-1.5 px-2 border-b border-border cursor-pointer transition-colors {isActive
    ? 'bg-primary/10 border-l-2 border-l-primary'
    : 'hover:bg-accent'}"
  onclick={() => onOpen(page.id)}
>
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-1.5">
      {#if page.isFavorite}
        <span class="text-tui-xs text-primary shrink-0">★</span>
      {/if}
      <span class="text-xs text-foreground font-bold truncate">{page.title || 'Untitled'}</span>
    </div>
    <div class="text-tui-xs text-muted-foreground mt-0.5">
      {formatRelativeTime(page.updatedAt)}
    </div>
  </div>

  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="text-tui-xs text-muted-foreground hover:text-primary cursor-pointer"
      onclick={(e) => { e.stopPropagation(); onToggleFavorite(page.id); }}
      title={page.isFavorite ? 'Unstar' : 'Star'}
    >{page.isFavorite ? '[★]' : '[☆]'}</span>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span
      class="text-tui-xs text-muted-foreground hover:text-destructive cursor-pointer"
      onclick={(e) => { e.stopPropagation(); onDelete(page.id); }}
      title="Delete"
    >[x]</span>
  </div>
</div>
