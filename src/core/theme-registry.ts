import * as fs from "fs";
import * as path from "path";
import type { ThemeConfig, Theme, ThemeTokens } from "./theme-types";

class ThemeRegistryImpl {
  private themes: Map<string, Theme> = new Map();
  private activeThemeId: string = "cortex-default";

  constructor() {
    this.discoverThemes();
  }

  /** Scans the themes/ directory and loads theme.json from each subdirectory */
  discoverThemes(): void {
    const themesDir = path.resolve(process.cwd(), "themes");

    if (!fs.existsSync(themesDir)) {
      return;
    }

    const entries = fs.readdirSync(themesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const themeJsonPath = path.join(themesDir, entry.name, "theme.json");

      if (!fs.existsSync(themeJsonPath)) continue;

      try {
        const raw = fs.readFileSync(themeJsonPath, "utf-8");
        const config: ThemeConfig = JSON.parse(raw);

        this.themes.set(config.id, {
          config,
          path: path.join(themesDir, entry.name),
          active: config.id === this.activeThemeId,
        });
      } catch {
        console.warn(`[theme-registry] Failed to load theme from ${themeJsonPath}`);
      }
    }
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

    // Deactivate current
    for (const t of this.themes.values()) {
      t.active = false;
    }

    // Activate new
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

    // colors.primary → --color-primary
    if (tokens.colors) {
      for (const [key, value] of Object.entries(tokens.colors)) {
        lines.push(`  --color-${key}: ${value};`);
      }
    }

    // typography.fontFamily.sans → --font-sans
    if (tokens.typography?.fontFamily) {
      for (const [key, value] of Object.entries(tokens.typography.fontFamily)) {
        if (value) {
          lines.push(`  --font-${key}: ${value};`);
        }
      }
    }

    // typography.fontSize.lg → --text-lg
    if (tokens.typography?.fontSize) {
      for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
        lines.push(`  --text-${key}: ${value};`);
      }
    }

    // spacing.md → --spacing-md
    if (tokens.spacing) {
      for (const [key, value] of Object.entries(tokens.spacing)) {
        lines.push(`  --spacing-${key}: ${value};`);
      }
    }

    // borderRadius.lg → --radius-lg
    if (tokens.borderRadius) {
      for (const [key, value] of Object.entries(tokens.borderRadius)) {
        lines.push(`  --radius-${key}: ${value};`);
      }
    }

    // shadows.md → --shadow-md
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
