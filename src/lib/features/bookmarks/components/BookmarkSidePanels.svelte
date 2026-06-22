<script lang="ts">
  import StatsPanel from './StatsPanel.svelte';
  import TagsPanel from './TagsPanel.svelte';
  import LogoPanel from '$lib/shared/components/LogoPanel.svelte';
  import type { Bookmark } from '../types/bookmark';

  interface Props {
    bookmarks: Bookmark[];
    selectedTag: string | null;
    onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
    onDeleteTag: (tag: string) => Promise<void>;
    class?: string;
  }

  let {
    bookmarks,
    selectedTag = $bindable(null),
    onRenameTag,
    onDeleteTag,
    class: className = '',
  }: Props = $props();
</script>

<div class="w-full lg:w-80 flex flex-col gap-4 overflow-visible shrink-0 h-full min-h-0 pt-2 {className}">
  <StatsPanel {bookmarks} />
  <TagsPanel
    {bookmarks}
    bind:selectedTag={selectedTag}
    onRenameTag={onRenameTag}
    onDeleteTag={onDeleteTag}
  />
  <LogoPanel />
</div>
