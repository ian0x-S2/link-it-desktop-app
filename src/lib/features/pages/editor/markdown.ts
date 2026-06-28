import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle, syntaxTree } from '@codemirror/language';
import { tags, Tag, styleTags } from '@lezer/highlight';
import { Decoration, MatchDecorator, ViewPlugin, type ViewUpdate, EditorView, WidgetType } from '@codemirror/view';
import { RangeSetBuilder, StateField } from '@codemirror/state';

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
  // Headings — bold, foreground color
  { tag: tags.heading1, color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '1.8em' },
  { tag: tags.heading2, color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '1.45em' },
  { tag: tags.heading3, color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '1.25em' },
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
    
    container.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({
        selection: { anchor: this.nodeFrom + 3 },
        scrollIntoView: true
      });
      view.focus();
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

export const codeBlockBackgroundPlugin = StateField.define({
  create() { return Decoration.none; },
  update(decorations, tr) {
    const builder = new RangeSetBuilder<Decoration>();
    const state = tr.state;

    syntaxTree(state).iterate({
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
  },
  provide: (field) => EditorView.decorations.from(field),
});

class ImageWidget extends WidgetType {
  constructor(private url: string, private alt: string) {
    super();
  }

  eq(other: ImageWidget) {
    return other.url === this.url && other.alt === this.alt;
  }

  toDOM() {
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

    return wrapper;
  }
}

export const imagePreviewPlugin = StateField.define({
  create() { return Decoration.none; },
  update(decorations, tr) {
    const builder = new RangeSetBuilder<Decoration>();
    const state = tr.state;

    syntaxTree(state).iterate({
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
                widget: new ImageWidget(url, alt),
                inclusive: false
              });
              builder.add(node.from, node.to, deco);
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
                widget: new ImageWidget(url, alt),
                inclusive: false
              });
              builder.add(node.from, node.to, deco);
            }
          }
        }
      }
    });

    return builder.finish();
  },
  provide: (field) => EditorView.decorations.from(field),
});
