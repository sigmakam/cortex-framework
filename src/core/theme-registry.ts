import type { ThemeConfig, Theme } from "./theme-types";
import { themeTokensToCSS } from "./theme-tokens-css";

class ThemeRegistryImpl {
  private themes: Map<string, Theme> = new Map();
  private activeThemeId: string = "cortex-default";

  /** Register a theme from a parsed theme.json config */
  registerTheme(config: ThemeConfig, themePath: string): void {
    this.themes.set(config.id, {
      config,
      path: themePath,
      active: config.id === this.activeThemeId,
    });
  }

  /** Returns the currently active theme */
  getActive(): Theme | undefined {
    return this.themes.get(this.activeThemeId);
  }

  /** Returns a theme by ID */
  get(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  /** Returns all registered themes */
  getAll(): Theme[] {
    return Array.from(this.themes.values());
  }

  /** Activates a theme by ID */
  activate(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) return false;

    for (const t of this.themes.values()) {
      t.active = false;
    }
    theme.active = true;
    this.activeThemeId = themeId;
    return true;
  }

  /** Converts theme tokens to CSS custom properties string */
  getTokensAsCSS(theme?: Theme): string {
    const target = theme ?? this.getActive();
    if (!target) return "";
    return themeTokensToCSS(target.config.tokens);
  }
}

export const themeRegistry = new ThemeRegistryImpl();
