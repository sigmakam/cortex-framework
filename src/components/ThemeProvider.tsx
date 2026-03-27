import { themeRegistry } from "@/core/theme-registry";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const css = themeRegistry.getTokensAsCSS();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
