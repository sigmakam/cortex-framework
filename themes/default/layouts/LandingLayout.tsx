import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Footer } from "../components/Footer";

interface HeroCTA {
  label: string;
  href: string;
}

interface LandingLayoutProps {
  children: ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
  heroPrimaryCTA?: HeroCTA;
  heroSecondaryCTA?: HeroCTA;
  heroLayout?: "center" | "split";
  heroImage?: ReactNode;
  showHero?: boolean;
  className?: string;
}

const defaultNavigation = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Blog", href: "/blog" },
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

export function LandingLayout({
  children,
  heroTitle = "Build with AI",
  heroSubtitle = "The AI-first web framework for modern content-driven websites.",
  heroPrimaryCTA = { label: "Get Started", href: "/admin" },
  heroSecondaryCTA,
  heroLayout = "center",
  heroImage,
  showHero = true,
  className = "",
}: LandingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col" style={{ fontFamily: "var(--font-sans)" }}>
      <Header
        navigation={defaultNavigation}
        variant="transparent"
        ctaLabel="Get Started"
        ctaHref="/admin"
      />

      {showHero && (
        <Hero
          layout={heroLayout}
          title={heroTitle}
          subtitle={heroSubtitle}
          primaryCTA={heroPrimaryCTA}
          secondaryCTA={heroSecondaryCTA}
          image={heroImage}
        />
      )}

      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      <Footer columns={defaultFooterColumns} />
    </div>
  );
}
