import { EditorView } from '@codemirror/view';

/**
 * TUI-themed editor base theme.
 * Uses CSS custom properties from app.css for theme consistency.
 */
export const tuiEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: 'transparent',
      color: 'var(--color-foreground)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      fontSize: '15px',
      lineHeight: '1.8',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
      // Custom scrollbar matching app.css style
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--color-border) transparent',
    },
    '.cm-content': {
      padding: '2rem 1.5rem',
      caretColor: 'var(--color-primary)',
      maxWidth: '80ch',
    },
    '.cm-line': {
      padding: '0',
    },
    // Cursor
    '.cm-cursor': {
      backgroundColor: 'var(--code-keyword)',
      width: '0.55em !important',
      borderLeft: 'none !important',
      opacity: '0.6',
    },
    '.cm-dropCursor': {
      borderLeftColor: 'var(--code-keyword)',
      borderLeftWidth: '2px',
    },
    // Selection
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'color-mix(in srgb, var(--code-keyword) 20%, transparent)',
    },
    // Active line
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in srgb, var(--code-keyword) 5%, transparent)',
    },
    // Gutters (line numbers)
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid var(--color-border)',
      color: 'var(--color-dim-foreground)',
      minWidth: '2.5rem',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      fontWeight: 'bold',
    },
    // Tooltip / autocomplete
    '.cm-tooltip': {
      backgroundColor: 'var(--color-box-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: '0',
      fontFamily: 'var(--font-geist-mono, monospace)',
      fontSize: '12px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-background)',
    },
    // Search
    '.cm-searchMatch': {
      backgroundColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
      outline: '1px solid var(--color-primary)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'color-mix(in srgb, var(--color-primary) 50%, transparent)',
    },
  },
  { dark: false },
);
