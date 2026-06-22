<script lang="ts">
  import GenericStatsPanel from './GenericStatsPanel.svelte';
  import GenericTagsPanel from './GenericTagsPanel.svelte';
  import LogoPanel from '$lib/shared/components/LogoPanel.svelte';

  interface Item {
    createdAt: string;
    isFavorite: boolean;
    tags: string[];
  }

  interface Props {
    items: Item[];
    selectedTag: string | null;
    onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
    onDeleteTag: (tag: string) => Promise<void>;
    entityPluralLabel?: string;
    class?: string;
  }

  let {
    items,
    selectedTag = $bindable(null),
    onRenameTag,
    onDeleteTag,
    entityPluralLabel = 'items',
    class: className = '',
  }: Props = $props();
</script>

<div class="w-full lg:w-80 flex flex-col gap-4 overflow-visible shrink-0 h-full min-h-0 pt-2 {className}">
  <GenericStatsPanel {items} />
  <GenericTagsPanel
    {items}
    bind:selectedTag={selectedTag}
    onRenameTag={onRenameTag}
    onDeleteTag={onDeleteTag}
    entityPluralLabel={entityPluralLabel}
  />
  <LogoPanel />
</div>
