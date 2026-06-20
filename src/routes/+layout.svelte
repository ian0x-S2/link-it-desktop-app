<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  import TitleBar from '$lib/shared/components/TitleBar.svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { onMount } from 'svelte';

  let { children } = $props();
  let isMaximized = $state(false);
  let isTauri = $state(false);

  onMount(() => {
    isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (isTauri) {
      const appWindow = getCurrentWindow();
      
      // Get initial maximized state
      appWindow.isMaximized().then((val) => {
        isMaximized = val;
      });

      // Listen for window resize to update maximized state reactively
      let unlisten: (() => void) | undefined;
      appWindow.onResized(() => {
        appWindow.isMaximized().then((val) => {
          isMaximized = val;
        });
      }).then((u) => {
        unlisten = u;
      });

      return () => {
        if (unlisten) unlisten();
      };
    }
  });
</script>

<ModeWatcher />

<div
  class="w-screen h-screen overflow-hidden bg-background text-foreground flex items-center justify-center font-mono"
>
  <div
    class={isMaximized
      ? "w-full h-full border-none bg-background flex flex-col overflow-hidden relative"
      : "w-[99vw] h-[98vh] max-w-full max-h-full border border-border bg-background flex flex-col overflow-hidden relative shadow-xl"}
  >
    <TitleBar bind:isMaximized />
    <main class="flex-1 flex flex-col min-h-0 overflow-hidden">
      {@render children()}
    </main>
  </div>
</div>
