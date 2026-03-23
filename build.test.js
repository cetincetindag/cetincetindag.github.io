import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveSlug, applyFallbacks, sortPosts } from './build.js';

// ── deriveSlug ────────────────────────────────

test('deriveSlug strips date prefix and extension', () => {
  assert.equal(deriveSlug('2019-04-12-on-writing-clearly.md'), 'on-writing-clearly');
});

test('deriveSlug handles filename with no date prefix', () => {
  assert.equal(deriveSlug('my-post.md'), 'my-post');
});

test('deriveSlug strips only leading date prefix', () => {
  assert.equal(deriveSlug('2024-01-01-hello-2024.md'), 'hello-2024');
});

// ── applyFallbacks ────────────────────────────

test('applyFallbacks returns frontmatter unchanged when all fields present', () => {
  const fm = { title: 'Hello', date: '2024-01-01', tags: ['a'], excerpt: 'short' };
  const result = applyFallbacks(fm, 'hello');
  assert.equal(result.title, 'Hello');
  assert.equal(result.date, '2024-01-01');
  assert.deepEqual(result.tags, ['a']);
  assert.equal(result.excerpt, 'short');
});

test('applyFallbacks fills missing title from slug', () => {
  const result = applyFallbacks({}, 'on-writing-clearly');
  assert.equal(result.title, 'On Writing Clearly');
});

test('applyFallbacks fills missing tags with empty array', () => {
  const result = applyFallbacks({}, 'slug');
  assert.deepEqual(result.tags, []);
});

test('applyFallbacks fills missing excerpt with empty string', () => {
  const result = applyFallbacks({}, 'slug');
  assert.equal(result.excerpt, '');
});

test('applyFallbacks fills missing date with today YYYY-MM-DD', () => {
  const result = applyFallbacks({}, 'slug');
  assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
});

// ── sortPosts ─────────────────────────────────

test('sortPosts orders newest first', () => {
  const posts = [
    { date: '2020-01-01' },
    { date: '2023-06-15' },
    { date: '2019-12-31' },
  ];
  const sorted = sortPosts(posts);
  assert.equal(sorted[0].date, '2023-06-15');
  assert.equal(sorted[1].date, '2020-01-01');
  assert.equal(sorted[2].date, '2019-12-31');
});

test('sortPosts does not mutate the original array', () => {
  const posts = [{ date: '2020-01-01' }, { date: '2023-06-15' }];
  const original = [...posts];
  sortPosts(posts);
  assert.deepEqual(posts, original);
});
