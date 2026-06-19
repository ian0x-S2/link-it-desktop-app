<script lang="ts">
  import { EditorView } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { createEditorExtensions } from '../editor/index';
  import type { Page } from '../types/page';

  let {
    page,
    isSaving = false,
    onSave,
    onClose,
  }: {
    page: Page;
    isSaving?: boolean;
    onSave: (content: string, bannerImage?: string | null) => void;
    onClose: () => void;
  } = $props();

  let view: EditorView | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  // Local state for banner image
  // eslint-disable-next-line svelte/prefer-writable-derived
  let bannerImage = $state<string | null>(null);
  let showCoverMenu = $state(false);
  let customUrl = $state('');

  $effect(() => {
    bannerImage = page.bannerImage;
  });

  const PRESET_COVERS = [
    { name: 'TUI Grid', style: 'background-color: var(--color-box-bg); background-image: radial-gradient(var(--color-border) 1px, transparent 1px); background-size: 16px 16px;' },
    { name: 'Sunset Gradient', style: 'background: linear-gradient(135deg, #ff7e5f, #feb47b);' },
    { name: 'Aurora Gradient', style: 'background: linear-gradient(135deg, #02aab0, #00cdac);' },
    { name: 'Nordic Forest', style: 'background: linear-gradient(135deg, #11998e, #38ef7d);' },
    { name: 'Vaporwave', style: 'background: linear-gradient(135deg, #7f00ff, #e100ff);' },
    { name: 'Matrix Rain', style: 'background: linear-gradient(180deg, #0f2027, #203a43, #2c5364);' }
  ];

  function scheduleAutosave(content: string) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      onSave(content, bannerImage);
    }, 1000);
  }

  function mountEditor(node: HTMLElement) {
    const state = EditorState.create({
      doc: page.content,
      extensions: [
        ...createEditorExtensions(() => {
          if (view) onSave(view.state.doc.toString(), bannerImage);
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            scheduleAutosave(update.state.doc.toString());
          }
        }),
      ],
    });

    view = new EditorView({ state, parent: node });

    return {
      destroy() {
        if (saveTimer) clearTimeout(saveTimer);
        if (view) {
          onSave(view.state.doc.toString(), bannerImage);
          view.destroy();
          view = null;
        }
      },
    };
  }

  async function handleSelectCover(style: string) {
    bannerImage = style;
    showCoverMenu = false;
    if (view) {
      onSave(view.state.doc.toString(), style);
    } else {
      onSave(page.content, style);
    }
  }

  async function handleRemoveCover() {
    bannerImage = null;
    showCoverMenu = false;
    if (view) {
      onSave(view.state.doc.toString(), null);
    } else {
      onSave(page.content, null);
    }
  }

  async function handleCustomUrlSubmit() {
    if (!customUrl.trim()) return;
    const style = `background-image: url('${customUrl.trim()}'); background-size: cover; background-position: center;`;
    bannerImage = style;
    showCoverMenu = false;
    customUrl = '';
    if (view) {
      onSave(view.state.doc.toString(), style);
    } else {
      onSave(page.content, style);
    }
  }
</script>

<div class="flex flex-col h-full min-h-0 bg-box-bg">
  <!-- Editor toolbar -->
  <div
    class="flex items-center justify-between px-3 py-1.5 border-b border-border bg-box-bg shrink-0 z-10"
  >
    <div class="flex items-center gap-3">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        class="text-tui-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onclick={onClose}
      >
        ← back
      </span>
      <span class="text-tui-xs text-muted-foreground">|</span>
      <span class="text-tui-xs text-foreground font-bold truncate max-w-xs">{page.title || 'Untitled'}</span>
    </div>
    <div class="flex items-center gap-2 text-tui-xs text-muted-foreground">
      {#if isSaving}
        <span class="animate-pulse">[saving...]</span>
      {:else}
        <span>[saved]</span>
      {/if}
      <span class="text-dim-foreground">ctrl+s to save</span>
    </div>
  </div>

  <!-- Scrollable Canvas -->
  <div class="flex-1 min-h-0 overflow-y-auto flex flex-col items-center relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary">
    
    <!-- Banner Image area -->
    {#if bannerImage}
      <div 
        style={bannerImage}
        class="w-full h-40 shrink-0 relative group border-b border-border"
      >
        <!-- Banner Action Overlay on Hover -->
        <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-2">
          <button 
            onclick={() => showCoverMenu = !showCoverMenu}
            class="text-[10px] bg-background/80 hover:bg-background border border-border px-2 py-0.5 font-mono text-foreground font-bold shadow-sm cursor-pointer"
          >
            [change cover]
          </button>
          <button 
            onclick={handleRemoveCover}
            class="text-[10px] bg-background/80 hover:bg-background border border-border px-2 py-0.5 font-mono text-destructive font-bold shadow-sm cursor-pointer"
          >
            [remove]
          </button>
        </div>
      </div>
    {:else}
      <!-- Empty banner hover area to Add Cover -->
      <div class="w-full h-8 shrink-0 relative group flex items-center justify-end px-6">
        <button 
          onclick={() => showCoverMenu = !showCoverMenu}
          class="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] border border-border bg-box-bg hover:border-primary text-muted-foreground hover:text-primary px-2 py-0.5 font-mono font-bold cursor-pointer"
        >
          [+ add cover]
        </button>
      </div>
    {/if}

    <!-- Cover Selection Popover Menu -->
    {#if showCoverMenu}
      <div class="absolute top-12 right-6 bg-box-bg border border-border p-3 z-20 w-80 shadow-md font-mono text-xs flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-border pb-1">
          <span class="font-bold text-primary">SELECT COVER</span>
          <button onclick={() => showCoverMenu = false} class="text-muted-foreground hover:text-foreground font-bold cursor-pointer">[x]</button>
        </div>
        
        <!-- Presets grid -->
        <div class="grid grid-cols-2 gap-2">
          {#each PRESET_COVERS as cover (cover.name)}
            <button
              onclick={() => handleSelectCover(cover.style)}
              style={cover.style}
              class="h-10 border border-border hover:border-primary transition-colors cursor-pointer relative group flex items-end p-1"
            >
              <span class="text-[8px] bg-background/90 text-foreground px-1 truncate max-w-full font-mono">{cover.name}</span>
            </button>
          {/each}
        </div>

        <div class="border-t border-border pt-2 flex flex-col gap-1.5">
          <span class="text-[9px] text-muted-foreground uppercase">Or paste image URL:</span>
          <div class="flex gap-1">
            <input 
              bind:value={customUrl}
              placeholder="https://images.unsplash.com/..." 
              class="flex-1 bg-transparent border border-border px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary font-mono"
            />
            <button 
              onclick={handleCustomUrlSubmit}
              class="border border-primary bg-primary text-background font-bold px-2 py-0.5 cursor-pointer text-xs uppercase"
            >
              [ok]
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Notion Page Header Container (centered, max-width matching editor) -->
    <div class="w-full max-w-[80ch] flex flex-col">
       <!-- CodeMirror Mount Point -->
       <div use:mountEditor class="w-full"></div>
    </div>
  </div>
</div>

<style>
  :global(.cm-editor) {
    height: auto !important;
  }
  :global(.cm-scroller) {
    overflow: visible !important;
  }
</style>
