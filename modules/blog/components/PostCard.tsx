import { Card } from "@themes/default/components/Card";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[];
  author?: string;
  date?: string | null;
}

export function PostCard({ title, slug, excerpt, tags, author, date }: PostCardProps) {
  return (
    <a href={`/blog/${slug}`} className="block no-underline">
      <Card hover padding="lg">
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h2>

        {excerpt && (
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "var(--color-muted)" }}
          >
            {excerpt}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
          {author && <span>{author}</span>}
          {date && (
            <>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={date}>
                {new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </>
          )}
        </div>

        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, white)",
                  color: "var(--color-primary)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Card>
    </a>
  );
}
