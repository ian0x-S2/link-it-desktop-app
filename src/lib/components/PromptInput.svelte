<script lang="ts">
  let {
    value = $bindable(""),
    onAdd,
    inputElement = $bindable(null),
  }: {
    value: string;
    onAdd: (url: string) => void;
    inputElement: HTMLInputElement | null;
  } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      const trimmed = value.trim();
      if (trimmed) {
        onAdd(trimmed);
        value = "";
      }
    }
  }
</script>

<div
  class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm mb-4 shrink-0"
>
  <span class="text-primary font-bold select-none">$</span>
  <input
    bind:this={inputElement}
    bind:value
    type="text"
    placeholder="Paste link to add..."
    class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs"
    onkeydown={handleKeydown}
  >
</div>
