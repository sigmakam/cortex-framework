import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  background?: "default" | "muted" | "accent" | "dark";
  padding?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
}

const backgroundStyles: Record<NonNullable<SectionProps["background"]>, string> = {
  default: "bg-white",
  muted: "bg-gray-50",
  accent: "",
  dark: "bg-gray-900",
};

const paddingStyles: Record<NonNullable<SectionProps["padding"]>, string> = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-24",
  lg: "py-24 sm:py-32",
};

function getBackgroundInlineStyle(background: NonNullable<SectionProps["background"]>): React.CSSProperties {
  if (background === "accent") {
    return { backgroundColor: "color-mix(in srgb, var(--color-primary) 5%, white)" };
  }
  return {};
}

function getTextColor(background: NonNullable<SectionProps["background"]>): {
  title: string;
  subtitle: string;
} {
  if (background === "dark") {
    return { title: "text-white", subtitle: "text-gray-400" };
  }
  return { title: "", subtitle: "" };
}

export function Section({
  children,
  title,
  subtitle,
  background = "default",
  padding = "md",
  className = "",
  id,
}: SectionProps) {
  const textColors = getTextColor(background);

  return (
    <section
      id={id}
      className={`${backgroundStyles[background]} ${paddingStyles[padding]} ${className}`}
      style={getBackgroundInlineStyle(background)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
            {title && (
              <h2
                className={`text-3xl font-bold tracking-tight sm:text-4xl ${textColors.title}`}
                style={{
                  color: background === "dark" ? undefined : "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className={`mt-4 text-lg leading-relaxed ${textColors.subtitle}`}
                style={{
                  color: background === "dark" ? undefined : "var(--color-muted)",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
