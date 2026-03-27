import { db } from "@/lib/db";
import { posts } from "@modules/blog/entities/post";
import { eq, desc } from "drizzle-orm";
import { BlogLayout } from "@themes/default/layouts/BlogLayout";
import { PostCard } from "@modules/blog/components/PostCard";

export const metadata = {
  title: "Blog — Cortex",
  description: "Latest posts from the Cortex AI-First Web Framework blog.",
};

export default async function BlogListPage() {
  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  return (
    <BlogLayout>
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: "var(--color-text)" }}
      >
        Blog
      </h1>
      <p
        className="mt-2 text-lg leading-relaxed"
        style={{ color: "var(--color-muted)" }}
      >
        Insights on AI-first development, module architecture, and web performance.
      </p>

      {allPosts.length === 0 ? (
        <div className="mt-12 text-center">
          <p style={{ color: "var(--color-muted)" }}>
            No posts published yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {allPosts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              tags={post.tags}
              author={post.author}
              date={post.publishedAt?.toISOString() ?? null}
            />
          ))}
        </div>
      )}
    </BlogLayout>
  );
}
