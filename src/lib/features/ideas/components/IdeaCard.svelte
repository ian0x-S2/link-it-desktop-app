<script lang="ts">
  import type { Idea } from '../types/idea';

  let {
    idea,
    onDelete,
    onToggleFavorite,
  }: {
    idea: Idea;
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

<div
  class="group relative flex flex-col gap-1.5 p-3 border border-border bg-box-bg hover:border-primary transition-colors"
>
  <!-- Corner brackets on hover (matches BookmarkCard aesthetic) -->
  <span
    class="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity"
  ></span>
  <span
    class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity"
  ></span>

  <!-- Content -->
  <p class="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed">{idea.content}</p>

  <!-- Footer -->
  <div class="flex items-center justify-between mt-0.5">
    <span class="text-tui-xs text-dim-foreground">{formatRelativeTime(idea.createdAt)}</span>
    <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="text-tui-xs text-muted-foreground hover:text-primary cursor-pointer"
        onclick={() => onToggleFavorite(idea.id)}
        title={idea.isFavorite ? 'Unstar' : 'Star'}
      >{idea.isFavorite ? '[★]' : '[☆]'}</span>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="text-tui-xs text-muted-foreground hover:text-destructive cursor-pointer"
        onclick={() => onDelete(idea.id)}
        title="Delete"
      >[x]</span>
    </div>
  </div>
</div>
