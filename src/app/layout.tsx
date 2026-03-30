import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DataLayerProvider } from "@/components/DataLayerProvider";
import { GTMHead, GTMNoScript } from "@/components/GTMScript";
import { siteConfigService } from "@/core/site-config";
import {
  generateConsentScript,
  generateFallbackConsentScript,
} from "@/core/datalayer/consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex — AI-First Web Framework",
  description:
    "Build AI-powered web applications with module auto-discovery, MCP integration, and GTM data layer.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load analytics config from DB (with fallbacks for dev/no-DB)
  let gtmId: string | undefined;
  let consentScript: string;
  let debugMode = false;

  try {
    const ctx = await siteConfigService.getSiteContext();
    gtmId = ctx.analytics.gtmId;
    debugMode = ctx.analytics.debugMode;
    consentScript = generateConsentScript(ctx.consent.regions);
  } catch {
    // DB not available — use safe fallback (all denied)
    gtmId = process.env.NEXT_PUBLIC_GTM_ID;
    consentScript = generateFallbackConsentScript();
  }

  // Validate GTM ID before render — invalid ID would throw inside GTMHead
  if (gtmId && !/^GTM-[A-Z0-9]{1,10}$/.test(gtmId)) {
    console.warn(`[Cortex] Invalid GTM ID — skipping GTM injection`);
    gtmId = undefined;
  }

  return (
    <html lang="en">
      <head>
        {/* Loading order: 1. consent defaults  2. GTM snippet */}
        {gtmId && (
          <GTMHead consentScript={consentScript} gtmId={gtmId} />
        )}
      </head>
      <body className="font-[var(--font-sans)] text-[var(--color-text)] bg-[var(--color-background)] antialiased">
        {/* GTM noscript fallback — immediately after <body> */}
        {gtmId && <GTMNoScript gtmId={gtmId} />}
        <ThemeProvider>
          <DataLayerProvider debugMode={debugMode}>
            {children}
          </DataLayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
