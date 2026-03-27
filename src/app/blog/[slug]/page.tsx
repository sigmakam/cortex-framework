import { db } from "@/lib/db";
import { posts } from "@modules/blog/entities/post";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BlogLayout } from "@themes/default/layouts/BlogLayout";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  const results = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  const post = results[0];

  if (!post || post.status !== "published") {
    notFound();
  }

  return (
    <BlogLayout>
      <article>
        <header className="mb-8">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--color-text)" }}
          >
            {post.title}
          </h1>

          <div
            className="mt-4 flex flex-wrap items-center gap-3 text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            <span>{post.author}</span>
            {post.publishedAt && (
              <>
                <span aria-hidden="true">&middot;</span>
                <time dateTime={post.publishedAt.toISOString()}>
                  {post.publishedAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-primary) 10%, white)",
                    color: "var(--color-primary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div
          className="prose prose-lg max-w-none"
          style={{ color: "var(--color-text)" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </BlogLayout>
  );
}
