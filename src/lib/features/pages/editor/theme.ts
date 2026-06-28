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
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
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
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
    },
    '.cm-tui-codeblock-last-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
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
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
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
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
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
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
      boxSizing: 'border-box',
      borderLeft: '1px solid var(--color-border)',
      borderRight: '1px solid var(--color-border)',
    },
    '.cm-tui-codeblock-active-last-line': {
      backgroundColor: 'var(--color-entry-alt-bg)',
      paddingLeft: '1.25rem',
      paddingRight: '1.25rem',
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
      padding: '0.75rem 0',
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

    // Blockquotes & Callouts
    '.cm-tui-blockquote': {
      borderLeft: '4px solid var(--code-keyword)',
      color: 'var(--code-comment)',
      fontStyle: 'italic',
      padding: '0.75rem 0 0.75rem 1rem',
      display: 'block',
    },
    '.cm-tui-callout': {
      borderLeft: '4px solid var(--color-border)',
      backgroundColor: 'var(--color-entry-alt-bg)',
      padding: '1.25rem 1rem',
      borderRadius: 'var(--radius-sm, 0.2rem)',
      display: 'block',
    },
    '.cm-tui-callout-title': {
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.95em',
      marginBottom: '0.25rem',
      textTransform: 'uppercase',
    },
    '.cm-tui-callout-body': {
      fontSize: '0.9em',
      color: 'var(--color-foreground)',
    },
    '.cm-tui-callout-note': {
      borderLeftColor: 'var(--color-primary)',
    },
    '.cm-tui-callout-note .cm-tui-callout-title': {
      color: 'var(--color-primary)',
    },
    '.cm-tui-callout-warning': {
      borderLeftColor: 'var(--color-destructive, #ef4444)',
    },
    '.cm-tui-callout-warning .cm-tui-callout-title': {
      color: 'var(--color-destructive, #ef4444)',
    },
    '.cm-tui-callout-caution': {
      borderLeftColor: 'var(--color-destructive, #ef4444)',
    },
    '.cm-tui-callout-caution .cm-tui-callout-title': {
      color: 'var(--color-destructive, #ef4444)',
    },
    '.cm-tui-callout-tip': {
      borderLeftColor: 'var(--color-chart-2, #7ec8a0)',
    },
    '.cm-tui-callout-tip .cm-tui-callout-title': {
      color: 'var(--color-chart-2, #7ec8a0)',
    },
    '.cm-tui-callout-idea': {
      borderLeftColor: 'var(--color-chart-2, #7ec8a0)',
    },
    '.cm-tui-callout-idea .cm-tui-callout-title': {
      color: 'var(--color-chart-2, #7ec8a0)',
    },
    '.cm-tui-callout-important': {
      borderLeftColor: 'var(--color-chart-4, #e5c07b)',
    },
    '.cm-tui-callout-important .cm-tui-callout-title': {
      color: 'var(--color-chart-4, #e5c07b)',
    },

    // Bullet Lists
    '.cm-tui-bullet': {
      color: 'var(--color-primary)',
      fontWeight: 'bold',
      marginRight: '0.5rem',
      display: 'inline-block',
    },

    // Horizontal Rules
    '.cm-tui-hr-preview': {
      borderTop: '1px solid var(--color-border)',
      padding: '1.5rem 0',
      width: '100%',
      display: 'block',
    },

    // Tables (Obsidian-style preview)
    '.cm-tui-table-preview': {
      width: '100%',
      overflowX: 'auto',
      padding: '0.5rem 0',
      display: 'block',
      cursor: 'pointer',
    },
    '.cm-tui-table': {
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-editor, var(--font-geist-mono, monospace))',
      fontSize: '13px',
      lineHeight: '1.5',
      color: 'var(--color-foreground)',
    },
    '.cm-tui-table th, .cm-tui-table td': {
      border: '1px solid color-mix(in srgb, var(--color-border) 35%, transparent)',
      padding: '0.5rem 0.75rem',
      minWidth: '80px',
      position: 'relative',
    },
    '.cm-tui-table th': {
      fontWeight: 'bold',
      color: 'var(--color-foreground)',
      backgroundColor: 'color-mix(in srgb, var(--color-border) 8%, transparent)',
      textAlign: 'left',
    },
    '.cm-tui-table tbody tr:hover': {
      backgroundColor: 'color-mix(in srgb, var(--color-primary) 3%, transparent)',
    },
    '.cm-tui-table [contenteditable="true"]:focus': {
      outline: '1px solid var(--color-primary)',
      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
      borderRadius: 'var(--radius-sm, 0.2rem)',
    },

    /* Interactive Table controls */
    '.cm-tui-btn': {
      background: 'var(--color-entry-bg)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-muted-foreground)',
      padding: '0.1rem 0.25rem',
      fontSize: 'var(--font-tui-2xs, 9px)',
      cursor: 'pointer',
      borderRadius: 'var(--radius-sm, 0.2rem)',
      lineHeight: '1',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.1s ease',
      height: '16px',
    },
    '.cm-tui-btn:hover': {
      background: 'var(--color-primary)',
      color: 'var(--color-primary-foreground)',
      borderColor: 'var(--color-primary)',
    },
    '.cm-tui-col-actions': {
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'none',
      gap: '0.15rem',
      backgroundColor: 'var(--color-entry-alt-bg)',
      padding: '0.15rem',
      borderRadius: 'var(--radius-sm, 0.2rem)',
      border: '1px solid var(--color-border)',
      zIndex: '15',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
    },
    '.cm-tui-table th:hover .cm-tui-col-actions': {
      display: 'inline-flex',
    },
    '.cm-tui-table-row-actions': {
      border: 'none !important',
      background: 'transparent !important',
      opacity: '0',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '60px',
      padding: '0.25rem 0.5rem !important',
      transition: 'opacity 0.1s ease',
    },
    '.cm-tui-table tr:hover .cm-tui-table-row-actions': {
      opacity: '1',
    },
    '.cm-tui-table-action-header': {
      border: 'none !important',
      background: 'transparent !important',
      width: '60px',
      padding: '0.4rem 0.5rem !important',
    },
    '.cm-tui-table-placeholder': {
      color: 'var(--color-muted-foreground)',
      fontStyle: 'italic',
      textAlign: 'center',
    },

    // Heading line decorations — padding-based visual hierarchy.
    // MUST use padding (never font-size) so CodeMirror measures line height accurately
    // and posAtCoords maps clicks to the correct document position.
    '.cm-tui-heading-1': {
      paddingTop: '1.2rem',
      paddingBottom: '0.3rem',
      fontSize: '1.8em',
      lineHeight: '1.4',
    },
    '.cm-tui-heading-2': {
      paddingTop: '1rem',
      paddingBottom: '0.2rem',
      fontSize: '1.45em',
      lineHeight: '1.4',
    },
    '.cm-tui-heading-3': {
      paddingTop: '0.75rem',
      paddingBottom: '0.15rem',
      fontSize: '1.25em',
      lineHeight: '1.4',
    },
    '.cm-tui-heading-4': {
      paddingTop: '0.5rem',
      fontSize: '1.1em',
    },
    '.cm-tui-heading-5': {
      paddingTop: '0.4rem',
    },
    '.cm-tui-heading-6': {
      paddingTop: '0.3rem',
      color: 'var(--color-muted-foreground)',
    },
  },
  { dark: false },
);
