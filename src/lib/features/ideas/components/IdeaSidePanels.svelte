<script lang="ts">
  import IdeaStatsPanel from './IdeaStatsPanel.svelte';
  import IdeaTagsPanel from './IdeaTagsPanel.svelte';
  import LogoPanel from '$lib/shared/components/LogoPanel.svelte';
  import type { Idea } from '../types/idea';

  interface Props {
    ideas: Idea[];
    selectedTag: string | null;
    onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
    onDeleteTag: (tag: string) => Promise<void>;
    class?: string;
  }

  let {
    ideas,
    selectedTag = $bindable(null),
    onRenameTag,
    onDeleteTag,
    class: className = '',
  }: Props = $props();
</script>

<div class="w-full lg:w-80 flex flex-col gap-4 overflow-visible shrink-0 h-full min-h-0 pt-2 {className}">
  <IdeaStatsPanel {ideas} />
  <IdeaTagsPanel
    {ideas}
    bind:selectedTag={selectedTag}
    onRenameTag={onRenameTag}
    onDeleteTag={onDeleteTag}
  />
  <LogoPanel />
</div>
