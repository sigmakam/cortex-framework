"use client";

import { useState, useCallback } from "react";
import type { ReactNode } from "react";

interface NavLink {
  label: string;
  href: string;
}

interface HeaderProps {
  logo?: ReactNode;
  logoText?: string;
  navigation?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  variant?: "fixed" | "static" | "transparent";
  className?: string;
}

const variantStyles: Record<NonNullable<HeaderProps["variant"]>, string> = {
  fixed: "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm",
  static: "relative bg-white border-b border-gray-100",
  transparent: "fixed top-0 left-0 right-0 z-50 bg-transparent",
};

export function Header({
  logo,
  logoText = "Cortex",
  navigation = [],
  ctaLabel,
  ctaHref,
  variant = "fixed",
  className = "",
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className={`${variantStyles[variant]} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a
              href="/"
              className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
            >
              {logo ?? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  C
                </span>
              )}
              <span>{logoText}</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Main navigation">
            {navigation.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-gray-100"
                style={{ color: "var(--color-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA + Mobile Hamburger */}
          <div className="flex items-center gap-4">
            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                className="hidden md:inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {ctaLabel}
              </a>
            )}

            {/* Mobile hamburger button */}
            <button
              type="button"
              className="inline-flex md:hidden items-center justify-center rounded-md p-2 transition-colors duration-150 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset"
              style={{ color: "var(--color-muted)" }}
              onClick={toggleMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? (
                /* X icon */
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2">
          {navigation.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-150 hover:bg-gray-50"
              style={{ color: "var(--color-text)" }}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          {ctaLabel && ctaHref && (
            <a
              href={ctaHref}
              className="mt-3 block w-full rounded-md px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--radius-md)",
              }}
              onClick={closeMenu}
            >
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
