<script lang="ts">
  import AudioCard from './AudioCard.svelte';
  import type { Audio } from '../types/audio';

  let {
    audio = [],
    onToggleFavorite,
    onDelete,
    onAddTag,
    onRemoveTag,
    onEdit,
  }: {
    audio: Audio[];
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
    onEdit: (id: string) => void;
  } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
  {#each audio as audio (audio.id)}
    <AudioCard
      audio={ audio }
      onToggleFavorite={onToggleFavorite}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onEdit={onEdit}
    />
  {/each}
</div>
