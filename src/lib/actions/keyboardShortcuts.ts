import { toggleMode } from "mode-watcher";
import { THEMES, themeStore } from "$lib/stores/theme.svelte";
import { viewStore } from "$lib/stores/view.svelte";

export function setupKeyboardShortcuts(
  promptInput: () => HTMLInputElement | null
) {
  function handleKeydown(event: KeyboardEvent) {
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      return;
    }

    const actions: Record<string, () => void> = {
      "1": () => viewStore.setCategory("inbox"),
      "2": () => viewStore.setCategory("favorites"),
      "3": () => viewStore.setCategory("trash"),
      g: () => viewStore.setMode("grid"),
      l: () => viewStore.setMode("list"),
      s: () => {
        viewStore.setSearchActive(true);
        setTimeout(() => promptInput()?.focus(), 50);
      },
      a: () => promptInput()?.focus(),
      t: () => {
        const next = (THEMES.indexOf(themeStore.current) + 1) % THEMES.length;
        themeStore.change(THEMES[next]);
      },
      m: () => toggleMode(),
      Escape: () => {
        (document.activeElement as HTMLElement)?.blur?.();
        if (viewStore.searchActive) {
          viewStore.setSearchActive(false);
        }
      },
    };

    actions[event.key]?.();
  }

  window.addEventListener("keydown", handleKeydown);
  return () => window.removeEventListener("keydown", handleKeydown);
}
