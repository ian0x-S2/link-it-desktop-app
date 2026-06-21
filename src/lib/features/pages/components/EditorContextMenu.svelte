<script lang="ts">
  import { onMount } from 'svelte';

  let {
    x,
    y,
    onSelect,
    onClose,
  }: {
    x: number;
    y: number;
    onSelect: (type: string) => void;
    onClose: () => void;
  } = $props();

  let menuElement = $state<HTMLDivElement | null>(null);

  // Calculate coordinates to keep the context menu in the visible viewport
  const adjustedX = $derived.by(() => {
    if (!menuElement) return x;
    const rect = menuElement.getBoundingClientRect();
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    return x + rect.width > screenWidth ? screenWidth - rect.width - 8 : x;
  });

  const adjustedY = $derived.by(() => {
    if (!menuElement) return y;
    const rect = menuElement.getBoundingClientRect();
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    return y + rect.height > screenHeight ? screenHeight - rect.height - 8 : y;
  });

  // Close when clicking outside
  function handleOutsideClick(event: MouseEvent) {
    if (menuElement && !menuElement.contains(event.target as Node)) {
      onClose();
    }
  }

  // Keyboard shortcut listener while menu is open
  function handleKeyDown(event: KeyboardEvent) {
    // Prevent typing into editor when context menu is open
    event.stopPropagation();

    const key = event.key.toLowerCase();
    switch (key) {
      case 'b':
        onSelect('bold');
        break;
      case 'i':
        onSelect('italic');
        break;
      case 'h':
        onSelect('highlight');
        break;
      case 'c':
        if (event.shiftKey) {
          onSelect('code-block');
        } else {
          onSelect('inline-code');
        }
        break;
      case '1':
        onSelect('h1');
        break;
      case '2':
        onSelect('h2');
        break;
      case '3':
        onSelect('h3');
        break;
      case 'l':
        onSelect('unordered-list');
        break;
      case 'o':
        onSelect('ordered-list');
        break;
      case 't':
        onSelect('table');
        break;
      case 'q':
        onSelect('callout');
        break;
      case '-':
        onSelect('hr');
        break;
      case 'escape':
        onClose();
        break;
    }
  }

  onMount(() => {
    // Add event listener with slight delay to avoid closing immediately on trigger click
    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleOutsideClick);
    };
  });

  const menuItems = [
    { label: 'Bold', key: 'b', type: 'bold' },
    { label: 'Italic', key: 'i', type: 'italic' },
    { label: 'Highlight', key: 'h', type: 'highlight' },
    { label: 'Inline Code', key: 'c', type: 'inline-code' },
    { label: 'Code Block', key: 'C', type: 'code-block' },
    { divider: true },
    { label: 'Heading 1', key: '1', type: 'h1' },
    { label: 'Heading 2', key: '2', type: 'h2' },
    { label: 'Heading 3', key: '3', type: 'h3' },
    { divider: true },
    { label: 'Unordered List', key: 'l', type: 'unordered-list' },
    { label: 'Ordered List', key: 'o', type: 'ordered-list' },
    { divider: true },
    { label: 'Table', key: 't', type: 'table' },
    { label: 'Callout', key: 'q', type: 'callout' },
    { label: 'Horizontal Line', key: '-', type: 'hr' },
  ];
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={menuElement}
  class="fixed z-50 bg-box-bg border border-border shadow-xl font-mono text-[11px] p-1 flex flex-col w-52 select-none"
  style="left: {adjustedX}px; top: {adjustedY}px;"
  oncontextmenu={(e) => e.preventDefault()}
>
  {#each menuItems as item, idx (idx)}
    {#if item.divider}
      <div class="border-t border-border my-1"></div>
    {:else if item.type}
      <button
        onclick={() => onSelect(item.type)}
        class="group flex items-center justify-between px-2.5 py-1 text-left hover:bg-primary hover:text-background text-foreground transition-colors cursor-pointer w-full rounded-none border-none bg-transparent"
      >
        <span>{item.label}</span>
        <span class="text-muted-foreground group-hover:text-background text-[10px]">[{item.key}]</span>
      </button>
    {/if}
  {/each}
</div>
