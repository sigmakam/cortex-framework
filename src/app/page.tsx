import { LandingLayout } from "@themes/default/layouts/LandingLayout";
import { Section } from "@themes/default/components/Section";
import { Card } from "@themes/default/components/Card";

const features = [
  {
    title: "Module Auto-Discovery",
    description:
      "Drop a folder into modules/ with a module.json and Cortex discovers it automatically — entities, API routes, MCP tools, and event subscriptions, all wired up at boot.",
  },
  {
    title: "MCP Integration",
    description:
      "Every module can expose MCP tools. AI agents query your content, create posts, and manage your site through a standard Model Context Protocol server.",
  },
  {
    title: "GTM Data Layer",
    description:
      "Domain events are automatically mapped to dataLayer pushes. Track every interaction with zero manual instrumentation — just declare mappings in module.json.",
  },
];

const steps = [
  {
    step: "1",
    title: "Describe",
    description:
      "Define your module with a simple module.json manifest — name, entities, events, and data layer mappings.",
  },
  {
    step: "2",
    title: "Generate",
    description:
      "Cortex auto-discovers your module, registers API routes, wires up MCP tools, and connects event subscriptions.",
  },
  {
    step: "3",
    title: "Launch",
    description:
      "Your module is live — API endpoints respond, AI agents can interact, and GTM tracks every event automatically.",
  },
];

export default function HomePage() {
  return (
    <LandingLayout
      heroTitle="The AI-First Web Framework"
      heroSubtitle="Module auto-discovery, MCP integration, and GTM data layer — all wired together so you can build content-driven sites that AI agents understand."
      heroPrimaryCTA={{ label: "Get Started", href: "/admin" }}
      heroSecondaryCTA={{ label: "Read the Blog", href: "/blog" }}
    >
      {/* Features Section */}
      <Section
        id="features"
        title="Everything You Need"
        subtitle="Cortex handles the wiring so you can focus on your content and business logic."
        background="muted"
      >
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} hover padding="lg">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {feature.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--color-muted)" }}
              >
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* How It Works Section */}
      <Section
        title="How It Works"
        subtitle="Three steps from idea to a fully wired, AI-ready module."
        background="default"
      >
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {item.step}
              </div>
              <h3
                className="mt-4 text-lg font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {item.title}
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--color-muted)" }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </LandingLayout>
  );
}
