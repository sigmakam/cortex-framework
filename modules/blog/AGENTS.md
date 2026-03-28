# Blog Module

## Overview

The Blog module provides a complete content publishing system with posts, comments, tagging, and moderation. It is a first-party Cortex module that demonstrates the framework's entity, API, event, MCP, and data layer conventions.

Module ID: `blog`
Version: `1.0.0`

## Entities

### Post (`blog_posts` table)

| Field       | Type              | Notes                              |
|-------------|-------------------|------------------------------------|
| id          | UUID              | Primary key, auto-generated        |
| title       | VARCHAR(255)      | Required                           |
| slug        | VARCHAR(255)      | Unique, auto-generated from title  |
| content     | TEXT              | Defaults to empty string           |
| excerpt     | VARCHAR(500)      | Optional, auto-derived from content|
| status      | VARCHAR(20)       | "draft" or "published"             |
| author      | VARCHAR(100)      | Defaults to "Anonymous"            |
| tags        | JSONB (string[])  | Array of tag strings               |
| metadata    | JSONB (object)    | Arbitrary key-value pairs          |
| publishedAt | TIMESTAMPTZ       | Set when published                 |
| createdAt   | TIMESTAMPTZ       | Auto-set on creation               |
| updatedAt   | TIMESTAMPTZ       | Auto-set on creation and update    |

### Comment (`blog_comments` table)

| Field       | Type          | Notes                                  |
|-------------|---------------|----------------------------------------|
| id          | UUID          | Primary key, auto-generated            |
| postId      | UUID          | FK to blog_posts, cascade delete       |
| parentId    | UUID          | Optional, for threaded replies         |
| authorName  | VARCHAR(100)  | Required                               |
| authorEmail | VARCHAR(255)  | Required                               |
| content     | TEXT          | Required                               |
| status      | VARCHAR(20)   | "pending" or "approved"                |
| createdAt   | TIMESTAMPTZ   | Auto-set on creation                   |

## API Endpoints

Base path: `/api/modules/blog`

### Posts (`/api/modules/blog/posts`)

| Method | Path                  | Description           |
|--------|-----------------------|-----------------------|
| GET    | /posts                | List posts (paginated, filterable by status/tag/search) |
| POST   | /posts                | Create a new post     |
| GET    | /posts/:id            | Get a single post     |
| PUT    | /posts/:id            | Update a post         |
| DELETE | /posts/:id            | Delete a post         |
| POST   | /posts/:id/publish    | Publish a draft post  |

Query parameters for GET /posts:
- `status` - Filter by status ("draft" or "published")
- `tag` - Filter by tag
- `search` - Search by title (ILIKE)
- `page` - Page number (default: 1)
- `perPage` - Items per page (default: 10, max: 100)

### Comments (`/api/modules/blog/comments`)

| Method | Path            | Description              |
|--------|-----------------|--------------------------|
| GET    | /comments       | List comments (filterable by postId/status) |
| POST   | /comments       | Create a comment         |
| GET    | /comments/:id   | Get a single comment     |
| PUT    | /comments/:id   | Update a comment         |
| DELETE | /comments/:id   | Delete a comment         |

Query parameters for GET /comments:
- `postId` - Filter by post
- `status` - Filter by status ("pending" or "approved")
- `page` - Page number (default: 1)
- `perPage` - Items per page (default: 10, max: 100)

## Events Published

| Event             | Payload                                    | When                       |
|-------------------|--------------------------------------------|----------------------------|
| post.created      | post_id, post_title, author                | A new post is created      |
| post.published    | post_id, post_title, author, tags          | A post is published        |
| post.updated      | post_id, post_title, author, changes[]     | A post is updated          |
| post.deleted      | post_id, post_title                        | A post is deleted          |
| comment.created   | post_id, comment_id, comment_length        | A comment is submitted     |
| comment.approved  | comment_id, post_id                        | A comment is approved      |

## MCP Tools

### Auto-Generated CRUD Tools

These tools are generated automatically by the Cortex MCP server from the API handlers:

- `create_post` - Create a new post
- `get_post` - Get a post by ID
- `list_posts` - List posts with pagination and search
- `update_post` - Update a post by ID
- `delete_post` - Delete a post by ID
- `create_comment` - Create a comment
- `get_comment` - Get a comment by ID
- `list_comments` - List comments with pagination
- `update_comment` - Update a comment by ID
- `delete_comment` - Delete a comment by ID

### Custom MCP Tools

- `publish_post` - Publish a draft post (sets status, publishedAt, fires event)
  - Input: `{ postId: string }`
- `search_posts` - Full-text search across titles and content
  - Input: `{ query: string, limit?: number }`

## GTM Data Layer Events

| Domain Event      | Data Layer Event     | Parameters                          |
|-------------------|----------------------|-------------------------------------|
| post.created      | content_created      | post_id, post_title, author         |
| post.published    | content_published    | post_id, post_title, author, tags   |
| comment.created   | comment_submitted    | post_id, comment_length             |

## Common AI Tasks

1. **Create and publish a blog post**: Use `create_post` with status "draft", then `publish_post` to publish it.
2. **Search for content**: Use `search_posts` with a keyword query.
3. **Moderate comments**: Use `list_comments` with status "pending", review content, then `update_comment` to set status to "approved".
4. **Get recent posts**: Use `list_posts` with default pagination to see the latest content.
5. **Tag-based filtering**: Use `list_posts` with the `tag` search parameter to find posts by topic.
