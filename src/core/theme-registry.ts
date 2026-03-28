import type { ThemeConfig, Theme } from "./theme-types";

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

    const tokens = target.config.tokens;
    const lines: string[] = [":root {"];

    if (tokens.colors) {
      for (const [key, value] of Object.entries(tokens.colors)) {
        lines.push(`  --color-${key}: ${value};`);
      }
    }

    if (tokens.typography?.fontFamily) {
      for (const [key, value] of Object.entries(tokens.typography.fontFamily)) {
        if (value) lines.push(`  --font-${key}: ${value};`);
      }
    }

    if (tokens.typography?.fontSize) {
      for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
        lines.push(`  --text-${key}: ${value};`);
      }
    }

    if (tokens.spacing) {
      for (const [key, value] of Object.entries(tokens.spacing)) {
        lines.push(`  --spacing-${key}: ${value};`);
      }
    }

    if (tokens.borderRadius) {
      for (const [key, value] of Object.entries(tokens.borderRadius)) {
        lines.push(`  --radius-${key}: ${value};`);
      }
    }

    if (tokens.shadows) {
      for (const [key, value] of Object.entries(tokens.shadows)) {
        lines.push(`  --shadow-${key}: ${value};`);
      }
    }

    lines.push("}");
    return lines.join("\n");
  }
}

export const themeRegistry = new ThemeRegistryImpl();
