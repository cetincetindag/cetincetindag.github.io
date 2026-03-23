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
