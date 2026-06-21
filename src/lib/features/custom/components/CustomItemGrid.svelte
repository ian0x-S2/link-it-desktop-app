<script lang="ts">
  import CustomItemCard from './CustomItemCard.svelte';
  import type { CustomItem } from '../types/custom';

  let {
    customItems = [],
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
  }: {
    customItems: CustomItem[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
  } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
  {#each customItems as customItem (customItem.id)}
    <CustomItemCard
      customItem={ customItem }
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
    />
  {/each}
</div>
