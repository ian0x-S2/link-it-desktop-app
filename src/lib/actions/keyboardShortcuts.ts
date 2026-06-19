import { toggleMode } from 'mode-watcher';
import { THEMES, themeStore } from '$lib/shared/stores/theme.svelte';
import { viewStore } from '$lib/shared/stores/view.svelte';
import { categoryStore } from '$lib/features/categories/stores/category.svelte';

export function setupKeyboardShortcuts(
  promptInput: () => HTMLInputElement | null,
  onAddContent?: () => void,
) {
  function handleKeydown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (event.target as HTMLElement)?.isContentEditable) {
      return;
    }

    const actions: Record<string, () => void> = {
      // Numeric keys jump to categories by position (1-indexed).
      '1': () => selectCategoryByPosition(0),
      '2': () => selectCategoryByPosition(1),
      '3': () => selectCategoryByPosition(2),
      '4': () => selectCategoryByPosition(3),
      '5': () => selectCategoryByPosition(4),
      '6': () => selectCategoryByPosition(5),
      '7': () => selectCategoryByPosition(6),
      '8': () => selectCategoryByPosition(7),
      // Special views.
      f: () => viewStore.selectSpecialView('favorites'),
      x: () => viewStore.selectSpecialView('trash'),
      // View modes.
      g: () => viewStore.setMode('grid'),
      l: () => viewStore.setMode('list'),
      // Search / add.
      s: () => {
        viewStore.setSearchActive(true);
        setTimeout(() => promptInput()?.focus(), 50);
      },
      a: () => {
        if (onAddContent) {
          onAddContent();
        } else {
          promptInput()?.focus();
        }
      },
      // Theme / dark mode.
      t: () => {
        const next = (THEMES.indexOf(themeStore.current) + 1) % THEMES.length;
        themeStore.change(THEMES[next]);
      },
      m: () => toggleMode(),
      // Settings.
      ',': () => viewStore.selectSpecialView('settings'),
      Escape: () => {
        (document.activeElement as HTMLElement)?.blur?.();
        if (viewStore.searchActive) {
          viewStore.setSearchActive(false);
        }
      },
    };

    actions[event.key]?.();
  }

  function selectCategoryByPosition(position: number): void {
    const cat = categoryStore.items[position];
    if (cat) {
      viewStore.selectCategory(cat.id);
    }
  }

  window.addEventListener('keydown', handleKeydown);
  return () => window.removeEventListener('keydown', handleKeydown);
}
