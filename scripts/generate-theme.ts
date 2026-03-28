#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs/promises";
import * as path from "path";

const THEMES_DIR = path.join(process.cwd(), "themes");
const CORTEX_DIR = path.join(process.cwd(), ".cortex");

// ---------------------------------------------------------------------------
// Design token types
// ---------------------------------------------------------------------------

interface DesignTokens {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  fontFamily?: string;
  monoFontFamily?: string;
  borderRadius?: string;
}

// ---------------------------------------------------------------------------
// Claude API integration
// ---------------------------------------------------------------------------

async function parseLayoutInstructions(
  description: string
): Promise<DesignTokens> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {};
  }

  const systemPrompt = `You are a design system expert. Given a description of a website design, extract design tokens as JSON.

Return ONLY valid JSON with these optional fields:
- primaryColor (hex color)
- secondaryColor (hex color)
- accentColor (hex color)
- backgroundColor (hex color)
- textColor (hex color)
- mutedColor (hex color)
- fontFamily (CSS font stack for body text)
- monoFontFamily (CSS font stack for code)
- borderRadius ("none", "sm", "md", "lg", "xl", "full")

Only include fields you can confidently derive from the description. Respond with JSON only, no markdown.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: description }],
      }),
    });

    if (!response.ok) {
      console.error(
        `Claude API error: ${response.status} ${response.statusText}`
      );
      return {};
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.[0]?.text ?? "{}";

    // Extract JSON from the response (handles potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    return JSON.parse(jsonMatch[0]) as DesignTokens;
  } catch (err) {
    console.error("Failed to call Claude API:", err);
    return {};
  }
}

function applyTokensToTheme(
  themeJson: Record<string, unknown>,
  tokens: DesignTokens
): Record<string, unknown> {
  const theme = JSON.parse(JSON.stringify(themeJson));
  const themeTokens = (theme.tokens ?? {}) as Record<string, unknown>;
  const colors = (themeTokens.colors ?? {}) as Record<string, string>;
  const typography = (themeTokens.typography ?? {}) as Record<string, unknown>;
  const fontFamily = (typography.fontFamily ?? {}) as Record<string, string>;

  if (tokens.primaryColor) colors.primary = tokens.primaryColor;
  if (tokens.secondaryColor) colors.secondary = tokens.secondaryColor;
  if (tokens.accentColor) colors.accent = tokens.accentColor;
  if (tokens.backgroundColor) colors.background = tokens.backgroundColor;
  if (tokens.textColor) colors.text = tokens.textColor;
  if (tokens.mutedColor) colors.muted = tokens.mutedColor;

  if (tokens.fontFamily) fontFamily.sans = tokens.fontFamily;
  if (tokens.monoFontFamily) fontFamily.mono = tokens.monoFontFamily;

  if (tokens.borderRadius) {
    const radiusMap: Record<string, Record<string, string>> = {
      none: { sm: "0", md: "0", lg: "0", xl: "0" },
      sm: { sm: "0.125rem", md: "0.25rem", lg: "0.375rem", xl: "0.5rem" },
      md: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem" },
      lg: { sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" },
      xl: { sm: "0.75rem", md: "1rem", lg: "1.5rem", xl: "2rem" },
      full: { sm: "9999px", md: "9999px", lg: "9999px", xl: "9999px" },
    };
    const radius = radiusMap[tokens.borderRadius];
    if (radius) {
      const br = (themeTokens.borderRadius ?? {}) as Record<string, string>;
      Object.assign(br, radius);
      themeTokens.borderRadius = br;
    }
  }

  themeTokens.colors = colors;
  typography.fontFamily = fontFamily;
  themeTokens.typography = typography;
  theme.tokens = themeTokens;

  return theme;
}

// ---------------------------------------------------------------------------
// Recursive directory copy
// ---------------------------------------------------------------------------

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name("generate-theme")
  .description("Cortex theme generator CLI")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate a new theme from a description")
  .option("-f, --file <path>", "Read description from a file")
  .option("-d, --description <text>", "Inline design description")
  .option("-n, --name <name>", "Theme name", "custom")
  .option("-b, --base <theme>", "Base theme to extend", "default")
  .action(
    async (opts: {
      file?: string;
      description?: string;
      name: string;
      base: string;
    }) => {
      let description = opts.description ?? "";

      // Read description from file if provided
      if (opts.file) {
        try {
          description = await fs.readFile(opts.file, "utf-8");
        } catch {
          console.error(`Error: Could not read file '${opts.file}'`);
          process.exit(1);
        }
      }

      if (!description.trim()) {
        console.log(
          "No description provided. The base theme will be copied as-is."
        );
        console.log(
          "Use --description or --file to provide design instructions."
        );
      }

      const baseDir = path.join(THEMES_DIR, opts.base);
      const newDir = path.join(THEMES_DIR, opts.name);

      // Check base theme exists
      try {
        await fs.access(baseDir);
      } catch {
        console.error(`Error: Base theme '${opts.base}' not found at ${baseDir}`);
        process.exit(1);
      }

      // Copy base theme to new directory
      console.log(`Copying base theme '${opts.base}' to '${opts.name}'...`);
      await copyDir(baseDir, newDir);

      // Read the theme.json from the new directory
      const themeJsonPath = path.join(newDir, "theme.json");
      const themeRaw = await fs.readFile(themeJsonPath, "utf-8");
      let themeJson = JSON.parse(themeRaw) as Record<string, unknown>;

      // Update id and name
      themeJson.id = opts.name;
      themeJson.name = opts.name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      if (description.trim() && process.env.ANTHROPIC_API_KEY) {
        console.log("Calling Claude API to parse design tokens...");
        const tokens = await parseLayoutInstructions(description);

        if (Object.keys(tokens).length > 0) {
          console.log("Applying design tokens:", tokens);
          themeJson = applyTokensToTheme(themeJson, tokens);
        } else {
          console.log(
            "No tokens extracted from description. Using base theme values."
          );
        }
      } else if (description.trim()) {
        console.log(
          "ANTHROPIC_API_KEY not set. Skipping AI-powered customization."
        );
        console.log(
          "Set ANTHROPIC_API_KEY to enable automatic design token extraction."
        );
      }

      // Write updated theme.json
      await fs.writeFile(themeJsonPath, JSON.stringify(themeJson, null, 2));
      console.log(`Theme '${opts.name}' created at ${newDir}`);
    }
  );

program
  .command("activate")
  .description("Activate a theme by name")
  .argument("<theme>", "Theme name to activate")
  .action(async (theme: string) => {
    const themeDir = path.join(THEMES_DIR, theme);

    try {
      await fs.access(themeDir);
    } catch {
      console.error(`Error: Theme '${theme}' not found at ${themeDir}`);
      process.exit(1);
    }

    await fs.mkdir(CORTEX_DIR, { recursive: true });
    const configPath = path.join(CORTEX_DIR, "config.json");

    let config: Record<string, unknown> = {};
    try {
      const existing = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(existing);
    } catch {
      // File does not exist yet, start fresh
    }

    config.activeTheme = theme;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`Theme '${theme}' activated. Written to ${configPath}`);
  });

program
  .command("list")
  .description("List all available themes")
  .action(async () => {
    try {
      const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
      const themes = entries.filter((e) => e.isDirectory() && e.name !== ".gitkeep");

      if (themes.length === 0) {
        console.log("No themes found.");
        return;
      }

      // Read active theme
      let activeTheme = "";
      try {
        const configPath = path.join(CORTEX_DIR, "config.json");
        const config = JSON.parse(await fs.readFile(configPath, "utf-8")) as Record<string, unknown>;
        activeTheme = (config.activeTheme as string) ?? "";
      } catch {
        // No config file
      }

      console.log("Available themes:\n");
      for (const theme of themes) {
        const themeJsonPath = path.join(THEMES_DIR, theme.name, "theme.json");
        let label = theme.name;
        try {
          const raw = await fs.readFile(themeJsonPath, "utf-8");
          const tj = JSON.parse(raw) as Record<string, unknown>;
          label = `${tj.name ?? theme.name} (${tj.version ?? "?"})`;
        } catch {
          // theme.json missing or invalid
        }
        const active = theme.name === activeTheme ? " [active]" : "";
        console.log(`  ${theme.name} - ${label}${active}`);
      }
    } catch {
      console.error("Error: themes/ directory not found.");
      process.exit(1);
    }
  });

program.parse();
