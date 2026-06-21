<script lang="ts">
  import DocumentItemComponent from './DocumentItem.svelte';
  import type { DocumentItem } from '../types/document';

  let {
    documents = [],
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
  }: {
    documents: DocumentItem[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
  } = $props();
</script>

<div class="flex flex-col gap-3">
  {#each documents as document (document.id)}
    <DocumentItemComponent
      document={ document }
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
    />
  {/each}
</div>
