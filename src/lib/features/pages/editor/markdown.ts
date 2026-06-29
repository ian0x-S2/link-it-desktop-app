import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle, syntaxTree, ensureSyntaxTree } from '@codemirror/language';
import { tags, Tag, styleTags } from '@lezer/highlight';
import { Decoration, MatchDecorator, ViewPlugin, type ViewUpdate, EditorView, WidgetType, type DecorationSet } from '@codemirror/view';
import { RangeSetBuilder, StateField, type EditorState, type Text } from '@codemirror/state';
import { marked } from 'marked';
import type { SyntaxNode } from '@lezer/common';

/**
 * Helper to ensure a fully parsed syntax tree is available on initial mount,
 * preventing a startup flash where decorations/collapses take a couple seconds to render.
 */
function getParsedTree(state: EditorState) {
  return ensureSyntaxTree(state, state.doc.length, 100) || syntaxTree(state);
}

/**
 * Custom tags for Markdown syntax indicators (markers).
 */
export const customTags = {
  headingMark: Tag.define(),
  listMark: Tag.define(),
  emphasisMark: Tag.define(),
  quoteMark: Tag.define(),
  linkMark: Tag.define(),
  codeMark: Tag.define(),
  inlineCode: Tag.define(),
};

/**
 * Markdown extension to assign custom tags to lezer-markdown parser nodes.
 */
export const markdownMarkStyling = {
  props: [
    styleTags({
      HeaderMark: customTags.headingMark,
      HeadingMark: customTags.headingMark,
      ListMark: customTags.listMark,
      EmphasisMark: customTags.emphasisMark,
      QuoteMark: customTags.quoteMark,
      LinkMark: customTags.linkMark,
      CodeMark: customTags.codeMark,
      InlineCode: customTags.inlineCode,
    }),
  ],
};

/**
 * TUI-themed highlight style that maps to theme-specific CSS custom properties
 * so it automatically adapts to light/dark mode and all themes (Catppuccin, Everforest, Nord).
 */
