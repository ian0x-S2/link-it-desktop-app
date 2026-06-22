<script lang="ts">
  let {
    onSubmit,
  }: {
    onSubmit: (content: string) => Promise<void>;
  } = $props();

  let input = $state('');
  let isSubmitting = $state(false);
  let error = $state('');

  async function handleSubmit() {
    const content = input.trim();
    if (!content) return;
    isSubmitting = true;
    error = '';
    try {
      await onSubmit(content);
      input = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to capture idea.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      input = '';
      (e.target as HTMLElement)?.blur();
    }
  }

  function focusOnMount(node: HTMLTextAreaElement) {
    requestAnimationFrame(() => {
      node.focus();
    });
  }
</script>

<div class="shrink-0 border-b border-border bg-box-bg px-3 py-2 h-15.5 flex items-center">
  <div class="flex items-start gap-2 w-full">
    <span class="text-primary font-bold text-tui-xs pt-1 select-none shrink-0">[*]</span>
    <textarea
      id="quick-capture-idea-input"
      bind:value={input}
      onkeydown={handleKeydown}
      placeholder="Capture a quick idea... (Enter to save, Shift+Enter for newline)"
      rows={2}
      disabled={isSubmitting}
      {@attach focusOnMount}
      class="flex-1 bg-transparent text-foreground placeholder:text-dim-foreground font-mono text-xs resize-none outline-none border-none focus:outline-none leading-relaxed disabled:opacity-50"
    ></textarea>
    {#if input.trim()}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="text-tui-xs text-primary hover:text-foreground cursor-pointer font-bold transition-colors pt-1 shrink-0"
        onclick={handleSubmit}>{isSubmitting ? '[...]' : '[add]'}</span
      >
    {/if}
  </div>
  {#if error}
    <p class="text-tui-xs text-destructive mt-1 pl-5">{error}</p>
  {/if}
</div>
