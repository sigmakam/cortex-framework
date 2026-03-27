import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

interface BaseLayoutProps {
  children: ReactNode;
  className?: string;
}

const defaultNavigation = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

const defaultFooterColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function BaseLayout({ children, className = "" }: BaseLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col" style={{ fontFamily: "var(--font-sans)" }}>
      <Header
        navigation={defaultNavigation}
        ctaLabel="Get Started"
        ctaHref="/admin"
      />

      {/* Spacer for fixed header */}
      <div className="h-16" aria-hidden="true" />

      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      <Footer columns={defaultFooterColumns} />
    </div>
  );
}
