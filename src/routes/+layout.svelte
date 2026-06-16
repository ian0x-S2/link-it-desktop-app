<script lang="ts">
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';

  let { children } = $props();
</script>

<ModeWatcher />

<div
  class="w-screen h-screen overflow-hidden bg-background text-foreground flex items-center justify-center font-mono"
>
  <div
    class="w-[98vw] h-[98vh] max-w-full max-h-full border border-border bg-background flex flex-col overflow-hidden relative shadow-2xl"
  >
    <main class="flex-1 flex flex-col min-h-0 overflow-hidden">
      {@render children()}
    </main>
  </div>
</div>
