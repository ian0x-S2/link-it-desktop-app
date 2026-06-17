<script lang="ts">
  import type { WorkspaceStats } from '../types/workspace';

  let {
    stats = [],
    onCloseSettings,
  }: {
    stats: WorkspaceStats[];
    onCloseSettings: () => void;
  } = $props();

  const totalWorkspaces = $derived(stats.length);
  const totalActive = $derived(stats.reduce((acc, curr) => acc + curr.activeCount, 0));
  const totalFavorite = $derived(stats.reduce((acc, curr) => acc + curr.favoriteCount, 0));
  const totalTrash = $derived(stats.reduce((acc, curr) => acc + curr.trashCount, 0));
</script>

<div class="flex flex-col gap-6 font-mono text-xs">
  <!-- Top header row inside page -->
  <div class="flex items-center justify-between border-b border-border pb-3">
    <div class="flex flex-col">
      <span class="text-xs font-bold text-primary uppercase tracking-widest">// Settings Panel</span
      >
      <span class="text-tui-2xs text-dim-foreground mt-0.5"
        >Manage and inspect workspaces statistics</span
      >
    </div>
    <button
      onclick={onCloseSettings}
      class="border border-border bg-transparent text-muted-foreground hover:border-primary hover:text-primary transition-all duration-100 ease-linear cursor-pointer px-2 py-0.5 text-tui-xs uppercase font-bold"
    >
      [ Esc ] Close
    </button>
  </div>

  <!-- Summary Grid -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="border border-border p-3 bg-box-bg/25 flex flex-col gap-1">
      <span class="text-tui-2xs uppercase font-bold text-dim-foreground">Workspaces</span>
      <span class="text-lg font-bold text-foreground">{totalWorkspaces}</span>
    </div>
    <div class="border border-border p-3 bg-box-bg/25 flex flex-col gap-1">
      <span class="text-tui-2xs uppercase font-bold text-dim-foreground">Active Links</span>
      <span class="text-lg font-bold text-primary">{totalActive}</span>
    </div>
    <div class="border border-border p-3 bg-box-bg/25 flex flex-col gap-1">
      <span class="text-tui-2xs uppercase font-bold text-dim-foreground">Favorites</span>
      <span class="text-lg font-bold text-foreground">{totalFavorite}</span>
    </div>
    <div class="border border-border p-3 bg-box-bg/25 flex flex-col gap-1">
      <span class="text-tui-2xs uppercase font-bold text-dim-foreground">Trashed</span>
      <span class="text-lg font-bold text-destructive">{totalTrash}</span>
    </div>
  </div>

  <!-- Workspaces detailed table -->
  <div class="flex flex-col gap-2">
    <span class="text-tui-xs font-bold text-foreground uppercase tracking-tui-wide"
      >// Workspaces Overview</span
    >
    <div class="border border-border bg-box-bg/10 overflow-x-auto">
      <table class="w-full text-left border-collapse min-w-125">
        <thead>
          <tr
            class="border-b border-border bg-box-bg/30 text-tui-2xs text-dim-foreground uppercase tracking-tui-wide font-bold"
          >
            <th class="py-2 px-3">Workspace Name</th>
            <th class="py-2 px-3">Slug</th>
            <th class="py-2 px-3 text-center">Active</th>
            <th class="py-2 px-3 text-center">Favorites</th>
            <th class="py-2 px-3 text-center">Trash</th>
            <th class="py-2 px-3 text-right">Created</th>
          </tr>
        </thead>
        <tbody>
          {#each stats as ws (ws.id)}
            <tr class="border-b border-border/40 hover:bg-accent/5 transition-colors">
              <td class="py-2 px-3 font-bold text-foreground select-none">{ws.name}</td>
              <td class="py-2 px-3 text-muted-foreground">@{ws.slug}</td>
              <td class="py-2 px-3 text-center text-primary font-bold">{ws.activeCount}</td>
              <td class="py-2 px-3 text-center text-foreground">{ws.favoriteCount}</td>
              <td class="py-2 px-3 text-center text-destructive">{ws.trashCount}</td>
              <td class="py-2 px-3 text-right text-dim-foreground select-none">
                {new Date(ws.createdAt).toLocaleDateString()}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <!-- System Info & Keyboard shortcuts -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
    <div class="flex flex-col gap-2">
      <span class="text-tui-xs font-bold text-foreground uppercase tracking-tui-wide"
        >// Shortcuts reference</span
      >
      <div
        class="border border-border bg-box-bg/10 p-3 space-y-1.5 text-tui-xs text-muted-foreground"
      >
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Go to Inbox</span>
          <span class="font-bold text-foreground">[ 1 ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Go to Favorites</span>
          <span class="font-bold text-foreground">[ 2 ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Go to Trash</span>
          <span class="font-bold text-foreground">[ 3 ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Add Link (Focus Prompt)</span>
          <span class="font-bold text-foreground">[ A ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Search Bookmarks</span>
          <span class="font-bold text-foreground">[ S ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>List / Grid Toggle</span>
          <span class="font-bold text-foreground">[ L ] / [ G ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Toggle Color Theme</span>
          <span class="font-bold text-foreground">[ T ]</span>
        </div>
        <div class="flex justify-between border-b border-dashed border-border-dim pb-1">
          <span>Toggle Dark Mode</span>
          <span class="font-bold text-foreground">[ M ]</span>
        </div>
        <div class="flex justify-between">
          <span>Open Settings</span>
          <span class="font-bold text-foreground">[ , ]</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-tui-xs font-bold text-foreground uppercase tracking-tui-wide"
        >// System Information</span
      >
      <div
        class="border border-border bg-box-bg/10 p-3 space-y-2 text-tui-xs text-muted-foreground"
      >
        <div class="flex flex-col">
          <span class="font-bold text-foreground">link-it (desktop-app)</span>
          <span>Version: 0.1.0-mvp</span>
          <span>Database: SQLite (local-first)</span>
        </div>
        <div class="flex flex-col gap-1 border-t border-dashed border-border-dim pt-2">
          <span class="font-bold text-foreground">// Local Storage & Engine</span>
          <span>Tauri SQL plugin driver</span>
          <span>SvelteKit 2 + Svelte 5 Runes client wrapper</span>
        </div>
      </div>
    </div>
  </div>
</div>
