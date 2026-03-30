/**
 * Shared utility: converts ThemeTokens to CSS custom properties.
 * Used by both ThemeRegistry (file-based) and ThemeService (DB-based).
 */

import type { ThemeTokens } from "./theme-types";

/** Strip characters that could break out of a <style> tag or inject properties */
function safeCSSKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "");
}

function safeCSSValue(value: string): string {
  return value.replace(/[<>]/g, "");
}

function addVar(lines: string[], prefix: string, key: string, value: string | undefined): void {
  if (value) lines.push(`  --${prefix}-${safeCSSKey(key)}: ${safeCSSValue(value)};`);
}

export function themeTokensToCSS(tokens: ThemeTokens): string {
  const lines: string[] = [":root {"];

  if (tokens.colors) {
    for (const [key, value] of Object.entries(tokens.colors)) {
      addVar(lines, "color", key, value);
    }
  }

  if (tokens.typography?.fontFamily) {
    for (const [key, value] of Object.entries(tokens.typography.fontFamily)) {
      addVar(lines, "font", key, value);
    }
  }

  if (tokens.typography?.fontSize) {
    for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
      addVar(lines, "text", key, value);
    }
  }

  if (tokens.spacing) {
    for (const [key, value] of Object.entries(tokens.spacing)) {
      addVar(lines, "spacing", key, value);
    }
  }

  if (tokens.borderRadius) {
    for (const [key, value] of Object.entries(tokens.borderRadius)) {
      addVar(lines, "radius", key, value);
    }
  }

  if (tokens.shadows) {
    for (const [key, value] of Object.entries(tokens.shadows)) {
      addVar(lines, "shadow", key, value);
    }
  }

  lines.push("}");
  return lines.join("\n");
}
