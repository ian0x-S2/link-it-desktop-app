import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

import { tuiEditorTheme } from './theme';
import { 
  tuiMarkdownHighlight, 
  tuiCodeFallbackHighlight, 
  markdownMarkStyling, 
  tuiHighlightPlugin, 
  codeBlockBackgroundPlugin, 
  imagePreviewPlugin, 
  markdownCollapsePlugin,
  horizontalRulePlugin,
  blockquotePreviewPlugin
} from './markdown';
import { bookRefPlugin } from './book-widget';

/**
 * Composes all CodeMirror extensions for the TUI markdown editor.
 *
 * @param onSave — optional callback invoked when the user presses Ctrl/Cmd+S
 */
export function createEditorExtensions(onSave?: () => void) {
  return [
    // Language
    markdown({ 
      base: markdownLanguage, 
      codeLanguages: languages,
      extensions: [markdownMarkStyling]
    }),

    // Theme
    tuiEditorTheme,
    tuiMarkdownHighlight,
    tuiCodeFallbackHighlight,
    tuiHighlightPlugin,
    codeBlockBackgroundPlugin,
    imagePreviewPlugin,
    markdownCollapsePlugin,
    horizontalRulePlugin,
    blockquotePreviewPlugin,

    // Book reference widget
    bookRefPlugin,

    // History (undo/redo)
    history(),

    // Key bindings
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
      // Ctrl/Cmd + S → save
      {
        key: 'Mod-s',
        run: () => {
          onSave?.();
          return true;
        },
      },
    ]),

    // Soft wrap for comfortable reading
    EditorView.lineWrapping,

    // Editable
    EditorState.allowMultipleSelections.of(true),
  ];
}
