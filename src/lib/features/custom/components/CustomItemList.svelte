<script lang="ts">
  import CustomItemItem from './CustomItemItem.svelte';
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

<div class="flex flex-col gap-3">
  {#each customItems as customItem (customItem.id)}
    <CustomItemItem
      customItem={ customItem }
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
    />
  {/each}
</div>
