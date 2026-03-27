export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      serif?: string;
      mono?: string;
    };
    fontSize: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  tokens: ThemeTokens;
  components: Record<string, string>;
  layouts: Record<string, string>;
}

export interface Theme {
  config: ThemeConfig;
  path: string;
  active: boolean;
}

export interface LayoutInstructions {
  structure: {
    header: {
      style: "fixed" | "static" | "transparent";
      logo: "left" | "center";
      navigation: "horizontal" | "vertical";
    };
    hero?: {
      type: "full-screen" | "half-screen" | "banner";
      content: "left" | "center" | "right";
      background: "color" | "image" | "gradient";
    };
    sections: Array<{
      type: "features" | "testimonials" | "cta" | "content" | "gallery";
      layout: "1-col" | "2-col" | "3-col" | "grid";
    }>;
    footer: {
      columns: 1 | 2 | 3 | 4;
      social: boolean;
      newsletter: boolean;
    };
  };
  design: {
    colorScheme: "light" | "dark" | "auto";
    primaryColor?: string;
    font?: string;
    spacing: "compact" | "comfortable" | "spacious";
    corners: "sharp" | "rounded" | "pill";
  };
}
