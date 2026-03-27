import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DataLayerProvider } from "@/components/DataLayerProvider";
import { GTMScript } from "@/components/GTMScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex — AI-First Web Framework",
  description:
    "Build AI-powered web applications with module auto-discovery, MCP integration, and GTM data layer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-[var(--font-sans)] text-[var(--color-text)] bg-[var(--color-background)] antialiased">
        <ThemeProvider>
          <DataLayerProvider>
            <GTMScript gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
            {children}
          </DataLayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
