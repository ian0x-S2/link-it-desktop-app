<script lang="ts">
  import type { CategoryType } from '$lib/features/categories/types/category';

  let {
    type,
    name,
    icon,
  }: {
    type: CategoryType;
    name: string;
    icon: string | null;
  } = $props();

  const descriptions: Partial<Record<CategoryType, string>> = {
    books: 'Track your reading list, book notes, and reading status.',
    media: 'Organize movies, TV shows, anime, and other visual media.',
    audio: 'Manage music, podcasts, and audio collections.',
    documents: 'Store and reference PDFs, manuals, and other files.',
    images: 'Collect visual references and image libraries.',
    custom: 'A custom category for your own content.',
  };
</script>

<!-- Header -->
<div
  class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
>
  <span class="font-bold uppercase tracking-widest text-foreground">
    [{icon ?? '?'}] {name}
  </span>
</div>

<!-- Coming soon placeholder -->
<div class="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
  <div class="font-mono text-muted-foreground space-y-2">
    <div class="text-4xl text-border select-none">[{icon ?? '?'}]</div>
    <div class="text-xs text-primary font-bold uppercase tracking-widest">// coming soon</div>
    <div class="text-tui-xs text-dim-foreground max-w-xs leading-relaxed">
      {descriptions[type] ?? 'This category type is not yet implemented.'}
    </div>
  </div>
  <div class="border border-border px-4 py-2 text-tui-xs text-muted-foreground font-mono">
    <span class="text-dim-foreground">type:</span>
    <span class="text-foreground ml-1">{type}</span>
  </div>
</div>
