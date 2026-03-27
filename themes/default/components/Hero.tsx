import type { ReactNode } from "react";

interface HeroCTA {
  label: string;
  href: string;
}

interface HeroProps {
  layout?: "center" | "split";
  title: string;
  subtitle?: string;
  primaryCTA?: HeroCTA;
  secondaryCTA?: HeroCTA;
  image?: ReactNode;
  className?: string;
}

export function Hero({
  layout = "center",
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  image,
  className = "",
}: HeroProps) {
  if (layout === "split") {
    return (
      <section
        className={`relative overflow-hidden animate-fade-in ${className}`}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Gradient accent */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
            {/* Text Column */}
            <div className="flex flex-col justify-center">
              <h1
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
                  style={{ color: "var(--color-muted)" }}
                >
                  {subtitle}
                </p>
              )}
              {(primaryCTA || secondaryCTA) && (
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  {primaryCTA && (
                    <a
                      href={primaryCTA.href}
                      className="inline-flex items-center justify-center px-7 py-3.5 text-base font-medium text-white shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      {primaryCTA.label}
                    </a>
                  )}
                  {secondaryCTA && (
                    <a
                      href={secondaryCTA.href}
                      className="inline-flex items-center justify-center border-2 bg-transparent px-7 py-3.5 text-base font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        borderColor: "var(--color-primary)",
                        color: "var(--color-primary)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      {secondaryCTA.label}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Image Column */}
            <div className="flex items-center justify-center">
              {image ?? (
                <div
                  className="flex h-80 w-full items-center justify-center rounded-2xl lg:h-96"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                    borderRadius: "var(--radius-xl)",
                    opacity: 0.1,
                  }}
                  aria-hidden="true"
                >
                  <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Center layout (default)
  return (
    <section
      className={`relative overflow-hidden animate-fade-in ${className}`}
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Gradient accent */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center py-20 text-center">
          <h1
            className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl"
              style={{ color: "var(--color-muted)" }}
            >
              {subtitle}
            </p>
          )}
          {(primaryCTA || secondaryCTA) && (
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              {primaryCTA && (
                <a
                  href={primaryCTA.href}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {primaryCTA.label}
                </a>
              )}
              {secondaryCTA && (
                <a
                  href={secondaryCTA.href}
                  className="inline-flex items-center justify-center border-2 bg-transparent px-8 py-4 text-base font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {secondaryCTA.label}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
