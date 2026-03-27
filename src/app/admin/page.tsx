import { moduleRegistry } from "@/core/module-registry";
import { themeRegistry } from "@/core/theme-registry";
import { db } from "@/lib/db";
import { posts } from "@modules/blog/entities/post";
import { events } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { Section } from "@themes/default/components/Section";
import { Card } from "@themes/default/components/Card";
import { Container } from "@themes/default/components/Container";

export const metadata = {
  title: "Admin — Cortex",
  description: "Cortex administration dashboard.",
};

export default async function AdminDashboardPage() {
  const allModules = moduleRegistry.getAll();
  const allThemes = themeRegistry.getAll();

  let postCount = 0;
  try {
    const postRows = await db.select().from(posts);
    postCount = postRows.length;
  } catch {
    // Database may not be available
  }

  let recentEvents: { id: string; type: string; module: string; createdAt: Date }[] = [];
  try {
    recentEvents = await db
      .select({
        id: events.id,
        type: events.type,
        module: events.module,
        createdAt: events.createdAt,
      })
      .from(events)
      .orderBy(desc(events.createdAt))
      .limit(10);
  } catch {
    // Database may not be available
  }

  const stats = [
    { label: "Modules", value: allModules.length },
    { label: "Themes", value: allThemes.length },
    { label: "Blog Posts", value: postCount },
  ];

  return (
    <div className="py-12">
      <Container>
        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ color: "var(--color-text)" }}
        >
          Admin Dashboard
        </h1>
        <p
          className="mt-2 text-lg leading-relaxed"
          style={{ color: "var(--color-muted)" }}
        >
          Overview of your Cortex installation.
        </p>
      </Container>

      {/* Stats */}
      <Section background="default" padding="sm">
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg">
              <p
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: "var(--color-muted)" }}
              >
                {stat.label}
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {stat.value}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Registered Modules */}
      <Section title="Registered Modules" background="default" padding="sm">
        {allModules.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>No modules discovered.</p>
        ) : (
          <div className="space-y-4">
            {allModules.map((mod) => (
              <Card key={mod.id} padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="text-base font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {mod.name}
                    </h3>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {mod.description}
                    </p>
                  </div>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--color-muted)" }}
                  >
                    v{mod.version}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* Recent Events */}
      <Section title="Recent Events" background="muted" padding="sm">
        {recentEvents.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>No events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <Card key={event.id} padding="sm">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span
                      className="font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {event.type}
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: "var(--color-muted)" }}
                    >
                      ({event.module})
                    </span>
                  </div>
                  <time
                    className="text-xs"
                    style={{ color: "var(--color-muted)" }}
                    dateTime={event.createdAt.toISOString()}
                  >
                    {event.createdAt.toLocaleString()}
                  </time>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
