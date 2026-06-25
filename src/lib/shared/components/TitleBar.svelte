<script lang="ts">
  import { onMount } from 'svelte';
  import type { Window as TauriWindow } from '@tauri-apps/api/window';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { workspaceStore } from '$lib/features/workspaces/stores/workspace.svelte';

  let { isMaximized = $bindable(false) } = $props();

  let isTauri = $state(false);
  let isMac = $state(false);
  let appWindow = $state<TauriWindow | null>(null);

  onMount(() => {
    isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');
    if (isTauri) {
      appWindow = getCurrentWindow();
    }
  });

  async function handleMinimize() {
    if (appWindow) {
      await appWindow.minimize();
    }
  }

  async function handleToggleMaximize() {
    if (appWindow) {
      await appWindow.toggleMaximize();
      const maximized = await appWindow.isMaximized();
      isMaximized = maximized;
    }
  }

  async function handleClose() {
    if (appWindow) {
      await appWindow.close();
    }
  }

  function handleDoubleClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    handleToggleMaximize();
  }
</script>

<div
  data-tauri-drag-region
  role="none"
  ondblclick={handleDoubleClick}
  class="h-8 flex items-center justify-between border-b border-border bg-background select-none px-3 font-mono shrink-0 cursor-default"
>
  {#if isMac}
    <!-- macOS Traffic Light controls on the Left (TUI-style) -->
    <div class="flex items-center gap-1.5 mr-4">
      <button
        onclick={handleClose}
        class="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:bg-[#ff3b30] flex items-center justify-center text-[8px] text-[#4c0002] font-bold transition-all focus:outline-none cursor-default"
        title="Close"
      >
        ×
      </button>
      <button
        onclick={handleMinimize}
        class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:bg-[#ffcc00] flex items-center justify-center text-[8px] text-[#5c3e00] font-bold transition-all focus:outline-none cursor-default"
        title="Minimize"
      >
        −
      </button>
      <button
        onclick={handleToggleMaximize}
        class="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-[#1aab29] hover:bg-[#34c759] flex items-center justify-center text-[8px] text-[#003d02] font-bold transition-all focus:outline-none cursor-default"
        title="Maximize"
      >
        +
      </button>
    </div>
  {/if}

  <!-- Center-Left: Branding and Workspace context -->
  <div data-tauri-drag-region class="flex items-center gap-2 text-tui-xs">
    <span class="text-primary font-bold">◆</span>
    <span class="font-bold uppercase tracking-tui">link-it</span>
    <span class="text-border">|</span>
    <span class="text-dim-foreground lowercase tracking-tui">
      {workspaceStore.active?.name || 'loading...'}
    </span>
  </div>

  {#if !isMac}
    <!-- Windows/Linux Window controls on the Right -->
    <div class="flex items-center gap-1">
      <button
        onclick={handleMinimize}
        class="w-6 h-5 flex items-center justify-center border border-border bg-box-bg hover:bg-muted text-dim-foreground font-mono text-tui-xs transition-colors focus:outline-none cursor-default"
        title="Minimizar"
      >
        _
      </button>
      <button
        onclick={handleToggleMaximize}
        class="w-6 h-5 flex items-center justify-center border border-border bg-box-bg hover:bg-muted text-dim-foreground font-mono text-tui-xs transition-colors focus:outline-none cursor-default"
        title={isMaximized ? 'Restaurar' : 'Maximizar'}
      >
        {isMaximized ? '⛶' : '▢'}
      </button>
      <button
        onclick={handleClose}
        class="w-6 h-5 flex items-center justify-center border border-border bg-box-bg hover:bg-destructive hover:text-destructive-foreground text-dim-foreground font-mono text-tui-xs transition-colors focus:outline-none cursor-default"
        title="Fechar"
      >
        ✕
      </button>
    </div>
  {/if}
</div>
