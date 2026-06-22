<script lang="ts">
  import PageStatsPanel from './PageStatsPanel.svelte';
  import PageTagsPanel from './PageTagsPanel.svelte';
  import LogoPanel from '$lib/shared/components/LogoPanel.svelte';
  import type { PageMetadata } from '../types/page';

  interface Props {
    pages: PageMetadata[];
    selectedTag: string | null;
    onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
    onDeleteTag: (tag: string) => Promise<void>;
    class?: string;
  }

  let {
    pages,
    selectedTag = $bindable(null),
    onRenameTag,
    onDeleteTag,
    class: className = '',
  }: Props = $props();
</script>

<div class="w-full lg:w-80 flex flex-col gap-4 overflow-visible shrink-0 h-full min-h-0 pt-2 {className}">
  <PageStatsPanel {pages} />
  <PageTagsPanel
    {pages}
    bind:selectedTag={selectedTag}
    onRenameTag={onRenameTag}
    onDeleteTag={onDeleteTag}
  />
  <LogoPanel />
</div>
