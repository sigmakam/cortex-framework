import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Container } from "../components/Container";

interface BlogLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
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

export function BlogLayout({ children, sidebar, className = "" }: BlogLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col" style={{ fontFamily: "var(--font-sans)" }}>
      <Header
        navigation={defaultNavigation}
        ctaLabel="Get Started"
        ctaHref="/admin"
      />

      {/* Spacer for fixed header */}
      <div className="h-16" aria-hidden="true" />

      <main className={`flex-1 py-12 sm:py-16 ${className}`}>
        <Container size="lg">
          {sidebar ? (
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Main content area */}
              <div className="lg:col-span-8">
                {children}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4" aria-label="Blog sidebar">
                <div className="sticky top-24 space-y-8">
                  {sidebar}
                </div>
              </aside>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">
              {children}
            </div>
          )}
        </Container>
      </main>

      <Footer columns={defaultFooterColumns} />
    </div>
  );
}
