import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * TUI-themed highlight style that maps to CSS custom properties
 * so it automatically adapts to light/dark mode and all themes.
 */
export const tuiHighlightStyle = HighlightStyle.define([
  // Headings — primary color, bold
  { tag: tags.heading1, color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '1.8em' },
  { tag: tags.heading2, color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '1.45em' },
  { tag: tags.heading3, color: 'var(--color-foreground)', fontWeight: 'bold', fontSize: '1.25em' },
  { tag: [tags.heading4, tags.heading5, tags.heading6], color: 'var(--color-foreground)', fontWeight: 'bold' },
  // Emphasis
  { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--color-foreground)' },
  { tag: tags.strong, fontWeight: 'bold', color: 'var(--color-foreground)' },
  // Links
  { tag: tags.link, color: 'var(--color-primary)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--color-dim-foreground)' },
  // Code
  { tag: tags.monospace, fontFamily: 'var(--font-geist-mono, monospace)', color: 'var(--color-foreground)' },
  { tag: tags.string, color: 'var(--color-success, #a6e3a1)' },
  // Marks / punctuation
  { tag: tags.processingInstruction, color: 'var(--color-muted-foreground)' },
  { tag: tags.meta, color: 'var(--color-muted-foreground)' },
  { tag: tags.comment, color: 'var(--color-dim-foreground)', fontStyle: 'italic' },
  // Lists
  { tag: tags.list, color: 'var(--color-foreground)' },
  // Quote
  { tag: tags.quote, color: 'var(--color-muted-foreground)', fontStyle: 'italic' },
  // HR / markup
  { tag: tags.contentSeparator, color: 'var(--color-border)' },
]);

export const tuiMarkdownHighlight = syntaxHighlighting(tuiHighlightStyle);
