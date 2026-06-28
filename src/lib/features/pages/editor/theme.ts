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
      fontFamily: 'var(--font-editor, var(--font-geist-mono, monospace))',
      fontSize: '15px',
      lineHeight: '1.8',
      '-webkit-font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
      textRendering: 'optimizeLegibility',
      fontVariantLigatures: 'none',
      fontFeatureSettings: '"liga" 0, "clig" 0, "calt" 0',
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
    // Highlight syntax style mapping
    '.cm-tui-highlight': {
      backgroundColor: 'var(--code-mark)',
      color: 'var(--background)',
      padding: '0.1rem 0.25rem',
      borderRadius: '0.2rem',
      textDecoration: 'none !important',
    },
    // Inactive code block card styling (Obsidian style)
    '.cm-tui-codeblock-first-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
      borderTop: '1px solid var(--color-border)',
      borderTopLeftRadius: 'var(--radius-md, 0.35rem)',
      borderTopRightRadius: 'var(--radius-md, 0.35rem)',
      paddingTop: '0.75rem',
      position: 'relative',
    },
    '.cm-tui-codeblock-middle-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
    },
    '.cm-tui-codeblock-last-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)',
      borderBottomLeftRadius: 'var(--radius-md, 0.35rem)',
      borderBottomRightRadius: 'var(--radius-md, 0.35rem)',
      paddingBottom: '0.75rem',
    },
    '.cm-tui-codeblock-single-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
      borderTop: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)',
      borderTopLeftRadius: 'var(--radius-md, 0.35rem)',
      borderTopRightRadius: 'var(--radius-md, 0.35rem)',
      borderBottomLeftRadius: 'var(--radius-md, 0.35rem)',
      borderBottomRightRadius: 'var(--radius-md, 0.35rem)',
      paddingTop: '0.75rem',
      paddingBottom: '0.75rem',
      position: 'relative',
    },

    // Active code block card styling (when cursor is inside, showing fences)
    '.cm-tui-codeblock-active-first-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
      borderTop: '1px dashed var(--color-border)',
      borderTopLeftRadius: 'var(--radius-md, 0.35rem)',
      borderTopRightRadius: 'var(--radius-md, 0.35rem)',
      paddingTop: '0.5rem',
    },
    '.cm-tui-codeblock-active-middle-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
    },
    '.cm-tui-codeblock-active-last-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      marginLeft: '-1.5rem',
      marginRight: '-1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
      borderBottom: '1px dashed var(--color-border)',
      borderBottomLeftRadius: 'var(--radius-md, 0.35rem)',
      borderBottomRightRadius: 'var(--radius-md, 0.35rem)',
      paddingBottom: '0.5rem',
    },

    // Edit button widget
    '.cm-tui-codeblock-edit-btn': {
      position: 'absolute',
      top: '0.6rem',
      right: '1rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      backgroundColor: 'color-mix(in srgb, var(--color-border) 60%, transparent)',
      color: 'var(--color-foreground)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm, 0.2rem)',
      cursor: 'pointer',
      zIndex: '10',
      transition: 'all 0.1s ease',
      padding: '0',
    },
    '.cm-tui-codeblock-edit-btn:hover': {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-primary-foreground)',
      borderColor: 'var(--color-primary)',
    },
    
    // Image preview widget
    '.cm-tui-image-preview-wrapper': {
      display: 'block',
      margin: '0.75rem 0',
      maxWidth: '100%',
    },
    '.cm-tui-image-preview': {
      maxWidth: '100%',
      maxHeight: '400px',
      borderRadius: 'var(--radius-md, 0.35rem)',
      border: '1px solid var(--color-border)',
      display: 'block',
    },
    '.cm-tui-image-preview-caption': {
      fontSize: 'var(--font-tui-2xs, 9px)',
      color: 'var(--color-muted-foreground)',
      marginTop: '0.25rem',
      textAlign: 'center',
    },
    '.cm-tui-image-preview-error': {
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: 'var(--font-tui-xs, 11px)',
      color: 'var(--color-destructive)',
      border: '1px dashed var(--color-destructive)',
      padding: '0.5rem',
      borderRadius: 'var(--radius-sm, 0.2rem)',
      backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
    },
  },
  { dark: false },
);
