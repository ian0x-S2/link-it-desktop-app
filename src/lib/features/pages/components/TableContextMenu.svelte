<script lang="ts">
  import { onMount } from 'svelte';

  let {
    x,
    y,
    activeFormats = [],
    onSelect,
    onClose,
  }: {
    x: number;
    y: number;
    activeFormats?: string[];
    onSelect: (type: string) => void;
    onClose: () => void;
  } = $props();

  let menuElement = $state<HTMLDivElement | null>(null);

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

  function handleOutsideClick(event: MouseEvent) {
    if (menuElement && !menuElement.contains(event.target as Node)) {
      onClose();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    const key = event.key.toLowerCase();
    switch (key) {
      case 'b':
        onSelect('bold');
        break;
      case 'i':
        onSelect('italic');
        break;
      case 's':
        onSelect('strikethrough');
        break;
      case 'h':
        onSelect('highlight');
        break;
      case 'c':
        onSelect('inline-code');
        break;
      case 'm':
        onSelect('math');
        break;
      case '%':
        onSelect('comment');
        break;
      case 'x':
        onSelect('clear-formatting');
        break;
      case 'escape':
        onClose();
        break;
    }
  }

  onMount(() => {
    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleOutsideClick);
    };
  });

  interface MenuItem {
    label: string;
    key: string;
    type: string;
    icon: string;
    iconClass?: string;
    divider?: never;
  }
  interface DividerItem {
    divider: true;
    label?: never;
    key?: never;
    type?: never;
    icon?: never;
    iconClass?: never;
  }
  type MenuEntry = MenuItem | DividerItem;

  const menuItems: MenuEntry[] = [
    { label: 'Bold', key: 'b', type: 'bold', icon: 'B', iconClass: 'font-bold' },
    { label: 'Italic', key: 'i', type: 'italic', icon: 'I', iconClass: 'italic' },
    {
      label: 'Strikethrough',
      key: 's',
      type: 'strikethrough',
      icon: 'S',
      iconClass: 'line-through',
    },
    { label: 'Highlight', key: 'h', type: 'highlight', icon: '▓' },
    { divider: true },
    { label: 'Code', key: 'c', type: 'inline-code', icon: '</>' },
    { label: 'Math', key: 'm', type: 'math', icon: '∑' },
    { label: 'Comment', key: '%', type: 'comment', icon: '%' },
    { divider: true },
    { label: 'Clear formatting', key: 'x', type: 'clear-formatting', icon: '✕' },
  ];
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={menuElement}
  class="fixed z-50 bg-box-bg border border-border shadow-xl font-mono text-tui-sm p-1 flex flex-col w-52 select-none"
  style="left: {adjustedX}px; top: {adjustedY}px;"
  oncontextmenu={(e) => e.preventDefault()}
>
  {#each menuItems as item, idx (idx)}
    {#if item.divider}
      <div class="border-t border-border my-1"></div>
    {:else if item.type}
      <button
        onmousedown={(e) => {
          e.preventDefault();
          onSelect(item.type);
        }}
        class="group flex items-center gap-2 px-2.5 py-1 text-left hover:bg-primary hover:text-primary-foreground text-foreground transition-colors cursor-pointer w-full rounded-none border-none bg-transparent"
      >
        <span
          class="w-4 shrink-0 inline-flex items-center justify-center text-tui-xs {item.iconClass ??
            ''}">{item.icon}</span
        >
        <span class="flex-1">{item.label}</span>
        {#if activeFormats.includes(item.type)}
          <span class="text-primary group-hover:text-primary-foreground text-tui-xs">✓</span>
        {/if}
        <span class="text-muted-foreground group-hover:text-primary-foreground text-tui-xs"
          >[{item.key}]</span
        >
      </button>
    {/if}
  {/each}
</div>
