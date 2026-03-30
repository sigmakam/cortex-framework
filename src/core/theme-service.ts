/**
 * Theme Service — loads themes from DB for runtime switching.
 *
 * Flow:
 *   Admin clicks theme → POST /api/admin/themes/:id/activate
 *   → DB: set is_active = true → revalidatePath('/')
 *   → ThemeProvider reads active theme from DB → generates new CSS variables
 *   → Entire site changes appearance. Content and DataLayer untouched.
 */

import { db } from "@/lib/db";
import { themes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { ThemeTokens, ThemeConfig } from "./theme-types";
import { themeTokensToCSS } from "./theme-tokens-css";

// --- Cache ---
let cachedActiveTheme: { config: ThemeConfig; tokens: ThemeTokens } | null =
  null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

class ThemeService {
  /** Get the currently active theme from DB */
  async getActive(): Promise<{ config: ThemeConfig; tokens: ThemeTokens } | null> {
    const now = Date.now();
    if (cachedActiveTheme && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedActiveTheme;
    }

    try {
      const rows = await db
        .select()
        .from(themes)
        .where(eq(themes.isActive, true))
        .limit(1);

      if (rows.length === 0) return null;

      const row = rows[0];
      const config: ThemeConfig = {
        id: row.id,
        name: row.name,
        version: row.version,
        description: row.description ?? "",
        author: row.author ?? undefined,
        tokens: row.tokens as ThemeTokens,
        components: row.components,
        layouts: row.layouts,
      };

      const result = { config, tokens: row.tokens as ThemeTokens };
      cachedActiveTheme = result;
      cacheTimestamp = now;
      return result;
    } catch {
      return cachedActiveTheme;
    }
  }

  /** Get all themes */
  async getAll(): Promise<
    { id: string; name: string; isActive: boolean; tokens: ThemeTokens }[]
  > {
    try {
      const rows = await db.select().from(themes);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        tokens: r.tokens as ThemeTokens,
      }));
    } catch {
      return [];
    }
  }

  /** Activate a theme by ID — deactivates all others. Transactional. */
  async activate(themeId: string): Promise<boolean> {
    try {
      // First check if the theme exists
      const existing = await db
        .select({ id: themes.id })
        .from(themes)
        .where(eq(themes.id, themeId))
        .limit(1);

      if (existing.length === 0) return false;

      // Transactional: deactivate all, then activate target
      await db.transaction(async (tx) => {
        await tx.update(themes).set({ isActive: false });
        await tx
          .update(themes)
          .set({ isActive: true })
          .where(eq(themes.id, themeId));
      });

      cachedActiveTheme = null; // invalidate cache
      return true;
    } catch {
      return false;
    }
  }

  /** Convert theme tokens to CSS custom properties */
  getTokensAsCSS(tokens: ThemeTokens): string {
    return themeTokensToCSS(tokens);
  }

  /** Invalidate cache */
  invalidateCache(): void {
    cachedActiveTheme = null;
  }
}

export const themeService = new ThemeService();
