<script lang="ts">
  import type { PageMetadata } from '../types/page';

  let {
    page,
    onOpen,
    onDelete,
    onToggleFavorite,
  }: {
    page: PageMetadata & { bannerImage?: string | null };
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
  class="group relative flex flex-col gap-2 p-3 border border-border bg-box-bg transition-colors cursor-pointer"
  onclick={() => onOpen(page.id)}
>
  <!-- Corner brackets on hover (matches BookmarkCard aesthetic) -->
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

  <!-- Banner Cover Thumbnail -->
  <div 
    style={page.bannerImage || 'background-color: var(--color-border-dim); background-image: radial-gradient(var(--color-border) 1px, transparent 1px); background-size: 8px 8px;'}
    class="w-full h-20 shrink-0 border border-border overflow-hidden"
  ></div>

  <!-- Content -->
  <div class="flex-1 flex flex-col gap-1 min-w-0">
    <div class="flex items-center gap-1.5">
      {#if page.isFavorite}
        <span class="text-tui-xs text-primary shrink-0">★</span>
      {/if}
      <span class="text-xs text-foreground font-bold truncate">{page.title || 'Untitled'}</span>
    </div>
    <span class="text-tui-xs text-muted-foreground line-clamp-2 leading-relaxed">
      [doc] document note
    </span>
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-between mt-1 pt-1 border-t border-border/40">
    <span class="text-tui-xs text-dim-foreground">{formatRelativeTime(page.updatedAt)}</span>
    <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
</div>
