export const THEMES = ["catppuccin", "everforest", "nord"] as const;
export type Theme = (typeof THEMES)[number];

class ThemeStore {
  current = $state<Theme>("catppuccin");

  change(theme: Theme) {
    this.current = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tui-theme", theme);
  }

  load() {
    const saved = localStorage.getItem("tui-theme") as Theme | null;
    this.change(saved && THEMES.includes(saved) ? saved : "catppuccin");
  }
}

export const themeStore = new ThemeStore();
