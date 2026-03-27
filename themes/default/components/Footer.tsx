import type { ReactNode } from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  label: string;
  href: string;
  icon: ReactNode;
}

interface FooterProps {
  brandName?: string;
  brandDescription?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  copyright?: string;
  className?: string;
}

export function Footer({
  brandName = "Cortex",
  brandDescription = "AI-first web framework for building modern websites with intelligent content management.",
  columns = [],
  socialLinks = [],
  copyright,
  className = "",
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const copyrightText = copyright ?? `\u00A9 ${currentYear} ${brandName}. All rights reserved.`;

  return (
    <footer className={`bg-gray-900 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Brand column */}
            <div className="lg:col-span-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-xl font-bold text-white transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  C
                </span>
                <span>{brandName}</span>
              </a>
              {brandDescription && (
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
                  {brandDescription}
                </p>
              )}

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="mt-6 flex items-center gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      className="text-gray-400 transition-colors duration-150 hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link columns */}
            {columns.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:col-span-8">
                {columns.map((column) => (
                  <div key={column.title}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                      {column.title}
                    </h3>
                    <ul className="mt-4 space-y-3" role="list">
                      {column.links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            className="text-sm text-gray-400 transition-colors duration-150 hover:text-white"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-gray-800 py-6">
          <p className="text-center text-sm text-gray-500">{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}
