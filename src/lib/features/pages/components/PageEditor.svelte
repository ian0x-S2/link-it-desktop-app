<script lang="ts">
  import { EditorView } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { createEditorExtensions } from '../editor/index';
  import type { Page } from '../types/page';
  import { marked, type Renderer } from 'marked';
  import hljs from 'highlight.js';
  import { Button } from '$lib/shared/components/ui/button';

  // Custom renderer: syntax-highlighted code blocks + ==highlight== support
  const customRenderer: Partial<Renderer> = {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : null;
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      const langLabel = lang ? `<span class="hljs-lang-label">${lang}</span>` : '';
      return `<pre><code class="hljs language-${lang ?? 'plaintext'}">${langLabel}${highlighted}</code></pre>`;
    },
  };

  marked.use({
    renderer: customRenderer,
    extensions: [
      {
        name: 'highlight',
        level: 'inline',
        start(src) {
          return src.indexOf('==');
        },
        tokenizer(src) {
          const rule = /^==([^=]+)==/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'highlight',
              raw: match[0],
              text: match[1],
              tokens: this.lexer.inlineTokens(match[1]),
            };
          }
        },
        renderer(token) {
          return `<mark>${this.parser.parseInline(token.tokens || [])}</mark>`;
        },
      },
      {
        name: 'bookRef',
        level: 'block',
        start(src) {
          return src.indexOf(':::book-ref');
        },
        tokenizer(src) {
          const rule = /^:::book-ref\r?\n([\s\S]*?)\r?\n:::/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'bookRef',
              raw: match[0],
              content: match[1],
            };
          }
        },
        renderer(token) {
          const lines = token.content.split('\n');
          const data: Record<string, string> = {};
          for (const line of lines) {
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) continue;
            const key = line.slice(0, colonIdx).trim();
            const value = line.slice(colonIdx + 1).trim();
            if (key) data[key] = value;
          }

          const title = data['title'] ?? 'Unknown Title';
          const author = data['author'] ?? '';
          const status = data['status'] ?? '';
          const rating = parseInt(data['rating'] ?? '0', 10) || 0;
          const pagesRead = parseInt(data['pagesRead'] ?? '0', 10) || 0;
          const pagesTotal = parseInt(data['pagesTotal'] ?? '0', 10) || 0;
          const imageUrl = data['imageUrl'] ?? '';
          const startedAt = data['startedAt'] ?? '';
          const finishedAt = data['finishedAt'] ?? '';
          const description = data['description'] ?? '';

          const stars = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—';
          const progress = pagesTotal > 0
            ? Math.min(100, Math.round((pagesRead / pagesTotal) * 100))
            : 0;

          const progressBar = (() => {
            const total = 16;
            const filled = Math.round((progress / 100) * total);
            return `[${'█'.repeat(filled)}${'░'.repeat(total - filled)}] ${progress}%`;
          })();

          const statusColors: Record<string, string> = {
            'Reading': 'var(--color-primary)',
            'Completed': 'var(--color-chart-2, #7ec8a0)',
            'Paused': 'var(--color-chart-4, #e5c07b)',
            'Abandoned': 'var(--color-destructive)',
            'Want to Read': 'var(--color-muted-foreground)',
          };
          const statusColor = statusColors[status] ?? 'var(--color-muted-foreground)';

          let descHtml = '';
          if (description) {
            descHtml = `<div style="color: var(--color-muted-foreground); font-size: 9px; font-style: italic; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">${description}</div>`;
          }

          const coverHtml = imageUrl
            ? `<img src="${imageUrl}" alt="cover" style="width: 52px; aspect-ratio: 3/4; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; align-self: flex-start; margin-top: 6px;" />`
            : `<div style="width: 52px; aspect-ratio: 3/4; border: 1px dashed var(--color-border); display: flex; align-items: center; justify-content: center; font-size: 8px; color: var(--color-muted-foreground); font-weight: bold; flex-shrink: 0; align-self: flex-start; margin-top: 6px; text-align: center; padding: 2px; line-height: 1.2;">[NO<br/>COVER]</div>`;

          let progressHtml = '';
          if (pagesTotal > 0) {
            progressHtml = `
              <div style="margin-top: 4px; color: var(--color-primary); font-size: 10px; font-weight: bold; white-space: pre;">${progressBar}</div>
              <div style="color: var(--color-muted-foreground); font-size: 9px; margin-top: 1px;">${pagesRead} / ${pagesTotal} pages</div>
            `;
          }

          let datesHtml = '';
          if (startedAt || finishedAt) {
            datesHtml = `<div style="display: flex; gap: 10px; margin-top: 4px; color: var(--color-muted-foreground); font-size: 9px;">`;
            if (startedAt) datesHtml += `<span>started: ${startedAt}</span>`;
            if (finishedAt) datesHtml += `<span>finished: ${finishedAt}</span>`;
            datesHtml += `</div>`;
          }

          return `
            <div class="book-ref-preview-widget" style="display: flex; align-items: stretch; gap: 12px; border: 1px solid var(--color-border); background: var(--color-box-bg, var(--color-background)); padding: 12px; margin: 12px 0; font-family: var(--font-mono, monospace); font-size: 11px; user-select: none; position: relative;">
              <div style="position: absolute; top: 0; left: 10px; transform: translateY(-50%); background: var(--color-box-bg, var(--color-background)); border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border); padding: 0 6px; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-primary);">// book ref</div>
              ${coverHtml}
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; margin-top: 6px; text-align: left;">
                <div style="font-weight: bold; font-size: 12px; color: var(--color-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                ${author ? `<div style="color: var(--color-muted-foreground); font-size: 10px;">by ${author}</div>` : ''}
                ${descHtml}
                <div style="border-top: 1px dashed var(--color-border); margin: 4px 0 3px 0;"></div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${statusColor}; flex-shrink: 0;"></span>
                  <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em;">${status || 'No Status'}</span>
                </div>
                <div style="color: var(--color-primary); font-size: 11px; letter-spacing: 1px;">${stars}</div>
                ${progressHtml}
                ${datesHtml}
              </div>
            </div>
          `;
        }
      },
    ],
  });
  import { browser } from '$app/environment';
  import { pageStore } from '../stores/page.svelte';
  import PropertiesPanel from './PropertiesPanel.svelte';
  import EditorContextMenu from './EditorContextMenu.svelte';
  import { themeStore } from '$lib/shared/stores/theme.svelte';

  let props = $props<{
    page: Page;
    isSaving?: boolean;
    onSave: (content: string, bannerImage?: string | null) => void;
    onClose: () => void;
  }>();

  let view: EditorView | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  // Local state for banner image initialized via closure to avoid compiler warnings
  let bannerImage = $state<string | null>((() => props.page.bannerImage)());
  let showCoverMenu = $state(false);
  let customUrl = $state('');

  let readOnly = $state(
    browser && localStorage.getItem('editor-readonly') === 'true' && !pageStore.forceEditModeNext
  );

  // Reset the force edit mode flag
  if (pageStore.forceEditModeNext) {
    pageStore.forceEditModeNext = false;
  }
  let currentContent = $state((() => props.page.content)());

  // Compile markdown safely
  const renderedHtml = $derived.by(() => {
    try {
      return marked.parse(currentContent) as string;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return '';
    }
  });



  // Save readOnly preference to localStorage
  $effect(() => {
    if (browser) {
      localStorage.setItem('editor-readonly', String(readOnly));
    }
  });

  // Keyboard event handler for Ctrl+E (or Cmd+E)
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      readOnly = !readOnly;
    }
  }

  function getImageUrl(style: string | null): string | null {
    if (!style) return null;
    const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? match[1] : null;
  }

  const PRESET_COVERS = $derived.by(() => {
    const currentTheme = themeStore.current;
    if (currentTheme === 'everforest') {
      return [
        {
          name: 'Green Forest',
          style: "background-image: url('/covers/everforest_1.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Mojave Minimal',
          style: "background-image: url('/covers/everforest_2.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Forest Stairs',
          style: "background-image: url('/covers/everforest_3.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Foggy Valley',
          style: "background-image: url('/covers/everforest_4.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Beach Nature',
          style: "background-image: url('/covers/everforest_5.webp'); background-size: cover; background-position: center;",
        },
      ];
    } else if (currentTheme === 'catppuccin') {
      return [
        {
          name: 'Abstract Swirls',
          style: "background-image: url('/covers/catppuccin_1.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Asian Village',
          style: "background-image: url('/covers/catppuccin_2.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Astronaut',
          style: "background-image: url('/covers/catppuccin_3.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Biking Sunset',
          style: "background-image: url('/covers/catppuccin_4.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Black Hole',
          style: "background-image: url('/covers/catppuccin_5.webp'); background-size: cover; background-position: center;",
        },
      ];
    } else {
      // Default to Nordic wallpapers (for 'nord' theme)
      return [
        {
          name: 'Abstract Nord',
          style: "background-image: url('/covers/nord_1.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Minimal Nord',
          style: "background-image: url('/covers/nord_2.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Arctic Landscape',
          style: "background-image: url('/covers/nord_3.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'At the Coffeshop',
          style: "background-image: url('/covers/nord_4.webp'); background-size: cover; background-position: center;",
        },
        {
          name: 'Ign Mountain',
          style: "background-image: url('/covers/nord_5.webp'); background-size: cover; background-position: center;",
        },
      ];
    }
  });

  function scheduleAutosave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (view) {
        const docText = view.state.doc.toString();
        props.onSave(docText, bannerImage);
      }
    }, 1000);
  }

  function mountEditor(node: HTMLElement) {
    const state = EditorState.create({
      doc: currentContent || props.page.content,
      extensions: [
        ...createEditorExtensions(() => {
          if (view) {
            props.onSave(view.state.doc.toString(), bannerImage);
          }
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            scheduleAutosave();
          }
        }),
      ],
    });

    view = new EditorView({ state, parent: node });

    return () => {
      if (saveTimer) clearTimeout(saveTimer);
      if (view) {
        const docText = view.state.doc.toString();
        currentContent = docText;
        props.onSave(docText, bannerImage);
        view.destroy();
        view = null;
      }
    };
  }

  async function handleSelectCover(style: string) {
    if (saveTimer) clearTimeout(saveTimer);
    bannerImage = style;
    showCoverMenu = false;
    if (view) {
      props.onSave(view.state.doc.toString(), style);
    } else {
      props.onSave(props.page.content, style);
    }
  }

  async function handleRemoveCover() {
    if (saveTimer) clearTimeout(saveTimer);
    bannerImage = null;
    showCoverMenu = false;
    if (view) {
      props.onSave(view.state.doc.toString(), null);
    } else {
      props.onSave(props.page.content, null);
    }
  }

  async function handleCustomUrlSubmit() {
    if (!customUrl.trim()) return;
    if (saveTimer) clearTimeout(saveTimer);
    const style = `background-image: url('${customUrl.trim()}'); background-size: cover; background-position: center;`;
    bannerImage = style;
    showCoverMenu = false;
    customUrl = '';
    if (view) {
      props.onSave(view.state.doc.toString(), style);
    } else {
      props.onSave(props.page.content, style);
    }
  }

  let contextMenuOpen = $state(false);
  let contextMenuX = $state(0);
  let contextMenuY = $state(0);

  function handleContextMenu(e: MouseEvent) {
    if (readOnly) return;
    e.preventDefault();
    contextMenuX = e.clientX;
    contextMenuY = e.clientY;
    contextMenuOpen = true;
  }

  function handleSelectFormat(type: string) {
    applyFormat(type);
    contextMenuOpen = false;
  }

  function applyFormat(type: string) {
    if (!view) return;
    const { state, dispatch } = view;
    const mainSelection = state.selection.main;
    const selectedText = state.sliceDoc(mainSelection.from, mainSelection.to);

    switch (type) {
      case 'bold': {
        const replacement = `**${selectedText || 'bold text'}**`;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + 2 + (selectedText ? selectedText.length : 9) }
        }));
        break;
      }
      case 'italic': {
        const replacement = `*${selectedText || 'italic text'}*`;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + 1 + (selectedText ? selectedText.length : 11) }
        }));
        break;
      }
      case 'highlight': {
        const replacement = `==${selectedText || 'highlighted text'}==`;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + 2 + (selectedText ? selectedText.length : 16) }
        }));
        break;
      }
      case 'inline-code': {
        const replacement = `\`${selectedText || 'code'}\``;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + 1 + (selectedText ? selectedText.length : 4) }
        }));
        break;
      }
      case 'code-block': {
        const replacement = `\n\`\`\`javascript\n${selectedText || '// code here'}\n\`\`\`\n`;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + 15 + (selectedText ? selectedText.length : 12) }
        }));
        break;
      }
      case 'h1':
      case 'h2':
      case 'h3': {
        const line = state.doc.lineAt(mainSelection.from);
        const prefix = type === 'h1' ? '# ' : type === 'h2' ? '## ' : '### ';
        dispatch(state.update({
          changes: { from: line.from, to: line.from, insert: prefix },
          selection: { anchor: mainSelection.from + prefix.length }
        }));
        break;
      }
      case 'unordered-list': {
        const line = state.doc.lineAt(mainSelection.from);
        dispatch(state.update({
          changes: { from: line.from, to: line.from, insert: '- ' },
          selection: { anchor: mainSelection.from + 2 }
        }));
        break;
      }
      case 'ordered-list': {
        const line = state.doc.lineAt(mainSelection.from);
        dispatch(state.update({
          changes: { from: line.from, to: line.from, insert: '1. ' },
          selection: { anchor: mainSelection.from + 3 }
        }));
        break;
      }
      case 'table': {
        const replacement = `\n| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n`;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + replacement.length }
        }));
        break;
      }
      case 'callout': {
        const line = state.doc.lineAt(mainSelection.from);
        dispatch(state.update({
          changes: { from: line.from, to: line.from, insert: '> [!NOTE]\n> ' },
          selection: { anchor: mainSelection.from + 13 }
        }));
        break;
      }
      case 'hr': {
        const replacement = `\n---\n`;
        dispatch(state.update({
          changes: { from: mainSelection.from, to: mainSelection.to, insert: replacement },
          selection: { anchor: mainSelection.from + replacement.length }
        }));
        break;
      }
    }
    view.focus();
  }

  function handleClose() {
    if (view) {
      if (saveTimer) clearTimeout(saveTimer);
      const docText = view.state.doc.toString();
      props.onSave(docText, bannerImage);
      view.destroy();
      view = null;
    }
    props.onClose();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

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
        onclick={handleClose}
      >
        ← back
      </span>
      <span class="text-tui-xs text-muted-foreground">|</span>
      <span class="text-tui-xs text-foreground font-bold truncate max-w-xs"
        >{props.page.title || 'Untitled'}</span
      >
    </div>
    <div class="flex items-center gap-3 text-tui-xs text-muted-foreground select-none">
      <!-- Status message -->
      <div class="flex items-center gap-2">
        {#if pageStore.error}
          <span class="text-destructive font-bold">[{pageStore.error}]</span>
        {/if}
        {#if !readOnly}
          {#if props.isSaving}
            <span class="animate-pulse">[saving...]</span>
          {:else}
            <span>[saved]</span>
          {/if}
          <span class="text-dim-foreground">ctrl+s to save</span>
        {:else}
          <span class="text-dim-foreground">[read-only]</span>
        {/if}
      </div>

      <!-- Edit / Preview toggle buttons -->
      <div class="flex items-center gap-1.5 border-l border-border pl-3 ml-1">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => (readOnly = false)}
          class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {!readOnly
            ? 'bg-primary text-background font-bold'
            : 'hover:text-foreground text-muted-foreground'}"
        >
          [edit]
        </span>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          onclick={() => (readOnly = true)}
          class="px-1.5 py-0.5 cursor-pointer transition-colors uppercase tracking-tui-wide text-tui-xs {readOnly
            ? 'bg-primary text-background font-bold'
            : 'hover:text-foreground text-muted-foreground'}"
        >
          [preview]
        </span>
      </div>
    </div>
  </div>

  <!-- Scrollable Canvas -->
  <div
    class="flex-1 min-h-0 overflow-y-auto flex flex-col items-center relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-box-bg [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary"
  >
    <!-- Banner Image area -->
    {#if bannerImage}
      <div style={bannerImage} class="w-full h-40 shrink-0 relative group border-b border-border">
        <!-- Banner Action Overlay on Hover -->
        <div
          class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-2"
        >
          <Button
            onclick={() => (showCoverMenu = !showCoverMenu)}
            variant="outline"
            size="xs"
            class="text-tui-xs bg-background/80 hover:bg-background border-border px-2 py-0.5 font-mono text-foreground font-bold shadow-sm cursor-pointer h-auto"
          >
            [change cover]
          </Button>
          <Button
            onclick={handleRemoveCover}
            variant="outline"
            size="xs"
            class="text-tui-xs bg-background/80 hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-destructive dark:hover:text-destructive-foreground border-border px-2 py-0.5 font-mono text-destructive font-bold shadow-sm cursor-pointer h-auto"
          >
            [remove]
          </Button>
        </div>
      </div>
    {:else}
      <!-- Empty banner hover area to Add Cover -->
      <div class="w-full h-8 shrink-0 relative group flex items-center justify-end px-6">
        <Button
          onclick={() => (showCoverMenu = !showCoverMenu)}
          variant="outline"
          size="xs"
          class="opacity-0 group-hover:opacity-100 transition-opacity text-tui-xs border-border bg-box-bg hover:border-primary text-muted-foreground hover:text-primary px-2 py-0.5 font-mono font-bold cursor-pointer h-auto"
        >
          [+ add cover]
        </Button>
      </div>
    {/if}

    <!-- Cover Selection Popover Menu -->
    <div
      class="absolute top-12 right-6 bg-box-bg border border-border p-3 z-20 w-80 shadow-md font-mono text-xs flex flex-col gap-3 transition-all duration-150 {showCoverMenu ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}"
    >
      <div class="flex items-center justify-between border-b border-border pb-1">
        <span class="font-bold text-primary">SELECT COVER</span>
        <Button
          onclick={() => (showCoverMenu = false)}
          variant="ghost"
          size="xs"
          class="text-muted-foreground hover:text-foreground font-bold cursor-pointer h-auto p-0"
        >
          [x]
        </Button>
      </div>

      <!-- Presets grid -->
      <div class="grid grid-cols-2 gap-2">
        {#each PRESET_COVERS as cover (cover.name)}
          <Button
            onclick={() => handleSelectCover(cover.style)}
            variant="outline"
            class="h-10 w-full rounded-none border border-border hover:border-primary transition-colors cursor-pointer relative overflow-hidden group flex items-end justify-start p-1 bg-muted/10"
          >
            {#if getImageUrl(cover.style)}
              <img
                src={getImageUrl(cover.style)}
                alt={cover.name}
                loading="lazy"
                class="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none"
              />
            {:else}
              <div style={cover.style} class="absolute inset-0 w-full h-full pointer-events-none"></div>
            {/if}
            <span
              class="relative z-10 text-[8px] bg-background/90 text-foreground px-1 truncate max-w-full font-mono normal-case text-ellipsis"
            >
              {cover.name}
            </span>
          </Button>
        {/each}
      </div>

      <div class="border-t border-border pt-2 flex flex-col gap-1.5">
        <span class="text-tui-2xs text-muted-foreground uppercase">Or paste image URL:</span>
        <div class="flex gap-1">
          <input
            bind:value={customUrl}
            placeholder="https://images.unsplash.com/..."
            class="flex-1 bg-transparent border border-border px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary font-mono"
          />
          <Button
            onclick={handleCustomUrlSubmit}
            variant="default"
            size="xs"
            class="border border-primary bg-primary text-background font-bold px-2 py-0.5 cursor-pointer text-xs uppercase h-auto"
          >
            [ok]
          </Button>
        </div>
      </div>
    </div>

    <!-- Notion Page Header Container (centered, max-width matching editor) -->
    <div class="w-full max-w-[80ch] flex flex-col">
      <div class="px-6 pt-4">
        <PropertiesPanel pageId={props.page.id} />
      </div>

      {#if readOnly}
        <div class="markdown-preview w-full py-8 px-6">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html renderedHtml}
        </div>
      {:else}
        <!-- CodeMirror Mount Point -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          {@attach mountEditor}
          class="w-full"
          oncontextmenu={handleContextMenu}
        ></div>
      {/if}
    </div>
  </div>
</div>

{#if contextMenuOpen}
  <EditorContextMenu
    x={contextMenuX}
    y={contextMenuY}
    onSelect={handleSelectFormat}
    onClose={() => (contextMenuOpen = false)}
  />
{/if}

<style>
  :global(.cm-editor) {
    height: auto !important;
  }
  :global(.cm-scroller) {
    overflow: visible !important;
  }
</style>
