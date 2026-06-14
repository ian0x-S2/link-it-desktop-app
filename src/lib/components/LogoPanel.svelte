<script lang="ts">
  const logo = ` _     _       _    ___ _   
          | |   (_)_ __ | | _|_ _| |_ 
          | |   | | '_ \\| |/ /| || __|
          | |___| | | | |   &lt; | || |_ 
          |_____|_|_| |_|_|\\_\\___|\\___|`;
</script>

<div
  class="relative p-4 flex flex-col bg-box-bg border border-border lg:flex-[1.5] min-h-27.5 lg:min-h-0 select-none font-mono"
>
  <span
    class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-1.75 left-2.5 bg-background text-primary"
    >Linkit</span
  >

  <div
    class="text-[9px] text-primary leading-tight font-bold whitespace-pre mb-2 overflow-x-auto"
  >
    {@html logo}
  </div>

  <p class="text-[10px] text-muted-foreground mt-1 leading-tight">
    Local-first link manager.
  </p>

  <div
    class="mt-auto pt-4 flex items-center justify-between border-t border-dashed border-border-dim text-[9px] font-bold shrink-0"
  >
    <div class="flex items-center gap-1">
      <span
        class="bg-primary text-background px-1 uppercase text-[8px] tracking-wider select-none font-bold"
        >PROMPT</span
      >
      <span class="text-foreground">v0.1.0-alpha</span>
    </div>
    <div class="text-success flex items-center gap-1">
      <span>✓</span>
      <span>Connected</span>
    </div>
  </div>
</div>
