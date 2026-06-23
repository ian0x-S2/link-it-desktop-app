import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags, Tag, styleTags } from '@lezer/highlight';
import { Decoration, MatchDecorator, ViewPlugin, type ViewUpdate } from '@codemirror/view';

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
};

/**
 * Markdown extension to assign custom tags to lezer-markdown parser nodes.
 */
export const markdownMarkStyling = {
  props: [
    styleTags({
      HeadingMark: customTags.headingMark,
      ListMark: customTags.listMark,
      EmphasisMark: customTags.emphasisMark,
      QuoteMark: customTags.quoteMark,
      LinkMark: customTags.linkMark,
      CodeMark: customTags.codeMark,
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
  { tag: customTags.headingMark, color: 'var(--code-mark)', fontWeight: 'normal', opacity: 0.6 },
  { tag: customTags.listMark, color: 'var(--code-mark)', fontWeight: 'bold' },
  { tag: customTags.emphasisMark, color: 'var(--code-comment)', fontStyle: 'normal', opacity: 0.5 },
  { tag: customTags.quoteMark, color: 'var(--code-mark)', fontWeight: 'bold' },
  { tag: customTags.linkMark, color: 'var(--code-comment)', opacity: 0.5 },
  { tag: customTags.codeMark, color: 'var(--code-comment)', opacity: 0.6 },

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
    tag: tags.monospace, 
    fontFamily: 'var(--font-geist-mono, monospace)', 
    color: 'var(--code-keyword)', 
    backgroundColor: 'color-mix(in srgb, var(--code-keyword) 8%, transparent)', 
    padding: '0.1rem 0.25rem',
    borderRadius: '0.2rem'
  },
  { tag: tags.keyword, color: 'var(--code-keyword)', fontWeight: 'bold' },
  { tag: tags.string, color: 'var(--code-string)' },
  { tag: tags.number, color: 'var(--code-number)' },
  { tag: tags.bool, color: 'var(--code-number)' },
  { tag: tags.comment, color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: tags.operator, color: 'var(--code-comment)' },
  { tag: tags.variableName, color: 'var(--code-variable)' },
  { tag: tags.className, color: 'var(--code-function)' },
  { tag: tags.typeName, color: 'var(--code-function)' },
  { tag: tags.function(tags.variableName), color: 'var(--code-function)' },
]);

export const tuiMarkdownHighlight = syntaxHighlighting(tuiHighlightStyle);
export const tuiCodeFallbackHighlight = syntaxHighlighting(defaultHighlightStyle);

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