export const tuiHighlightStyle = HighlightStyle.define([
  // Headings — bold, foreground color.
  // NOTE: Do NOT use fontSize here. CodeMirror maps click coordinates assuming uniform
  // line heights. Variable font-size makes heading lines visually taller than CodeMirror
  // expects, causing clicks to land on the wrong line ("click one line above" bug).
  // Visual hierarchy is achieved via paddingTop/paddingBottom on line decorations instead.
  { tag: tags.heading1, color: 'var(--color-foreground)', fontWeight: 'bold' },
  { tag: tags.heading2, color: 'var(--color-foreground)', fontWeight: 'bold' },
  { tag: tags.heading3, color: 'var(--color-foreground)', fontWeight: 'bold' },
  { tag: [tags.heading4, tags.heading5, tags.heading6], color: 'var(--color-foreground)', fontWeight: 'bold' },

  // Markdown indicators / markers — styled subtly to keep the document clean
  { tag: customTags.headingMark, color: 'var(--code-mark)', fontWeight: 'normal', opacity: 0.6, textDecoration: 'none' },
  { tag: customTags.listMark, color: 'var(--code-mark)', fontWeight: 'bold', textDecoration: 'none' },
  { tag: customTags.emphasisMark, color: 'var(--code-comment)', fontStyle: 'normal', opacity: 0.5, textDecoration: 'none' },
  { tag: customTags.quoteMark, color: 'var(--code-mark)', fontWeight: 'bold', textDecoration: 'none' },
  { tag: customTags.linkMark, color: 'var(--code-comment)', opacity: 0.5, textDecoration: 'none' },
  { tag: customTags.codeMark, color: 'var(--code-comment)', opacity: 0.6, textDecoration: 'none' },

  // Inline Formatting
  { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--color-foreground)' },
  { tag: tags.strong, fontWeight: 'bold', color: 'var(--color-foreground)' },
  { tag: tags.quote, color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: tags.contentSeparator, color: 'var(--color-border)' },

  // Links
  { tag: tags.link, color: 'var(--code-keyword)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--code-comment)' },

  // Fenced/Inline Code & Languages Syntax Highlights
  { 
    tag: customTags.inlineCode, 
    fontFamily: 'var(--font-editor, var(--font-geist-mono, monospace))', 
    color: 'var(--code-keyword)', 
    backgroundColor: 'var(--color-entry-alt-bg)', 
    padding: '0.1rem 0.25rem',
    borderRadius: '0.2rem'
  },
  { 
    tag: tags.monospace, 
    fontFamily: 'var(--font-editor, var(--font-geist-mono, monospace))',
  },
  { tag: [tags.keyword, tags.tagName, tags.modifier, tags.standard(tags.tagName)], color: 'var(--code-keyword)', fontWeight: 'bold' },
  { tag: [tags.string, tags.attributeName, tags.regexp, tags.special(tags.string)], color: 'var(--code-string)' },
  { tag: [tags.number, tags.bool, tags.integer, tags.float], color: 'var(--code-number)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: [tags.operator, tags.punctuation, tags.separator, tags.meta], color: 'var(--code-comment)' },
  { tag: [tags.variableName, tags.propertyName, tags.attributeValue, tags.definition(tags.variableName)], color: 'var(--code-variable)' },
  { tag: [tags.className, tags.typeName, tags.definition(tags.className), tags.definition(tags.typeName)], color: 'var(--code-function)' },
  { tag: tags.function(tags.variableName), color: 'var(--code-function)' },
]);

export const tuiMarkdownHighlight = syntaxHighlighting(tuiHighlightStyle);
export const tuiCodeFallbackHighlight = syntaxHighlighting(defaultHighlightStyle, { fallback: true });

const highlightDecorator = new MatchDecorator({
  regexp: /==([^=]+)==/g,
  decoration: () => Decoration.mark({ class: 'cm-tui-highlight' })
});

export const tuiHighlightPlugin = ViewPlugin.define(
  view => ({
    decorations: highlightDecorator.createDeco(view),
    update(update: ViewUpdate) {
      this.decorations = highlightDecorator.updateDeco(update, this.decorations);
    }
  }),
  {
    decorations: v => v.decorations
  }
);

class CodeBlockEditWidget extends WidgetType {
  constructor(private nodeFrom: number) {
    super();
  }

  eq(other: CodeBlockEditWidget) {
    return other.nodeFrom === this.nodeFrom;
  }

  toDOM(view: EditorView) {
    const container = document.createElement('button');
    container.className = 'cm-tui-codeblock-edit-btn';
    container.title = 'Edit this block';
    container.type = 'button';
    container.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    `;
    
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.focus();
      view.dispatch({
        selection: { anchor: this.nodeFrom + 3 },
        scrollIntoView: true
      });
    });

    return container;
  }
}

const hideDeco = Decoration.replace({ block: true });

const lineDecoFirst = Decoration.line({ class: 'cm-tui-codeblock-first-line' });
const lineDecoMiddle = Decoration.line({ class: 'cm-tui-codeblock-middle-line' });
const lineDecoLast = Decoration.line({ class: 'cm-tui-codeblock-last-line' });
const lineDecoSingle = Decoration.line({ class: 'cm-tui-codeblock-single-line' });

const lineDecoActiveFirst = Decoration.line({ class: 'cm-tui-codeblock-active-first-line' });
const lineDecoActiveMiddle = Decoration.line({ class: 'cm-tui-codeblock-active-middle-line' });
const lineDecoActiveLast = Decoration.line({ class: 'cm-tui-codeblock-active-last-line' });

// Heading line decorations — use padding (not font-size) so CodeMirror measures the
// actual rendered height and posAtCoords stays accurate.
const lineDecoH1 = Decoration.line({ class: 'cm-tui-heading-1' });
const lineDecoH2 = Decoration.line({ class: 'cm-tui-heading-2' });
const lineDecoH3 = Decoration.line({ class: 'cm-tui-heading-3' });
const lineDecoH4 = Decoration.line({ class: 'cm-tui-heading-4' });
const lineDecoH5 = Decoration.line({ class: 'cm-tui-heading-5' });
const lineDecoH6 = Decoration.line({ class: 'cm-tui-heading-6' });

function buildCodeBlockDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  getParsedTree(state).iterate({
    enter(node) {
      if (node.name === 'FencedCode') {
        const firstLine = state.doc.lineAt(node.from);
        const lastLine = state.doc.lineAt(node.to);

        if (lastLine.number <= firstLine.number) {
          for (let l = firstLine.number; l <= lastLine.number; l++) {
            const line = state.doc.line(l);
            builder.add(line.from, line.from, lineDecoActiveMiddle);
          }
          return;
        }

        const isSelectionInside = state.selection.ranges.some(
          range => range.from >= node.from && range.to <= node.to
        );

        if (!isSelectionInside) {
          builder.add(
            firstLine.from,
            firstLine.to,
            hideDeco
          );

          const firstCodeLineNum = firstLine.number + 1;
          const lastCodeLineNum = lastLine.number - 1;

          for (let l = firstCodeLineNum; l <= lastCodeLineNum; l++) {
            const line = state.doc.line(l);
            if (firstCodeLineNum === lastCodeLineNum) {
              builder.add(line.from, line.from, lineDecoSingle);
            } else if (l === firstCodeLineNum) {
              builder.add(line.from, line.from, lineDecoFirst);
            } else if (l === lastCodeLineNum) {
              builder.add(line.from, line.from, lineDecoLast);
            } else {
              builder.add(line.from, line.from, lineDecoMiddle);
            }

            if (l === firstCodeLineNum) {
              const widgetDeco = Decoration.widget({
                widget: new CodeBlockEditWidget(node.from),
                side: 1
              });
              builder.add(line.to, line.to, widgetDeco);
            }
          }

          builder.add(
            lastLine.from,
            lastLine.to,
            hideDeco
          );
        } else {
          for (let l = firstLine.number; l <= lastLine.number; l++) {
            const line = state.doc.line(l);
            if (l === firstLine.number) {
              builder.add(line.from, line.from, lineDecoActiveFirst);
            } else if (l === lastLine.number) {
              builder.add(line.from, line.from, lineDecoActiveLast);
            } else {
              builder.add(line.from, line.from, lineDecoActiveMiddle);
            }
          }
        }
      }
    }
  });

  return builder.finish();
}

export const codeBlockBackgroundPlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildCodeBlockDecorations(state);
  },
  update(decorations, tr) {
    return buildCodeBlockDecorations(tr.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

class ImageWidget extends WidgetType {
  constructor(private url: string, private alt: string, private from: number) {
    super();
  }

  eq(other: ImageWidget) {
    return other.url === this.url && other.alt === this.alt && other.from === this.from;
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-tui-image-preview-wrapper';

    const img = document.createElement('img');
    img.src = this.url;
    img.alt = this.alt || 'Image';
    img.className = 'cm-tui-image-preview';

    img.onerror = () => {
      img.style.display = 'none';
      const errorMsg = document.createElement('div');
      errorMsg.className = 'cm-tui-image-preview-error';
      errorMsg.textContent = `⚠️ Failed to load image: ${this.url}`;
      wrapper.appendChild(errorMsg);
    };

    wrapper.appendChild(img);

    if (this.alt) {
      const caption = document.createElement('div');
      caption.className = 'cm-tui-image-preview-caption';
      caption.textContent = this.alt;
      wrapper.appendChild(caption);
    }

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.focus();
      view.dispatch({
        selection: { anchor: this.from },
        scrollIntoView: true
      });
    });

    return wrapper;
  }
}

function buildImagePreviewDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  interface DecoRange {
    from: number;
    to: number;
    deco: Decoration;
  }
  const decoRanges: DecoRange[] = [];

  getParsedTree(state).iterate({
    enter(node) {
      if (node.name === 'Image') {
        const text = state.doc.sliceString(node.from, node.to);
        
        let url = '';
        let alt = '';

        // Match standard Markdown ![alt](url)
        const mdMatch = /!\[([\s\S]*?)\]\(([^)]+)\)/.exec(text);
        if (mdMatch) {
          alt = mdMatch[1];
          url = mdMatch[2];
        } else {
          // Match wiki link style ![[url]] or ![[url|alt]]
          const wikiMatch = /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(text);
          if (wikiMatch) {
            url = wikiMatch[1];
            alt = wikiMatch[2] || '';
          }
        }

        if (url) {
          const isSelectionInside = state.selection.ranges.some(
            range => range.from >= node.from && range.to <= node.to
          );

          if (!isSelectionInside) {
            const deco = Decoration.replace({
              widget: new ImageWidget(url, alt, node.from),
              inclusive: false
            });
            decoRanges.push({ from: node.from, to: node.to, deco });
          }
        }
      } else if (
        node.name === 'HTMLTag' || 
        node.name === 'HTMLBlock' || 
        node.name === 'HtmlTag' || 
        node.name === 'HtmlBlock'
      ) {
        const text = state.doc.sliceString(node.from, node.to);
        const htmlImgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i;
        const srcMatch = htmlImgRegex.exec(text);
        
        if (srcMatch) {
          const url = srcMatch[1];
          const altMatch = /alt=["']([^"']+)["']/i.exec(text);
          const alt = altMatch ? altMatch[1] : '';

          const isSelectionInside = state.selection.ranges.some(
            range => range.from >= node.from && range.to <= node.to
          );

          if (!isSelectionInside) {
            const deco = Decoration.replace({
              widget: new ImageWidget(url, alt, node.from),
              inclusive: false
            });
            decoRanges.push({ from: node.from, to: node.to, deco });
          }
        }
      }
    }
  });

  // Sort by 'from' position, and by 'to' position if 'from' is equal
  decoRanges.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  });

  // Add sorted, non-overlapping ranges to builder
  let lastTo = -1;
  for (const r of decoRanges) {
    if (r.from >= lastTo) {
      builder.add(r.from, r.to, r.deco);
      lastTo = r.to;
    }
  }

  return builder.finish();
}

export const imagePreviewPlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildImagePreviewDecorations(state);
  },
  update(decorations, tr) {
    return buildImagePreviewDecorations(tr.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

const collapseDeco = Decoration.replace({});

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-tui-bullet';
    span.textContent = '•';
    return span;
  }
}

function buildMarkdownCollapseDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  // Get all line numbers containing active cursor selections
  const activeLines = new Set<number>();
  for (const range of state.selection.ranges) {
    activeLines.add(state.doc.lineAt(range.from).number);
    activeLines.add(state.doc.lineAt(range.to).number);
  }

  interface DecoRange {
    from: number;
    to: number;
    deco: Decoration;
  }
  const decoRanges: DecoRange[] = [];

  // Collect syntax tree markers
  getParsedTree(state).iterate({
    enter(node) {
      const parent = node.node?.parent || (node as unknown as { parent?: { name: string } }).parent;
      const isInlineCodeMark = node.name === 'CodeMark' && parent?.name === 'InlineCode';

      if (
        node.name === 'HeaderMark' ||
        node.name === 'EmphasisMark' ||
        node.name === 'StrikethroughMark' ||
        isInlineCodeMark
      ) {
        const lineNum = state.doc.lineAt(node.from).number;
        if (!activeLines.has(lineNum)) {
          let toPos = node.to;
          // Also collapse the trailing space for heading marks to align heading text perfectly
          if (node.name === 'HeaderMark') {
            const nextChar = state.doc.sliceString(node.to, node.to + 1);
            if (nextChar === ' ') {
              toPos = Math.min(state.doc.length, node.to + 1);
            }
          }
          decoRanges.push({ from: node.from, to: toPos, deco: collapseDeco });
        }
      } else if (node.name === 'ListMark') {
        const lineNum = state.doc.lineAt(node.from).number;
        if (!activeLines.has(lineNum)) {
          const markText = state.doc.sliceString(node.from, node.to);
          if (['-', '*', '+'].includes(markText)) {
            const bulletDeco = Decoration.replace({
              widget: new BulletWidget(),
            });
            decoRanges.push({ from: node.from, to: node.to, deco: bulletDeco });
          }
        }
      }

      // Collect heading line decorations — padding-based, so they must also go through
      // decoRanges to be sorted before being added to the RangeSetBuilder.
      let headingLineDeco: Decoration | null = null;
      if (node.name === 'ATXHeading1' || node.name === 'SetextHeading1' || node.name === 'Heading1') {
        headingLineDeco = lineDecoH1;
      } else if (node.name === 'ATXHeading2' || node.name === 'SetextHeading2' || node.name === 'Heading2') {
        headingLineDeco = lineDecoH2;
      } else if (node.name === 'ATXHeading3' || node.name === 'Heading3') {
        headingLineDeco = lineDecoH3;
      } else if (node.name === 'ATXHeading4' || node.name === 'Heading4') {
        headingLineDeco = lineDecoH4;
      } else if (node.name === 'ATXHeading5' || node.name === 'Heading5') {
        headingLineDeco = lineDecoH5;
      } else if (node.name === 'ATXHeading6' || node.name === 'Heading6') {
        headingLineDeco = lineDecoH6;
      }
      if (headingLineDeco !== null) {
        const lineFrom = state.doc.lineAt(node.from).from;
        // Line decos use from===to — they sort before any replace deco at the same position
        decoRanges.push({ from: lineFrom, to: lineFrom, deco: headingLineDeco });
      }
    }
  });

  // Collect Highlight == markers on inactive lines
  for (let l = 1; l <= state.doc.lines; l++) {
    if (!activeLines.has(l)) {
      const line = state.doc.line(l);
      const text = line.text;
      
      let match;
      const regex = /==([^=]+)==/g;
      while ((match = regex.exec(text)) !== null) {
        const startIdx = line.from + match.index;
        // Hide first == marker
        decoRanges.push({ from: startIdx, to: startIdx + 2, deco: collapseDeco });
        // Hide last == marker
        const endIdx = startIdx + match[0].length - 2;
        decoRanges.push({ from: endIdx, to: endIdx + 2, deco: collapseDeco });
      }
    }
  }

  // Sort by 'from' index, and by 'to' index if 'from' is equal
  // (line decos have from===to so they sort before replace decos at the same position)
  decoRanges.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  });

  // Add sorted ranges to builder. Line decos (from===to) never overlap with replace decos.
  let lastTo = -1;
  for (const r of decoRanges) {
    if (r.from === r.to) {
      // Line decoration — always safe to add, cannot overlap
      builder.add(r.from, r.to, r.deco);
    } else if (r.from >= lastTo) {
      builder.add(r.from, r.to, r.deco);
      lastTo = r.to;
    }
  }

  return builder.finish();
}

export const markdownCollapsePlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildMarkdownCollapseDecorations(state);
  },
  update(decorations, tr) {
    return buildMarkdownCollapseDecorations(tr.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

// ─── Horizontal Rule Plugin ───────────────────────────────────────────────────

class HRWidget extends WidgetType {
  constructor(private from: number) {
    super();
  }

  eq(other: HRWidget) {
    return other.from === this.from;
  }

  toDOM(view: EditorView) {
    const el = document.createElement('div');
    el.className = 'cm-tui-hr-preview';
    
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.focus();
      view.dispatch({
        selection: { anchor: this.from },
        scrollIntoView: true
      });
    });

    return el;
  }
}

function buildHRDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  
  const activeLines = new Set<number>();
  for (const range of state.selection.ranges) {
    activeLines.add(state.doc.lineAt(range.from).number);
    activeLines.add(state.doc.lineAt(range.to).number);
  }

  getParsedTree(state).iterate({
    enter(node) {
      if (node.name === 'HorizontalRule') {
        const line = state.doc.lineAt(node.from);
        const lineNum = line.number;
        if (!activeLines.has(lineNum)) {
          const deco = Decoration.replace({
            widget: new HRWidget(line.from),
            block: true
          });
          builder.add(line.from, line.to, deco);
        }
      }
    }
  });

  return builder.finish();
}

export const horizontalRulePlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildHRDecorations(state);
  },
  update(decorations, tr) {
    return buildHRDecorations(tr.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

// ─── Table Preview Plugin (Obsidian-style) ────────────────────────────────────

interface ParsedTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right' | 'none')[];
  rows: string[][];
}

function parseMarkdownTable(text: string): ParsedTable | null {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return null;

  const parseCells = (line: string): string[] => {
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    return trimmed.split('|').map(c => c.trim());
  };

  const headers = parseCells(lines[0]);
  
  // Parse alignment row
  const separatorCells = parseCells(lines[1]);
  const isSeparator = separatorCells.every(c => /^:?-+:?$/.test(c.trim()));
  if (!isSeparator) return null;

  const alignments: ParsedTable['alignments'] = separatorCells.map(c => {
    const t = c.trim();
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':')) return 'right';
    if (t.startsWith(':')) return 'left';
    return 'none';
  });

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    rows.push(parseCells(lines[i]));
  }

  return { headers, alignments, rows };
}

function serializeMarkdownTable(table: ParsedTable): string {
  const alignRow = table.alignments.map(align => {
    if (align === 'left') return ':---';
    if (align === 'right') return '---:';
    if (align === 'center') return ':---:';
    return '---';
  });

  const headerLine = '| ' + table.headers.join(' | ') + ' |';
  const sepLine = '| ' + alignRow.join(' | ') + ' |';
  const bodyLines = table.rows.map(row => {
    const cells = Array.from({ length: table.headers.length }, (_, i) => row[i] ?? '');
    return '| ' + cells.join(' | ') + ' |';
  });

  return [headerLine, sepLine, ...bodyLines].join('\n');
}

function addRow(table: ParsedTable, rowIndex: number, position: 'above' | 'below'): ParsedTable {
  const newRow = Array(table.headers.length).fill('');
  const rows = [...table.rows];
  const insertIdx = position === 'above' ? rowIndex : rowIndex + 1;
  rows.splice(insertIdx, 0, newRow);
  return { ...table, rows };
}

function deleteRow(table: ParsedTable, rowIndex: number): ParsedTable {
  const rows = table.rows.filter((_, idx) => idx !== rowIndex);
  return { ...table, rows };
}

function addColumn(table: ParsedTable, colIndex: number, position: 'left' | 'right'): ParsedTable {
  const insertIdx = position === 'left' ? colIndex : colIndex + 1;
  const headers = [...table.headers];
  headers.splice(insertIdx, 0, 'Column');
  const alignments = [...table.alignments];
  alignments.splice(insertIdx, 0, 'none');
  const rows = table.rows.map(row => {
    const newRow = [...row];
    newRow.splice(insertIdx, 0, '');
    return newRow;
  });
  return { headers, alignments, rows };
}

function deleteColumn(table: ParsedTable, colIndex: number): ParsedTable {
  const headers = table.headers.filter((_, idx) => idx !== colIndex);
  const alignments = table.alignments.filter((_, idx) => idx !== colIndex);
  const rows = table.rows.map(row => row.filter((_, idx) => idx !== colIndex));
  return { headers, alignments, rows };
}

/** Convert inline markdown formatting to HTML for table cell preview */
function renderCellInlineMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Inline code (must be before other patterns to avoid conflicts)
  html = html.replace(/`([^`]+)`/g, '<code class="cm-tui-cell-code">$1</code>');
  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Strikethrough ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // Italic *text*  (must come after bold)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Highlight ==text==
  html = html.replace(/==(.+?)==/g, '<mark class="cm-tui-cell-highlight">$1</mark>');
  // Math $text$
  html = html.replace(/(?<!\$)\$([^$]+)\$(?!\$)/g, '<span class="cm-tui-cell-math">$1</span>');
  // Comment %%text%%
  html = html.replace(/%%(.+?)%%/g, '<span class="cm-tui-cell-comment">$1</span>');
  return html;
}

/** Check if text contains only plain content (no inline formatting) */
function hasInlineFormatting(text: string): boolean {
  return /\*\*.+?\*\*|(?<!\*)\*[^*]+\*(?!\*)|~~.+?~~|==.+?==|`.+?`|(?<!\$)\$[^$]+\$(?!\$)|%%.+?%%/.test(text);
}

/** Detect which inline formats are active in the given text range */
export function detectActiveFormats(cellText: string, selStart: number, selEnd: number): string[] {
  const active: string[] = [];
  const patterns: [RegExp, string][] = [
    [/\*\*(.+?)\*\*/g, 'bold'],
    [/(?<!\*)\*([^*]+)\*(?!\*)/g, 'italic'],
    [/~~(.+?)~~/g, 'strikethrough'],
    [/==(.+?)==/g, 'highlight'],
    [/`([^`]+)`/g, 'inline-code'],
    [/(?<!\$)\$([^$]+)\$(?!\$)/g, 'math'],
    [/%%(.+?)%%/g, 'comment'],
  ];
  for (const [regex, format] of patterns) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(cellText)) !== null) {
      // Check if selection overlaps with this match
      if (m.index < selEnd && m.index + m[0].length > selStart) {
        active.push(format);
        break;
      }
    }
  }
  return active;
}

/**
 * Set up a contentEditable element for inline markdown preview.
 * Shows rendered HTML when not focused, raw markdown when focused.
 */
function setupCellPreview(el: HTMLElement, rawText: string) {
  el.dataset.raw = rawText;
  if (hasInlineFormatting(rawText)) {
    el.innerHTML = renderCellInlineMarkdown(rawText);
  } else {
    el.textContent = rawText;
  }

  // Find the containing table cell (th or td) to lock its dimensions
  const getCell = () => el.tagName === 'SPAN' ? (el.parentElement as HTMLElement) : el;

  el.addEventListener('focus', () => {
    const cell = getCell();
    if (cell) {
      const rect = cell.getBoundingClientRect();
      cell.style.width = `${rect.width}px`;
      cell.style.height = `${rect.height}px`;
    }

    // Switch to raw text editing
    const raw = el.dataset.raw ?? '';
    el.textContent = raw;
    // Place cursor at end
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  el.addEventListener('blur', () => {
    // Save raw text and switch back to preview
    const raw = el.textContent ?? '';
    el.dataset.raw = raw;

    const cell = getCell();
    if (cell) {
      cell.style.width = '';
      cell.style.height = '';
    }

    if (hasInlineFormatting(raw)) {
      el.innerHTML = renderCellInlineMarkdown(raw);
    } else {
      el.textContent = raw;
    }
  });
}

/** Helper to find the actual end of a table by checking line contents for pipe separators */
function findTableEnd(doc: Text, from: number, to: number): number {
  const startLine = doc.lineAt(from);
  let toPos = to;
  if (toPos > from && doc.sliceString(toPos - 1, toPos) === '\n') {
    toPos--;
  }
  const endLine = doc.lineAt(toPos);
  let lastValidPos = startLine.to;

  for (let l = startLine.number; l <= endLine.number; l++) {
    const line = doc.line(l);
    const text = line.text.trim();
    
    // Header and delimiter row must contain '|'
    if (l === startLine.number || l === startLine.number + 1) {
      if (!text.includes('|')) break;
    } else {
      // Body rows must contain '|' unless empty
      if (text.length > 0 && !text.includes('|')) {
        break;
      }
    }
    lastValidPos = line.to;
  }
  return lastValidPos;
}

class TablePreviewWidget extends WidgetType {
  constructor(private content: string, private from: number) {
    super();
  }

  eq(other: TablePreviewWidget) {
    return other.content === this.content && other.from === this.from;
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-tui-table-preview';

    const parsed = parseMarkdownTable(this.content);
    if (!parsed) {
      wrapper.textContent = this.content;
      return wrapper;
    }

    const table = document.createElement('table');
    table.className = 'cm-tui-table';

    const updateTableDoc = (updated: ParsedTable) => {
      let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(this.from, 1);
      while (node && node.name !== 'Table') {
        node = node.parent;
      }
      if (!node) return;

      const startLine = view.state.doc.lineAt(node.from);
      const actualTo = findTableEnd(view.state.doc, node.from, node.to);
      const endLine = view.state.doc.lineAt(actualTo);
      const newText = serializeMarkdownTable(updated);

      view.dispatch({
        changes: {
          from: startLine.from,
          to: endLine.to,
          insert: newText
        },
        selection: { anchor: startLine.from }
      });
      view.focus();
    };

    const commitChanges = () => {
      const currentHeaders: string[] = [];
      table.querySelectorAll('thead th.cm-tui-table-th span').forEach(span => {
        const el = span as HTMLElement;
        // Read from data-raw if available (preview mode), otherwise textContent (editing mode)
        currentHeaders.push(el.dataset.raw ?? el.textContent ?? '');
      });

      const currentRows: string[][] = [];
      table.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.classList.contains('cm-tui-table-placeholder')) return;
        const rowCells: string[] = [];
        tr.querySelectorAll('td:not(.cm-tui-table-row-actions)').forEach(td => {
          const el = td as HTMLElement;
          rowCells.push(el.dataset.raw ?? el.textContent ?? '');
        });
        currentRows.push(rowCells);
      });

      const updated = {
        headers: currentHeaders,
        alignments: parsed.alignments,
        rows: currentRows
      };

      const newText = serializeMarkdownTable(updated);
      if (newText !== this.content) {
        updateTableDoc(updated);
      }
    };

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let i = 0; i < parsed.headers.length; i++) {
      const th = document.createElement('th');
      th.className = 'cm-tui-table-th';
      
      const textSpan = document.createElement('span');
      textSpan.contentEditable = 'true';
      setupCellPreview(textSpan, parsed.headers[i]);
      th.appendChild(textSpan);

      // Column action buttons
      const colActions = document.createElement('div');
      colActions.className = 'cm-tui-col-actions';

      const addLeft = document.createElement('button');
      addLeft.className = 'cm-tui-btn cm-tui-btn-col-add-left';
      addLeft.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      `;
      addLeft.title = 'Add column left';
      addLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = addColumn(parsed, i, 'left');
        updateTableDoc(updated);
      });

      const delCol = document.createElement('button');
      delCol.className = 'cm-tui-btn cm-tui-btn-col-del';
      delCol.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
      delCol.title = 'Delete column';
      delCol.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (parsed.headers.length <= 1) return;
        const updated = deleteColumn(parsed, i);
        updateTableDoc(updated);
      });

      const addRight = document.createElement('button');
      addRight.className = 'cm-tui-btn cm-tui-btn-col-add-right';
      addRight.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      `;
      addRight.title = 'Add column right';
      addRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = addColumn(parsed, i, 'right');
        updateTableDoc(updated);
      });

      colActions.appendChild(addLeft);
      colActions.appendChild(delCol);
      colActions.appendChild(addRight);
      th.appendChild(colActions);

      const align = parsed.alignments[i];
      if (align !== 'none') th.style.textAlign = align;
      headerRow.appendChild(th);
    }

    const actionTh = document.createElement('th');
    actionTh.className = 'cm-tui-table-action-header';
    headerRow.appendChild(actionTh);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    for (let r = 0; r < parsed.rows.length; r++) {
      const row = parsed.rows[r];
      const tr = document.createElement('tr');
      for (let i = 0; i < parsed.headers.length; i++) {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        setupCellPreview(td, row[i] ?? '');
        const align = parsed.alignments[i];
        if (align !== 'none') td.style.textAlign = align;
        tr.appendChild(td);
      }

      // Row action buttons cell
      const actionTd = document.createElement('td');
      actionTd.className = 'cm-tui-table-row-actions';

      const addAbove = document.createElement('button');
      addAbove.className = 'cm-tui-btn cm-tui-btn-row-add-above';
      addAbove.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      `;
      addAbove.title = 'Add row above';
      addAbove.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = addRow(parsed, r, 'above');
        updateTableDoc(updated);
      });

      const delRow = document.createElement('button');
      delRow.className = 'cm-tui-btn cm-tui-btn-row-del';
      delRow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
      delRow.title = 'Delete row';
      delRow.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = deleteRow(parsed, r);
        updateTableDoc(updated);
      });

      const addBelow = document.createElement('button');
      addBelow.className = 'cm-tui-btn cm-tui-btn-row-add-below';
      addBelow.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      `;
      addBelow.title = 'Add row below';
      addBelow.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = addRow(parsed, r, 'below');
        updateTableDoc(updated);
      });

      actionTd.appendChild(addAbove);
      actionTd.appendChild(delRow);
      actionTd.appendChild(addBelow);
      tr.appendChild(actionTd);

      tbody.appendChild(tr);
    }

    if (parsed.rows.length === 0) {
      const placeholderTr = document.createElement('tr');
      const placeholderTd = document.createElement('td');
      placeholderTd.colSpan = parsed.headers.length;
      placeholderTd.className = 'cm-tui-table-placeholder';
      placeholderTd.textContent = 'No rows. Click + Row to add.';
      placeholderTr.appendChild(placeholderTd);

      const actionTd = document.createElement('td');
      actionTd.className = 'cm-tui-table-row-actions';
      const addRowBtn = document.createElement('button');
      addRowBtn.className = 'cm-tui-btn';
      addRowBtn.textContent = '+ Row';
      addRowBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = addRow(parsed, 0, 'below');
        updateTableDoc(updated);
      });
      actionTd.appendChild(addRowBtn);
      placeholderTr.appendChild(actionTd);
      tbody.appendChild(placeholderTr);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);

    // Keyboard navigation within the table cells
    table.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.getAttribute('contenteditable') !== 'true') return;

      if (e.key === 'Tab') {
        e.preventDefault();
        const editables = Array.from(table.querySelectorAll('[contenteditable="true"]')) as HTMLElement[];
        const idx = editables.indexOf(target);
        const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
        if (nextIdx >= 0 && nextIdx < editables.length) {
          editables[nextIdx].focus();
        } else if (!e.shiftKey) {
          commitChanges();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        
        const cell = target.closest('td, th');
        if (!cell) return;
        
        const parentRow = cell.parentElement!;
        const colIndex = Array.from(parentRow.children).indexOf(cell);
        
        if (cell.tagName === 'TH') {
          const firstRow = table.querySelector('tbody tr');
          if (firstRow) {
            const nextCell = firstRow.children[colIndex] as HTMLElement;
            nextCell?.focus();
          }
        } else {
          const tbodyEl = table.querySelector('tbody');
          if (tbodyEl) {
            const rows = Array.from(tbodyEl.children);
            const rowIndex = rows.indexOf(parentRow);
            const nextRow = rows[rowIndex + 1];
            if (nextRow && !nextRow.classList.contains('cm-tui-table-placeholder')) {
              const nextCell = nextRow.children[colIndex] as HTMLElement;
              nextCell?.focus();
            } else {
              commitChanges();
            }
          }
        }
      }
    });

    // Commit changes on focus out from the table structure
    table.addEventListener('focusout', (e) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget && table.contains(relatedTarget)) {
        return;
      }
      commitChanges();
    });

    // Intercept mousedown to stop propagation to CodeMirror, letting the browser natively focus the cell
    wrapper.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    return wrapper;
  }
}

function buildTableDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  getParsedTree(state).iterate({
    enter(node) {
      if (node.name === 'Table') {
        const startLine = state.doc.lineAt(node.from);
        const actualTo = findTableEnd(state.doc, node.from, node.to);
        const endLine = state.doc.lineAt(actualTo);
        const content = state.doc.sliceString(startLine.from, endLine.to);
        const deco = Decoration.replace({
          widget: new TablePreviewWidget(content, startLine.from),
          block: true
        });
        builder.add(startLine.from, endLine.to, deco);
      }
    }
  });

  return builder.finish();
}

export const tablePreviewPlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildTableDecorations(state);
  },
  update(decorations, tr) {
    return buildTableDecorations(tr.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

// ─── Blockquote & Callout Preview Plugin ──────────────────────────────────────

class BlockquotePreviewWidget extends WidgetType {
  constructor(private content: string, private from: number) {
    super();
  }

  eq(other: BlockquotePreviewWidget) {
    return other.content === this.content && other.from === this.from;
  }

  toDOM(view: EditorView) {
    const parsed = parseBlockquoteOrCallout(this.content);
    const wrapper = document.createElement('div');

    if (parsed.isCallout) {
      wrapper.className = `cm-tui-callout cm-tui-callout-${parsed.type.toLowerCase()}`;
      
      const header = document.createElement('div');
      header.className = 'cm-tui-callout-title';
      
      let icon = '📝';
      if (['WARNING', 'CAUTION', 'BUG'].includes(parsed.type)) icon = '⚠️';
      else if (['TIP', 'IDEA', 'HINT'].includes(parsed.type)) icon = '💡';
      else if (['IMPORTANT', 'INFO', 'NOTE'].includes(parsed.type)) icon = 'ℹ️';
      else if (['SUCCESS', 'CHECK'].includes(parsed.type)) icon = '✅';
      else if (['QUESTION', 'HELP'].includes(parsed.type)) icon = '❓';
      
      header.innerHTML = `<span class="cm-tui-callout-icon">${icon}</span> <span class="cm-tui-callout-title-text">${parsed.title}</span>`;
      wrapper.appendChild(header);

      const body = document.createElement('div');
      body.className = 'cm-tui-callout-body';
      try {
        body.innerHTML = marked.parse(parsed.content) as string;
      } catch {
        body.textContent = parsed.content;
      }
      wrapper.appendChild(body);
    } else {
      wrapper.className = 'cm-tui-blockquote';
      try {
        wrapper.innerHTML = marked.parse(parsed.content) as string;
      } catch {
        wrapper.textContent = parsed.content;
      }
    }

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.focus();
      view.dispatch({
        selection: { anchor: this.from },
        scrollIntoView: true
      });
    });

    return wrapper;
  }
}

type ParsedBlockquote = 
  | { isCallout: true; type: string; title: string; content: string }
  | { isCallout: false; content: string };

function parseBlockquoteOrCallout(text: string): ParsedBlockquote {
  // Strip '>' and leading spaces from each line
  const lines = text.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      return trimmed.slice(1).trim();
    }
    return line;
  });

  const firstLine = lines[0] || '';
  const calloutMatch = /^\[!([a-zA-Z]+)\](.*)/.exec(firstLine);

  if (calloutMatch) {
    const type = calloutMatch[1].toUpperCase();
    const titleRest = calloutMatch[2].trim();
    const content = lines.slice(1).join('\n');
    return {
      isCallout: true,
      type,
      title: titleRest || type,
      content
    };
  }

  return {
    isCallout: false,
    content: lines.join('\n')
  };
}

function buildBlockquoteDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  getParsedTree(state).iterate({
    enter(node) {
      if (node.name === 'Blockquote') {
        const isSelectionInside = state.selection.ranges.some(
          range => range.from >= node.from && range.to <= node.to
        );

        if (!isSelectionInside) {
          const startLine = state.doc.lineAt(node.from);
          const endLine = state.doc.lineAt(node.to);
          const content = state.doc.sliceString(startLine.from, endLine.to);
          const deco = Decoration.replace({
            widget: new BlockquotePreviewWidget(content, startLine.from),
            block: true
          });
          builder.add(startLine.from, endLine.to, deco);
        }
      }
    }
  });

  return builder.finish();
}

export const blockquotePreviewPlugin = StateField.define<DecorationSet>({
  create(state) {
    return buildBlockquoteDecorations(state);
  },
  update(decorations, tr) {
    return buildBlockquoteDecorations(tr.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});
