import { themeService } from "@/core/theme-service";
import { themeRegistry } from "@/core/theme-registry";

/**
 * Server component that injects theme CSS variables.
 *
 * Priority:
 *   1. Active theme from DB (themeService) — for runtime switching via admin
 *   2. Active theme from file registry (themeRegistry) — fallback when DB unavailable
 *   3. Empty string — no theme variables (components use Tailwind defaults)
 */
export async function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  let css = "";

  try {
    // Try DB-based theme first (runtime switchable)
    const dbTheme = await themeService.getActive();
    if (dbTheme) {
      css = themeService.getTokensAsCSS(dbTheme.tokens);
    }
  } catch {
    // DB not available — ignore
  }

  // Fallback to file-based theme registry
  if (!css) {
    css = themeRegistry.getTokensAsCSS();
  }

  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {children}
    </>
  );
}
