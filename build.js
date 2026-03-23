import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

// ── Pure functions (exported for testing) ─────

export function deriveSlug(filename) {
  // Strip leading YYYY-MM-DD- date prefix if present, then strip .md extension
  return filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '');
}

export function applyFallbacks(frontmatter, slug) {
  // Use local date to avoid UTC timezone shifts (e.g. midnight Pacific → previous UTC day)
  const today = new Intl.DateTimeFormat('en-CA').format(new Date()); // returns YYYY-MM-DD in local time
  const titleFromSlug = slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: frontmatter.title || titleFromSlug,
    date: frontmatter.date || today,
    tags: frontmatter.tags || [],
    excerpt: frontmatter.excerpt || '',
  };
}

export function sortPosts(posts) {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

// ── HTML templates ────────────────────────────

const currentYear = new Date().getFullYear();

function renderTags(tags) {
  return tags.map(t => `<span class="tag">${t}</span>`).join(' ');
}

function renderPostPage(post) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} — cetincetindag</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <a class="back-link" href="index.html">← back</a>
    <div class="post-header">
      <h1>${post.title}</h1>
      <div class="post-meta">${post.date}${post.tags.length ? ' &nbsp;·&nbsp; ' + renderTags(post.tags) : ''}</div>
    </div>
    <hr class="post-divider">
    <div class="post-body">
      ${post.bodyHtml}
    </div>
    <footer class="site-footer">© ${currentYear} cetincetindag</footer>
  </div>
</body>
</html>`;
}

function renderIndexPage(posts) {
  const items = posts.map(post => `
    <li class="post-item">
      <div class="post-title"><a href="${post.slug}.html">${post.title}</a></div>
      <div class="post-meta">${post.date}${post.tags.length ? ' &nbsp;·&nbsp; ' + renderTags(post.tags) : ''}</div>
      ${post.excerpt ? `<div class="post-excerpt">${post.excerpt}</div>` : ''}
    </li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cetincetindag</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="site-header">
      <a class="site-title" href="index.html">cetincetindag</a>
      <div class="site-subtitle">a personal blog</div>
    </header>
    <ul class="post-list">
      ${items}
    </ul>
    <footer class="site-footer">© ${currentYear} cetincetindag</footer>
  </div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────

function main() {
  const postsDir = path.join(process.cwd(), 'posts');
  const outDir = process.cwd();

  if (!fs.existsSync(postsDir)) {
    console.error('No posts/ directory found.');
    process.exit(1);
  }

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { data, content } = matter(raw);
      const slug = deriveSlug(file);
      const fm = applyFallbacks(data, slug);
      const bodyHtml = marked(content);
      posts.push({ slug, ...fm, bodyHtml });
    } catch (err) {
      console.warn(`Warning: skipping ${file} — ${err.message}`);
    }
  }

  const sorted = sortPosts(posts);

  for (const post of sorted) {
    const html = renderPostPage(post);
    fs.writeFileSync(path.join(outDir, `${post.slug}.html`), html, 'utf8');
    console.log(`  ✓ ${post.slug}.html`);
  }

  const indexHtml = renderIndexPage(sorted);
  fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');
  console.log('  ✓ index.html');
  console.log(`\nBuild complete — ${sorted.length} post(s).`);
}

// Only run when executed directly (not when imported by tests)
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
