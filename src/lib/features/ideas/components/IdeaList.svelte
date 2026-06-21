<script lang="ts">
  import { ideaStore } from '../stores/idea.svelte';
  import IdeaCard from './IdeaCard.svelte';
  import IdeaInputBar from './IdeaInputBar.svelte';



  async function handleCreate(content: string) {
    await ideaStore.create(content);
  }
</script>

<!-- Header -->
<div
  class="flex items-center justify-between px-4 py-1.5 border-b border-border bg-box-bg text-xs text-muted-foreground shrink-0 select-none"
>
  <span class="font-bold uppercase tracking-widest text-foreground">[*] Ideas</span>
  <span class="text-tui-xs font-bold uppercase tracking-tui-wide">{ideaStore.activeItemsFiltered.length} ideas</span>
</div>

<!-- Quick capture input -->
<IdeaInputBar onSubmit={handleCreate} />

<!-- Ideas list -->
<div
  class="flex-1 min-h-0 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary"
>
  {#if ideaStore.activeItemsFiltered.length === 0}
    <div class="flex flex-col items-center justify-center h-full gap-2 text-center">
      <div class="text-muted-foreground font-mono text-xs space-y-1">
        <div class="text-primary font-bold">// no ideas yet</div>
        <div class="text-dim-foreground">type above to capture your first thought.</div>
      </div>
    </div>
  {:else}
    <div class="space-y-2">
      {#each ideaStore.activeItemsFiltered as idea (idea.id)}
        <IdeaCard
          {idea}
          onDelete={(id) => ideaStore.softDelete(id)}
          onToggleFavorite={(id) => ideaStore.toggleFavorite(id)}
        />
      {/each}
    </div>
  {/if}

  {#if ideaStore.error}
    <div class="mt-2 text-tui-xs text-destructive">{ideaStore.error}</div>
  {/if}
</div>
